import { sql } from '@vercel/postgres';

let isConnected = false;

export async function initDatabase() {
  if (isConnected) {
    return;
  }

  try {
    // Test connection
    await sql`SELECT 1`;
    isConnected = true;
    console.log('Database connection established');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export { sql };
export const db = sql;

