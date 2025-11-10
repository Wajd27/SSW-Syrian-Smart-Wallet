import { sql } from '@vercel/postgres';

/**
 * Escape SQL string value
 */
function escapeSQL(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (typeof value === 'boolean') {
    return value.toString();
  }
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return String(value);
}

/**
 * Helper function to build dynamic UPDATE queries safely
 */
export async function updateEntity(
  tableName: string,
  id: string,
  updates: Record<string, any>,
  whereField: string,
  whereValue: any
): Promise<any[]> {
  const allowedFields = Object.keys(updates);
  if (allowedFields.length === 0) {
    throw new Error('No fields to update');
  }

  // Build SET clause
  const setParts: string[] = [];
  for (const field of allowedFields) {
    const value = updates[field];
    if (field.includes('_settings') || field === 'history') {
      // JSONB fields
      setParts.push(`${field} = ${escapeSQL(value)}::jsonb`);
    } else {
      setParts.push(`${field} = ${escapeSQL(value)}`);
    }
  }
  setParts.push(`updated_date = CURRENT_TIMESTAMP`);

  // Build WHERE clause
  const whereClause = `${whereField} = ${escapeSQL(whereValue)}`;

  // Build the full query
  const query = `
    UPDATE ${tableName}
    SET ${setParts.join(', ')}
    WHERE id = ${escapeSQL(id)} AND ${whereClause}
    RETURNING *
  `;

  const result = await sql.unsafe(query);
  return result.rows;
}

