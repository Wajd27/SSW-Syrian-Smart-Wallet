-- Migration: Add currency column to debts table
-- This migration adds the currency column to the debts table if it doesn't exist

-- Check if column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debts' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE debts ADD COLUMN currency VARCHAR(3) DEFAULT 'SYP';
    END IF;
END $$;

