-- Wallet Management PWA Database Schema
-- PostgreSQL Schema for all entities

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    last_exchange_rate DECIMAL(10, 4),
    default_currency VARCHAR(3) DEFAULT 'SYP',
    notification_settings JSONB DEFAULT '{}'::jsonb
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    initial_balance DECIMAL(15, 2) DEFAULT 0,
    owner_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true
);

-- Family Members table
CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100),
    date_of_birth DATE,
    spending_limit DECIMAL(15, 2),
    spending_limit_currency VARCHAR(3) DEFAULT 'SYP',
    is_active BOOLEAN DEFAULT true,
    added_by VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount_syp DECIMAL(15, 2) NOT NULL,
    amount_usd DECIMAL(15, 2) NOT NULL,
    exchange_rate DECIMAL(10, 4) NOT NULL,
    primary_currency VARCHAR(3) NOT NULL CHECK (primary_currency IN ('SYP', 'USD')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(100),
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    transaction_date DATE NOT NULL,
    notes TEXT,
    receipt_uri TEXT
);

-- Recurring Transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount_syp DECIMAL(15, 2) NOT NULL,
    amount_usd DECIMAL(15, 2) NOT NULL,
    exchange_rate DECIMAL(10, 4) NOT NULL,
    primary_currency VARCHAR(3) NOT NULL CHECK (primary_currency IN ('SYP', 'USD')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(100),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    next_occurrence DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    wallet_owner VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL
);

-- Savings Goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0,
    target_date DATE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true
);

-- Investments table
CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    wallet_owner VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    savings_goal_id UUID REFERENCES savings_goals(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    initial_amount DECIMAL(15, 2) NOT NULL,
    current_value DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    purchase_date DATE NOT NULL,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
    expected_return DECIMAL(5, 2),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    history JSONB DEFAULT '[]'::jsonb
);

-- Debts table
CREATE TABLE IF NOT EXISTS debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    original_amount DECIMAL(15, 2) NOT NULL,
    current_balance DECIMAL(15, 2) NOT NULL,
    minimum_payment DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) DEFAULT 0,
    due_date DATE,
    creditor VARCHAR(255),
    currency VARCHAR(3) DEFAULT 'SYP',
    is_active BOOLEAN DEFAULT true,
    wallet_owner VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE
);

-- Exchange Rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rate DECIMAL(10, 4) NOT NULL,
    source VARCHAR(100) NOT NULL,
    date DATE NOT NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    wallet_owner VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE
);

-- AI Recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    impact VARCHAR(20) CHECK (impact IN ('low', 'medium', 'high')),
    effort VARCHAR(20) CHECK (effort IN ('low', 'medium', 'high')),
    estimated_savings DECIMAL(15, 2),
    target_id UUID,
    is_implemented BOOLEAN DEFAULT false,
    wallet_owner VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wallets_owner_email ON wallets(owner_email);
CREATE INDEX IF NOT EXISTS idx_wallets_is_active ON wallets(is_active);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_wallet_owner ON recurring_transactions(wallet_owner);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_occurrence ON recurring_transactions(next_occurrence);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_is_active ON recurring_transactions(is_active);
CREATE INDEX IF NOT EXISTS idx_budgets_wallet_id ON budgets(wallet_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
CREATE INDEX IF NOT EXISTS idx_savings_goals_wallet_id ON savings_goals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_investments_wallet_owner ON investments(wallet_owner);
CREATE INDEX IF NOT EXISTS idx_investments_savings_goal_id ON investments(savings_goal_id);
CREATE INDEX IF NOT EXISTS idx_debts_wallet_owner ON debts(wallet_owner);
CREATE INDEX IF NOT EXISTS idx_family_members_added_by ON family_members(added_by);
CREATE INDEX IF NOT EXISTS idx_notifications_wallet_owner ON notifications(wallet_owner);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_wallet_owner ON ai_recommendations(wallet_owner);

-- Create function to update updated_date automatically
CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_date (DROP IF EXISTS first to avoid errors)
DROP TRIGGER IF EXISTS update_users_updated_date ON users;
CREATE TRIGGER update_users_updated_date BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

DROP TRIGGER IF EXISTS update_wallets_updated_date ON wallets;
CREATE TRIGGER update_wallets_updated_date BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

DROP TRIGGER IF EXISTS update_transactions_updated_date ON transactions;
CREATE TRIGGER update_transactions_updated_date BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

DROP TRIGGER IF EXISTS update_recurring_transactions_updated_date ON recurring_transactions;
CREATE TRIGGER update_recurring_transactions_updated_date BEFORE UPDATE ON recurring_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

DROP TRIGGER IF EXISTS update_budgets_updated_date ON budgets;
CREATE TRIGGER update_budgets_updated_date BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

DROP TRIGGER IF EXISTS update_savings_goals_updated_date ON savings_goals;
CREATE TRIGGER update_savings_goals_updated_date BEFORE UPDATE ON savings_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

DROP TRIGGER IF EXISTS update_investments_updated_date ON investments;
CREATE TRIGGER update_investments_updated_date BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

DROP TRIGGER IF EXISTS update_debts_updated_date ON debts;
CREATE TRIGGER update_debts_updated_date BEFORE UPDATE ON debts
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

DROP TRIGGER IF EXISTS update_family_members_updated_date ON family_members;
CREATE TRIGGER update_family_members_updated_date BEFORE UPDATE ON family_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

DROP TRIGGER IF EXISTS update_notifications_updated_date ON notifications;
CREATE TRIGGER update_notifications_updated_date BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

DROP TRIGGER IF EXISTS update_ai_recommendations_updated_date ON ai_recommendations;
CREATE TRIGGER update_ai_recommendations_updated_date BEFORE UPDATE ON ai_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

DROP TRIGGER IF EXISTS update_exchange_rates_updated_date ON exchange_rates;
CREATE TRIGGER update_exchange_rates_updated_date BEFORE UPDATE ON exchange_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();

