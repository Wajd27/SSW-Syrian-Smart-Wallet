# Database Migrations

## Migration 002: Add currency column to debts table

### Problem
The `currency` column is missing from the `debts` table, causing errors when updating debts.

### Solution
Run the following SQL in your Vercel Postgres SQL Editor:

```sql
ALTER TABLE debts ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'SYP';
```

### Steps to Apply:

1. Go to your Vercel Dashboard
2. Navigate to **Storage** → Your Postgres Database
3. Click on **SQL Editor**
4. Click **New Query**
5. Copy and paste the SQL above
6. Click **Run** (or press Ctrl+Enter)
7. Verify the column was added successfully

### Alternative: Using psql

```bash
psql "YOUR_POSTGRES_URL" -c "ALTER TABLE debts ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'SYP';"
```

### Verification

After running the migration, verify it worked:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'debts' AND column_name = 'currency';
```

You should see:
- column_name: `currency`
- data_type: `character varying`
- column_default: `'SYP'::character varying`

