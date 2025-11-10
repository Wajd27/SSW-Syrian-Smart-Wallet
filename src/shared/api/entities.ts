import { apiClient } from './client';
import {
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
  PaginatedResponse,
  WalletFilter,
  TransactionFilter,
  RecurringTransactionFilter,
  BudgetFilter,
  SavingsGoalFilter,
  InvestmentFilter,
  DebtFilter,
  FamilyMemberFilter,
  NotificationFilter,
} from '../types';

// Generic entity operations (simulating Base44.entities pattern)
export const entities = {
  // Wallet operations
  wallet: {
    async create(data: Omit<Wallet, 'id' | 'created_date' | 'updated_date'>): Promise<Wallet> {
      return apiClient.post<Wallet>('/entities/wallet', data);
    },
    async get(id: string): Promise<Wallet> {
      return apiClient.get<Wallet>(`/entities/wallet/${id}`);
    },
    async filter(filters: WalletFilter = {}): Promise<Wallet[]> {
      return apiClient.get<Wallet[]>('/entities/wallet', filters);
    },
    async update(id: string, data: Partial<Wallet>): Promise<Wallet> {
      return apiClient.patch<Wallet>(`/entities/wallet/${id}`, data);
    },
    async delete(id: string): Promise<void> {
      return apiClient.delete(`/entities/wallet/${id}`);
    },
  },

  // Transaction operations
  transaction: {
    async create(data: Omit<Transaction, 'id' | 'created_date' | 'updated_date'>): Promise<Transaction> {
      return apiClient.post<Transaction>('/entities/transaction', data);
    },
    async get(id: string): Promise<Transaction> {
      return apiClient.get<Transaction>(`/entities/transaction/${id}`);
    },
    async filter(filters: TransactionFilter = {}): Promise<Transaction[]> {
      return apiClient.get<Transaction[]>('/entities/transaction', filters);
    },
    async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
      return apiClient.patch<Transaction>(`/entities/transaction/${id}`, data);
    },
    async delete(id: string): Promise<void> {
      return apiClient.delete(`/entities/transaction/${id}`);
    },
  },

  // RecurringTransaction operations
  recurringTransaction: {
    async create(data: Omit<RecurringTransaction, 'id' | 'created_date' | 'updated_date'>): Promise<RecurringTransaction> {
      return apiClient.post<RecurringTransaction>('/entities/recurring-transaction', data);
    },
    async get(id: string): Promise<RecurringTransaction> {
      return apiClient.get<RecurringTransaction>(`/entities/recurring-transaction/${id}`);
    },
    async filter(filters: RecurringTransactionFilter = {}): Promise<RecurringTransaction[]> {
      return apiClient.get<RecurringTransaction[]>('/entities/recurring-transaction', filters);
    },
    async update(id: string, data: Partial<RecurringTransaction>): Promise<RecurringTransaction> {
      return apiClient.patch<RecurringTransaction>(`/entities/recurring-transaction/${id}`, data);
    },
    async delete(id: string): Promise<void> {
      return apiClient.delete(`/entities/recurring-transaction/${id}`);
    },
  },

  // Budget operations
  budget: {
    async create(data: Omit<Budget, 'id' | 'created_date' | 'updated_date'>): Promise<Budget> {
      return apiClient.post<Budget>('/entities/budget', data);
    },
    async get(id: string): Promise<Budget> {
      return apiClient.get<Budget>(`/entities/budget/${id}`);
    },
    async filter(filters: BudgetFilter = {}): Promise<Budget[]> {
      return apiClient.get<Budget[]>('/entities/budget', filters);
    },
    async update(id: string, data: Partial<Budget>): Promise<Budget> {
      return apiClient.patch<Budget>(`/entities/budget/${id}`, data);
    },
    async delete(id: string): Promise<void> {
      return apiClient.delete(`/entities/budget/${id}`);
    },
  },

  // SavingsGoal operations
  savingsGoal: {
    async create(data: Omit<SavingsGoal, 'id' | 'created_date' | 'updated_date'>): Promise<SavingsGoal> {
      return apiClient.post<SavingsGoal>('/entities/savings-goal', data);
    },
    async get(id: string): Promise<SavingsGoal> {
      return apiClient.get<SavingsGoal>(`/entities/savings-goal/${id}`);
    },
    async filter(filters: SavingsGoalFilter = {}): Promise<SavingsGoal[]> {
      return apiClient.get<SavingsGoal[]>('/entities/savings-goal', filters);
    },
    async update(id: string, data: Partial<SavingsGoal>): Promise<SavingsGoal> {
      return apiClient.patch<SavingsGoal>(`/entities/savings-goal/${id}`, data);
    },
    async delete(id: string): Promise<void> {
      return apiClient.delete(`/entities/savings-goal/${id}`);
    },
  },

  // Investment operations
  investment: {
    async create(data: Omit<Investment, 'id' | 'created_date' | 'updated_date'>): Promise<Investment> {
      return apiClient.post<Investment>('/entities/investment', data);
    },
    async get(id: string): Promise<Investment> {
      return apiClient.get<Investment>(`/entities/investment/${id}`);
    },
    async filter(filters: InvestmentFilter = {}): Promise<Investment[]> {
      return apiClient.get<Investment[]>('/entities/investment', filters);
    },
    async update(id: string, data: Partial<Investment>): Promise<Investment> {
      return apiClient.patch<Investment>(`/entities/investment/${id}`, data);
    },
    async delete(id: string): Promise<void> {
      return apiClient.delete(`/entities/investment/${id}`);
    },
  },

  // Debt operations
  debt: {
    async create(data: Omit<Debt, 'id' | 'created_date' | 'updated_date'>): Promise<Debt> {
      return apiClient.post<Debt>('/entities/debt', data);
    },
    async get(id: string): Promise<Debt> {
      return apiClient.get<Debt>(`/entities/debt/${id}`);
    },
    async filter(filters: DebtFilter = {}): Promise<Debt[]> {
      return apiClient.get<Debt[]>('/entities/debt', filters);
    },
    async update(id: string, data: Partial<Debt>): Promise<Debt> {
      return apiClient.patch<Debt>(`/entities/debt/${id}`, data);
    },
    async delete(id: string): Promise<void> {
      return apiClient.delete(`/entities/debt/${id}`);
    },
  },

  // FamilyMember operations
  familyMember: {
    async create(data: Omit<FamilyMember, 'id' | 'created_date' | 'updated_date'>): Promise<FamilyMember> {
      return apiClient.post<FamilyMember>('/entities/family-member', data);
    },
    async get(id: string): Promise<FamilyMember> {
      return apiClient.get<FamilyMember>(`/entities/family-member/${id}`);
    },
    async filter(filters: FamilyMemberFilter = {}): Promise<FamilyMember[]> {
      return apiClient.get<FamilyMember[]>('/entities/family-member', filters);
    },
    async update(id: string, data: Partial<FamilyMember>): Promise<FamilyMember> {
      return apiClient.patch<FamilyMember>(`/entities/family-member/${id}`, data);
    },
    async delete(id: string): Promise<void> {
      return apiClient.delete(`/entities/family-member/${id}`);
    },
  },

  // ExchangeRate operations
  exchangeRate: {
    async create(data: Omit<ExchangeRate, 'id' | 'created_date' | 'updated_date'>): Promise<ExchangeRate> {
      return apiClient.post<ExchangeRate>('/entities/exchange-rate', data);
    },
    async get(id: string): Promise<ExchangeRate> {
      return apiClient.get<ExchangeRate>(`/entities/exchange-rate/${id}`);
    },
    async filter(filters: Record<string, any> = {}): Promise<ExchangeRate[]> {
      return apiClient.get<ExchangeRate[]>('/entities/exchange-rate', filters);
    },
    async getLatest(): Promise<ExchangeRate> {
      const rates = await apiClient.get<ExchangeRate[]>('/entities/exchange-rate', { sort: 'date', order: 'desc', limit: 1 });
      return rates[0];
    },
  },

  // Notification operations
  notification: {
    async create(data: Omit<Notification, 'id' | 'created_date' | 'updated_date'>): Promise<Notification> {
      return apiClient.post<Notification>('/entities/notification', data);
    },
    async get(id: string): Promise<Notification> {
      return apiClient.get<Notification>(`/entities/notification/${id}`);
    },
    async filter(filters: NotificationFilter = {}): Promise<Notification[]> {
      return apiClient.get<Notification[]>('/entities/notification', filters);
    },
    async update(id: string, data: Partial<Notification>): Promise<Notification> {
      return apiClient.patch<Notification>(`/entities/notification/${id}`, data);
    },
    async markAsRead(id: string): Promise<Notification> {
      return apiClient.patch<Notification>(`/entities/notification/${id}`, { is_read: true });
    },
    async markAllAsRead(walletOwner: string): Promise<void> {
      // This would typically be a bulk update endpoint
      const notifications = await apiClient.get<Notification[]>('/entities/notification', { wallet_owner: walletOwner, is_read: false });
      await Promise.all(notifications.map(n => this.update(n.id, { is_read: true })));
    },
  },

  // AIRecommendation operations
  aiRecommendation: {
    async create(data: Omit<AIRecommendation, 'id' | 'created_date' | 'updated_date'>): Promise<AIRecommendation> {
      return apiClient.post<AIRecommendation>('/entities/ai-recommendation', data);
    },
    async get(id: string): Promise<AIRecommendation> {
      return apiClient.get<AIRecommendation>(`/entities/ai-recommendation/${id}`);
    },
    async filter(filters: Record<string, any> = {}): Promise<AIRecommendation[]> {
      return apiClient.get<AIRecommendation[]>('/entities/ai-recommendation', filters);
    },
    async update(id: string, data: Partial<AIRecommendation>): Promise<AIRecommendation> {
      return apiClient.patch<AIRecommendation>(`/entities/ai-recommendation/${id}`, data);
    },
  },
};

