import {
  User,
  Wallet,
  Transaction,
  RecurringTransaction,
  Budget,
  SavingsGoal,
  FamilyMember,
  ExchangeRate,
  Notification,
  AIRecommendation,
  Investment,
  Debt,
} from './entities';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface FilterOptions {
  [key: string]: any;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Entity-specific filter types
export interface WalletFilter extends FilterOptions {
  owner_email?: string;
  is_active?: boolean;
  currency?: string;
}

export interface TransactionFilter extends FilterOptions {
  wallet_id?: string;
  type?: 'income' | 'expense';
  category?: string;
  family_member_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface RecurringTransactionFilter extends FilterOptions {
  wallet_id?: string;
  wallet_owner?: string;
  is_active?: boolean;
}

export interface BudgetFilter extends FilterOptions {
  wallet_id?: string;
  month?: string;
  category?: string;
}

export interface SavingsGoalFilter extends FilterOptions {
  wallet_id?: string;
  is_active?: boolean;
}

export interface InvestmentFilter extends FilterOptions {
  wallet_owner?: string;
  savings_goal_id?: string;
  is_active?: boolean;
}

export interface DebtFilter extends FilterOptions {
  wallet_owner?: string;
  is_active?: boolean;
}

export interface FamilyMemberFilter extends FilterOptions {
  added_by?: string;
  is_active?: boolean;
}

export interface NotificationFilter extends FilterOptions {
  wallet_owner?: string;
  is_read?: boolean;
  type?: string;
}

