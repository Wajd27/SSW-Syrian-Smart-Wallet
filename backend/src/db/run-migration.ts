import { getPool } from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration(migrationFile: string) {
  try {
    console.log(`Running migration: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, '../../../database/migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    const pool = getPool();
    await pool.query(migrationSQL);
    
    console.log(`✓ Migration ${migrationFile} completed successfully!`);
  } catch (error: any) {
    // Ignore "already exists" errors
    if (error.message?.includes('already exists') || error.message?.includes('duplicate') || error.message?.includes('does not exist')) {
      console.log(`⚠ Migration ${migrationFile} already applied or column exists, skipping...`);
    } else {
      console.error(`✗ Migration ${migrationFile} failed:`, error.message);
      throw error;
    }
  }
}

async function runAllMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Run migrations in order
    const migrations = [
      '001_update_old_family_members.sql',
      '002_add_currency_to_debts.sql',
    ];
    
    for (const migration of migrations) {
      await runMigration(migration);
    }
    
    console.log('✓ All migrations completed successfully!');
  } catch (error: any) {
    console.error('✗ Migration process failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runAllMigrations();

