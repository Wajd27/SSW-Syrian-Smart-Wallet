// Base entity interface
export interface BaseEntity {
  id: string;
  created_date: string;
  updated_date: string;
}

// User Entity
export interface User extends BaseEntity {
  full_name: string;
  email: string;
  role: string;
  last_exchange_rate?: number;
  default_currency: string;
  notification_settings: NotificationSettings;
}

export interface NotificationSettings {
  recurring_reminders?: boolean;
  budget_alerts?: boolean;
  budget_threshold?: number; // percentage
  savings_milestones?: boolean;
  investment_updates?: boolean;
  // Feedback preferences
  haptic_feedback_enabled?: boolean;
  sound_effects_enabled?: boolean;
  sound_volume?: number; // 0-1, default 0.4
}

// Wallet Entity
export interface Wallet extends BaseEntity {
  name: string;
  type: string;
  currency: string;
  initial_balance: number;
  owner_email: string;
  is_active: boolean;
}

// Transaction Entity
export interface Transaction extends BaseEntity {
  wallet_id: string;
  title: string;
  amount_syp: number;
  amount_usd: number;
  exchange_rate: number;
  primary_currency: 'SYP' | 'USD';
  type: 'income' | 'expense';
  category: string;
  family_member_id?: string;
  transaction_date: string;
  notes?: string;
  receipt_uri?: string;
}

// RecurringTransaction Entity
export interface RecurringTransaction extends BaseEntity {
  wallet_id: string;
  title: string;
  amount_syp: number;
  amount_usd: number;
  exchange_rate: number;
  primary_currency: 'SYP' | 'USD';
  type: 'income' | 'expense';
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_occurrence: string;
  is_active: boolean;
  family_member_id?: string;
  wallet_owner: string;
}

// Budget Entity
export interface Budget extends BaseEntity {
  wallet_id: string;
  category: string;
  amount: number;
  month: string; // YYYY-MM format
}

// SavingsGoal Entity
export interface SavingsGoal extends BaseEntity {
  wallet_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  description?: string;
  category: string;
  is_active: boolean;
}

// FamilyMember Entity
export interface FamilyMember extends BaseEntity {
  name: string;
  relationship: string;
  date_of_birth?: string;
  is_active: boolean;
  added_by: string;
}

// ExchangeRate Entity
export interface ExchangeRate extends BaseEntity {
  rate: number;
  source: string;
  date: string;
}

// Notification Entity
export interface Notification extends BaseEntity {
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url?: string;
  wallet_owner: string;
}

// AIRecommendation Entity
export interface AIRecommendation extends BaseEntity {
  type: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  estimated_savings?: number;
  target_id?: string;
  is_implemented: boolean;
  wallet_owner: string;
}

// Investment Entity
export interface Investment extends BaseEntity {
  wallet_owner: string;
  savings_goal_id?: string;
  name: string;
  type: string;
  initial_amount: number;
  current_value: number;
  currency: string;
  purchase_date: string;
  risk_level: 'low' | 'medium' | 'high';
  expected_return?: number;
  notes?: string;
  is_active: boolean;
  history: InvestmentHistory[];
}

export interface InvestmentHistory {
  date: string;
  value: number;
}

// Debt Entity
export interface Debt extends BaseEntity {
  name: string;
  type: string;
  original_amount: number;
  current_balance: number;
  minimum_payment: number;
  interest_rate: number;
  due_date: string;
  creditor: string;
  currency: string;
  is_active: boolean;
  wallet_owner: string;
}

