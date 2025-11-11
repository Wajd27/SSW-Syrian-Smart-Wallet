import { FamilyMember, Transaction } from '@/shared/types/entities';

export interface MemberSpendingStats {
  memberId: string;
  totalSpentThisMonth: number;
  lifetimeSpending: number;
  transactionCount: number;
  averageTransaction: number;
  favoriteCategory: string | null;
  lastTransactionDate: string | null;
  topCategories: Array<{ category: string; amount: number }>;
  monthlySpending: Array<{ month: string; amount: number }>;
  categoryBreakdown: Array<{ name: string; value: number }>;
}

export function calculateAge(dateOfBirth: string | undefined): number | null {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function getDaysUntilBirthday(dateOfBirth: string | undefined): number | null {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = thisYearBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function calculateMemberSpending(
  member: FamilyMember,
  transactions: Transaction[],
  exchangeRate?: number
): MemberSpendingStats {
  const memberTransactions = transactions.filter(
    (t) => t.family_member_id === member.id && t.type === 'expense'
  );

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const rate = exchangeRate || 13000;

  // Calculate amounts (use primary currency, convert if needed for limit comparison)
  const getAmount = (t: Transaction, targetCurrency?: string) => {
    if (!targetCurrency) {
      return t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp;
    }
    // Convert to target currency
    if (targetCurrency === 'USD') {
      return t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp / rate;
    } else {
      return t.primary_currency === 'SYP' ? t.amount_syp : t.amount_usd * rate;
    }
  };

  // Total spent this month (convert to limit currency if limit exists)
  const limitCurrency = member.spending_limit_currency;
  const totalSpentThisMonth = memberTransactions
    .filter((t) => t.transaction_date.startsWith(currentMonth))
    .reduce((sum, t) => sum + getAmount(t, limitCurrency), 0);

  // Lifetime spending
  const lifetimeSpending = memberTransactions.reduce((sum, t) => sum + getAmount(t), 0);

  // Transaction count
  const transactionCount = memberTransactions.length;

  // Average transaction
  const averageTransaction = transactionCount > 0 ? lifetimeSpending / transactionCount : 0;

  // Category breakdown
  const categoryMap = new Map<string, number>();
  memberTransactions.forEach((t) => {
    if (t.category) {
      const amount = getAmount(t);
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + amount);
    }
  });

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const favoriteCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0].name : null;
  const topCategories: Array<{ category: string; amount: number }> = categoryBreakdown.slice(0, 3).map((item) => ({ category: item.name, amount: item.value }));

  // Monthly spending (last 6 months)
  const monthlySpendingMap = new Map<string, number>();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push(month);
    monthlySpendingMap.set(month, 0);
  }

  memberTransactions.forEach((t) => {
    const month = t.transaction_date.slice(0, 7);
    if (monthlySpendingMap.has(month)) {
      monthlySpendingMap.set(month, monthlySpendingMap.get(month)! + getAmount(t));
    }
  });

  const monthlySpending = months.map((month) => ({
    month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    amount: monthlySpendingMap.get(month) || 0,
  }));

  // Last transaction date
  const sortedTransactions = [...memberTransactions].sort(
    (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  );
  const lastTransactionDate = sortedTransactions.length > 0 ? sortedTransactions[0].transaction_date : null;

  return {
    memberId: member.id,
    totalSpentThisMonth,
    lifetimeSpending,
    transactionCount,
    averageTransaction,
    favoriteCategory,
    lastTransactionDate,
    topCategories,
    monthlySpending,
    categoryBreakdown,
  };
}

export function formatCurrency(amount: number, currency: string = 'SYP'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

