import { Wallet, Transaction, Budget, SavingsGoal, Investment, Debt } from '@/shared/types/entities';

export interface FinancialStatus {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  cashFlow: {
    monthlyIncome: number;
    monthlyExpenses: number;
    netCashFlow: number;
  };
  savingsRate: number;
  debtToIncomeRatio: number;
  financialHealthScore: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface EntityRelationships {
  walletTransactions: Map<string, Transaction[]>;
  walletBudgets: Map<string, Budget[]>;
  walletSavingsGoals: Map<string, SavingsGoal[]>;
  goalInvestments: Map<string, Investment[]>;
  budgetTransactions: Map<string, Transaction[]>;
}

export class FinancialStatusService {
  /**
   * Calculate net worth: Assets (Wallets + Investments) - Liabilities (Debts)
   */
  static calculateNetWorth(
    wallets: Wallet[],
    transactions: Transaction[],
    investments: Investment[],
    debts: Debt[]
  ): number {
    // Calculate wallet balances
    const walletBalances = wallets.reduce((total, wallet) => {
      const walletTransactions = transactions.filter((t) => t.wallet_id === wallet.id);
      const balance = walletTransactions.reduce((sum, t) => {
        const amount = t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp;
        return sum + (t.type === 'income' ? amount : -amount);
      }, wallet.initial_balance || 0);
      return total + balance;
    }, 0);

    // Calculate investment values
    const investmentValues = investments
      .filter((inv) => inv.is_active)
      .reduce((total, inv) => {
        // Convert to default currency if needed
        return total + inv.current_value;
      }, 0);

    // Calculate total debts
    const totalDebts = debts
      .filter((debt) => debt.is_active)
      .reduce((total, debt) => {
        return total + debt.current_balance;
      }, 0);

    return walletBalances + investmentValues - totalDebts;
  }

  /**
   * Calculate monthly cash flow
   */
  static calculateCashFlow(
    transactions: Transaction[],
    recurringTransactions: any[],
    month: string
  ): { monthlyIncome: number; monthlyExpenses: number; netCashFlow: number } {
    const monthTransactions = transactions.filter((t) => t.transaction_date?.startsWith(month));
    
    const monthlyIncome = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp), 0);

