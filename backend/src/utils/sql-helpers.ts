import { sql } from '@vercel/postgres';

/**
 * Validate table/column name to prevent SQL injection
 */
function validateIdentifier(name: string): boolean {
  return /^[a-z_][a-z0-9_]*$/i.test(name);
}

/**
 * Helper function to build dynamic UPDATE queries safely
 * Uses sql template literals with validated identifiers
 */
export async function updateEntity(
  tableName: string,
  id: string,
  updates: Record<string, any>,
  whereField: string,
  whereValue: any
): Promise<any[]> {
  // Validate identifiers
  if (!validateIdentifier(tableName) || !validateIdentifier(whereField)) {
    throw new Error('Invalid table or field name');
  }

  const allowedFields = Object.keys(updates);
  if (allowedFields.length === 0) {
    throw new Error('No fields to update');
  }

  // Validate all field names
  for (const field of allowedFields) {
    if (!validateIdentifier(field)) {
      throw new Error(`Invalid field name: ${field}`);
    }
  }

  // Build SET clause using template literals
  const setParts: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    const value = updates[field];
    if (field.includes('_settings') || field === 'history') {
      // JSONB fields
      setParts.push(`${field} = $${paramIndex}::jsonb`);
      values.push(typeof value === 'string' ? value : JSON.stringify(value));
    } else {
      setParts.push(`${field} = $${paramIndex}`);
      values.push(value);
    }
    paramIndex++;
  }
  setParts.push(`updated_date = CURRENT_TIMESTAMP`);

  // Add WHERE clause values
  values.push(id);
  values.push(whereValue);

  // Use template literal with validated identifiers
  // Note: @vercel/postgres doesn't support parameterized identifiers
  // So we use string interpolation for identifiers (validated) and parameters for values
  const query = `
    UPDATE ${tableName}
    SET ${setParts.join(', ')}
    WHERE id = $${paramIndex} AND ${whereField} = $${paramIndex + 1}
    RETURNING *
  `;

  // Use pg directly for parameterized queries
  // @vercel/postgres sql template doesn't support this pattern
  // We need to use the underlying pg client
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } finally {
    await pool.end();
  }
}

