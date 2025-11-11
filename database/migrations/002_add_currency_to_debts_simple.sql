-- Simple migration: Add currency column to debts table
-- Run this in Vercel SQL Editor if the column doesn't exist

ALTER TABLE debts ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'SYP';

