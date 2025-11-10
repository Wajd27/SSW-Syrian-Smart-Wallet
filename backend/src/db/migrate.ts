import { sql } from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('Starting database migration...');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql.unsafe(statement);
          console.log('✓ Executed statement');
        } catch (error: any) {
          // Ignore "already exists" errors
          if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
            console.log('⚠ Statement already exists, skipping...');
          } else {
            console.error('✗ Error executing statement:', error.message);
            throw error;
          }
        }
      }
    }

    console.log('✓ Database migration completed successfully!');
  } catch (error: any) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigrations();

