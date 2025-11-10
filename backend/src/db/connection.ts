import { Pool } from 'pg';

// Create connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    let connectionString = process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }

    // Log connection string info (without password)
    const connectionInfo = connectionString.replace(/:([^:@]+)@/, ':****@');
    console.log('Connecting to database:', connectionInfo.split('@')[1] || 'unknown');

    // Check if this is a Supabase connection
    const isSupabase = connectionString.includes('supabase') || 
                       connectionString.includes('pooler.supabase.com');

    // Remove sslmode from connection string if present (we'll handle SSL separately)
    connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '');

    const poolConfig: any = {
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000, // Increased timeout for Supabase
    };

    // Always enable SSL for Supabase with rejectUnauthorized: false
    // This is required because Supabase uses SSL but certificates may not be in default chain
    if (isSupabase) {
      poolConfig.ssl = {
        rejectUnauthorized: false,
      };
      console.log('SSL configured for Supabase connection (rejectUnauthorized: false)');
    } else if (connectionString.includes('sslmode=require')) {
      // For other SSL connections, also use rejectUnauthorized: false
      poolConfig.ssl = {
        rejectUnauthorized: false,
      };
      console.log('SSL configured for connection (rejectUnauthorized: false)');
    }

    pool = new Pool(poolConfig);

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    // Log pool creation
    console.log('Database pool created');
  }

  return pool;
}

let isConnected = false;

export async function initDatabase() {
  if (isConnected) {
    return;
  }

  try {
    const db = getPool();
    console.log('Testing database connection...');
    // Test connection with a shorter timeout
    const result = await Promise.race([
      db.query('SELECT 1'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      )
    ]);
    isConnected = true;
    console.log('Database connection established successfully');
  } catch (error: any) {
    console.error('Database connection error:', error.message || error);
    console.error('Error code:', error.code);
    // Don't throw - let individual queries handle their own errors
    // This allows the app to start even if initial connection fails
    isConnected = false;
  }
}

// Create a sql template function that mimics @vercel/postgres API
export function sql(strings: TemplateStringsArray, ...values: any[]) {
  const pool = getPool();
  
  // Build the query with parameterized values
  let query = strings[0];
  const params: any[] = [];
  
  for (let i = 0; i < values.length; i++) {
    params.push(values[i]);
    query += `$${params.length}`;
    query += strings[i + 1];
  }
  
  // Return a promise that resolves to an object with rows property (matching @vercel/postgres API)
  return pool.query(query, params).then(result => ({
    rows: result.rows,
    rowCount: result.rowCount,
    command: result.command,
  }));
}

export const db = { query: (text: string, params?: any[]) => getPool().query(text, params) };

