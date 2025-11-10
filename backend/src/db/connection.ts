import { Pool } from 'pg';

// Create connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=require') || connectionString.includes('supabase') 
        ? { rejectUnauthorized: false } 
        : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
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
    // Test connection
    await db.query('SELECT 1');
    isConnected = true;
    console.log('Database connection established');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
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