    const monthlyExpenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp), 0);

    // Add projected recurring transactions
    const projectedRecurring = recurringTransactions
      .filter((rt) => rt.is_active && rt.next_occurrence?.startsWith(month))
      .reduce((sum, rt) => {
        const amount = rt.primary_currency === 'USD' ? rt.amount_usd : rt.amount_syp;
        return sum + (rt.type === 'income' ? amount : -amount);
      }, 0);

    return {
      monthlyIncome: monthlyIncome + (projectedRecurring > 0 ? projectedRecurring : 0),
      monthlyExpenses: monthlyExpenses + (projectedRecurring < 0 ? Math.abs(projectedRecurring) : 0),
      netCashFlow: monthlyIncome - monthlyExpenses + projectedRecurring,
    };
  }

  /**
   * Calculate savings rate: (Income - Expenses) / Income * 100
   */
  static calculateSavingsRate(income: number, expenses: number): number {
    if (income === 0) return 0;
    return ((income - expenses) / income) * 100;
  }

  /**
   * Calculate debt-to-income ratio
   */
  static calculateDebtToIncomeRatio(
    monthlyDebtPayments: number,
    monthlyIncome: number
  ): number {
    if (monthlyIncome === 0) return 0;
    return (monthlyDebtPayments / monthlyIncome) * 100;
  }

  /**
   * Calculate financial health score (0-100)
   */
  static calculateFinancialHealthScore(
    netWorth: number,
    savingsRate: number,
    debtToIncomeRatio: number,
    budgetAdherence: number, // Percentage of budgets not exceeded
    goalProgress: number // Average progress of savings goals
  ): { score: number; status: 'excellent' | 'good' | 'fair' | 'poor' } {
    let score = 0;

    // Net worth component (0-25 points)
    if (netWorth > 0) score += 25;
    else if (netWorth > -10000) score += 15;
    else if (netWorth > -50000) score += 5;
    else score += 0;

    // Savings rate component (0-25 points)
    if (savingsRate >= 20) score += 25;
    else if (savingsRate >= 10) score += 20;
    else if (savingsRate >= 5) score += 15;
    else if (savingsRate > 0) score += 10;
    else score += 0;

    // Debt-to-income ratio component (0-25 points)
    if (debtToIncomeRatio < 20) score += 25;
    else if (debtToIncomeRatio < 30) score += 20;
    else if (debtToIncomeRatio < 40) score += 15;
    else if (debtToIncomeRatio < 50) score += 10;
    else score += 5;

    // Budget adherence component (0-15 points)
    score += (budgetAdherence / 100) * 15;

    // Goal progress component (0-10 points)
    score += (goalProgress / 100) * 10;

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'fair';
    else status = 'poor';

    return { score: Math.round(score), status };
  }

  /**
   * Build entity relationships map
   */
  static buildRelationships(
    wallets: Wallet[],
    transactions: Transaction[],
    budgets: Budget[],
    savingsGoals: SavingsGoal[],
    investments: Investment[]
  ): EntityRelationships {
    const walletTransactions = new Map<string, Transaction[]>();
    const walletBudgets = new Map<string, Budget[]>();
    const walletSavingsGoals = new Map<string, SavingsGoal[]>();
    const goalInvestments = new Map<string, Investment[]>();
    const budgetTransactions = new Map<string, Transaction[]>();

    // Group transactions by wallet
    wallets.forEach((wallet) => {
      walletTransactions.set(
        wallet.id,
        transactions.filter((t) => t.wallet_id === wallet.id)
      );
    });

    // Group budgets by wallet
    wallets.forEach((wallet) => {
      walletBudgets.set(
        wallet.id,
        budgets.filter((b) => b.wallet_id === wallet.id)
      );
    });

    // Group savings goals by wallet
    wallets.forEach((wallet) => {
      walletSavingsGoals.set(
        wallet.id,
        savingsGoals.filter((sg) => sg.wallet_id === wallet.id)
      );
    });

    // Group investments by savings goal
    savingsGoals.forEach((goal) => {
      goalInvestments.set(
        goal.id,
        investments.filter((inv) => inv.savings_goal_id === goal.id)
      );
    });

    // Group transactions by budget (matching category and month)
    budgets.forEach((budget) => {
      const monthTransactions = transactions.filter(
        (t) =>
          t.wallet_id === budget.wallet_id &&
          t.transaction_date?.startsWith(budget.month) &&
          t.type === 'expense' &&
          t.category === budget.category
      );
      budgetTransactions.set(budget.id, monthTransactions);
    });

    return {
      walletTransactions,
      walletBudgets,
      walletSavingsGoals,
      goalInvestments,
      budgetTransactions,
    };
  }

  /**
   * Get comprehensive financial status
   */
  static getFinancialStatus(
    wallets: Wallet[],
    transactions: Transaction[],
    budgets: Budget[],
    savingsGoals: SavingsGoal[],
    investments: Investment[],
    debts: Debt[],
    recurringTransactions: any[]
  ): FinancialStatus {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const cashFlow = this.calculateCashFlow(transactions, recurringTransactions, currentMonth);
    const netWorth = this.calculateNetWorth(wallets, transactions, investments, debts);
    
    const totalAssets = wallets.reduce((sum, w) => {
      const walletTransactions = transactions.filter((t) => t.wallet_id === w.id);
      const balance = walletTransactions.reduce((bal, t) => {
        const amount = t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp;
        return bal + (t.type === 'income' ? amount : -amount);
      }, w.initial_balance || 0);
      return sum + balance;
    }, 0) + investments.filter((inv) => inv.is_active).reduce((sum, inv) => sum + inv.current_value, 0);

    const totalLiabilities = debts
      .filter((debt) => debt.is_active)
      .reduce((sum, debt) => sum + debt.current_balance, 0);

    const savingsRate = this.calculateSavingsRate(cashFlow.monthlyIncome, cashFlow.monthlyExpenses);
    
    const monthlyDebtPayments = debts
      .filter((debt) => debt.is_active)
      .reduce((sum, debt) => sum + (debt.minimum_payment || 0), 0);
    
    const debtToIncomeRatio = this.calculateDebtToIncomeRatio(
      monthlyDebtPayments,
      cashFlow.monthlyIncome
    );

    // Calculate budget adherence
    const currentMonthBudgets = budgets.filter((b) => b.month === currentMonth);
    const budgetsNotExceeded = currentMonthBudgets.filter((budget) => {
      const budgetTransactions = transactions.filter(
        (t) =>
          t.wallet_id === budget.wallet_id &&
          t.transaction_date?.startsWith(budget.month) &&
          t.type === 'expense' &&
          t.category === budget.category
      );
      const spent = budgetTransactions.reduce(
        (sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp),
        0
      );
      return spent <= budget.amount;
    }).length;
    const budgetAdherence = currentMonthBudgets.length > 0
      ? (budgetsNotExceeded / currentMonthBudgets.length) * 100
      : 100;

    // Calculate average goal progress
    const activeGoals = savingsGoals.filter((sg) => sg.is_active);
    const averageGoalProgress = activeGoals.length > 0
      ? activeGoals.reduce((sum, goal) => sum + (goal.current_amount / goal.target_amount) * 100, 0) /
        activeGoals.length
      : 0;

    const healthScore = this.calculateFinancialHealthScore(
      netWorth,
      savingsRate,
      debtToIncomeRatio,
      budgetAdherence,
      averageGoalProgress
    );

    return {
      netWorth,
      totalAssets,
      totalLiabilities,
      cashFlow,
      savingsRate,
      debtToIncomeRatio,
      financialHealthScore: healthScore.score,
      healthStatus: healthScore.status,
    };
  }
}

