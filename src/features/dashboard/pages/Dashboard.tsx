import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import StatsCard from '../components/StatsCard';
import ExchangeRateWidget from '../components/ExchangeRateWidget';
import QuickActions from '../components/QuickActions';
import SpendingTrendsChart from '../components/SpendingTrendsChart';
import CategoryDistributionChart from '../components/CategoryDistributionChart';
import RecurringProcessor from '../components/RecurringProcessor';
import BudgetWidget from '../components/BudgetWidget';
import FinancialHealthOverview from '../components/FinancialHealthOverview';
import FamilySpendingWidget from '../components/FamilySpendingWidget';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import PullToRefresh from '@/shared/components/PullToRefresh/PullToRefresh';
import InfoTooltip from '@/shared/components/InfoTooltip/InfoTooltip';
import {
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

function Dashboard() {
  const { t } = useTranslation();
  const { user, selectedFamilyMember } = useAuth();

  const { data: wallets, isLoading: walletsLoading, error: walletsError, isError: walletsIsError } = useQuery({
    queryKey: ['wallets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const result = await entities.wallet.filter({ owner_email: user.email, is_active: true });
        console.log('Wallets fetched:', result?.length || 0);
        return result;
      } catch (error) {
        console.error('Error fetching wallets:', error);
        // Return empty array on error to prevent infinite loading
        return [];
      }
    },
    enabled: !!user?.email,
    retry: 1,
    refetchOnMount: true,
    // Ensure query completes even on error
    throwOnError: false,
  });

  const { data: transactions, isLoading: transactionsLoading, error: transactionsError, isError: transactionsIsError } = useQuery({
    queryKey: ['transactions', 'summary', user?.email, selectedFamilyMember],
    queryFn: async () => {
      if (!user?.email || !wallets || wallets.length === 0) return [];
      try {
        const walletIds = wallets.map((w) => w.id);
        const allTransactions = await Promise.all(
          walletIds.map((id) => entities.transaction.filter({ wallet_id: id }).catch(() => []))
        );
        let filtered = allTransactions.flat();
        
        // Filter by selected family member if not viewing as owner
        if (selectedFamilyMember && selectedFamilyMember !== 'owner') {
          filtered = filtered.filter((t) => t.family_member_id === selectedFamilyMember.id);
        } else if (selectedFamilyMember === 'owner') {
          // Show only owner transactions (no family_member_id)
          filtered = filtered.filter((t) => !t.family_member_id);
        }
        // If selectedFamilyMember is null, show all (default behavior)
        
        console.log('Transactions fetched:', filtered?.length || 0);
        return filtered;
      } catch (error) {
        console.error('Error fetching transactions:', error);
        // Return empty array on error to prevent infinite loading
        return [];
      }
    },
    enabled: !!user?.email && !!wallets && wallets.length > 0 && !walletsLoading,
    retry: 1,
    refetchOnMount: true,
    // Ensure query completes even on error
    throwOnError: false,
  });

  const { data: familyMembers, isLoading: familyLoading, error: familyError, isError: familyIsError } = useQuery({
    queryKey: ['family-members', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const result = await entities.familyMember.filter({ added_by: user.email, is_active: true });
        console.log('Family members fetched:', result?.length || 0);
        return result;
      } catch (error) {
        console.error('Error fetching family members:', error);
        // Return empty array on error to prevent infinite loading
        return [];
      }
    },
    enabled: !!user?.email,
    retry: 1,
    refetchOnMount: true,
    // Ensure query completes even on error
    throwOnError: false,
  });

  // Log errors but don't block rendering - use empty arrays as fallback
  if (walletsError) {
    console.error('Wallets error:', walletsError);
  }
  if (transactionsError) {
    console.error('Transactions error:', transactionsError);
  }
  if (familyError) {
    console.error('Family members error:', familyError);
  }

  // Show loading only if queries are actually loading and we don't have data yet
  // If we have errors but queries completed, show the data (even if empty)
  const isLoading = (walletsLoading && !wallets && !walletsIsError) || 
                    (familyLoading && !familyMembers && !familyIsError) ||
                    (transactionsLoading && wallets && wallets.length > 0 && !transactions && !transactionsIsError);

  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  // Ensure we have valid data
  const safeWallets = wallets || [];
  const safeTransactions = transactions || [];
  const safeFamilyMembers = familyMembers || [];

  // Calculate stats with safe defaults
  const totalBalance =
    safeWallets.reduce((sum, wallet) => {
      const walletTransactions = safeTransactions.filter((t) => t && t.wallet_id === wallet.id);
      const initialBalance = wallet.initial_balance ? Number(wallet.initial_balance) : 0;
      const balance = walletTransactions.reduce((balanceSum, t) => {
        if (!t) return balanceSum;
        const amount = t.primary_currency === 'USD' 
          ? (Number(t.amount_usd) || 0)
          : (Number(t.amount_syp) || 0);
        if (t.type === 'income') {
          return balanceSum + amount;
        } else {
          return balanceSum - amount;
        }
      }, initialBalance);
      return sum + (isNaN(balance) ? 0 : balance);
    }, 0);

  const totalIncome =
    safeTransactions.reduce((sum, t) => {
      if (!t || t.type !== 'income') return sum;
      const amount = t.primary_currency === 'USD' 
        ? (Number(t.amount_usd) || 0)
        : (Number(t.amount_syp) || 0);
      return sum + amount;
    }, 0);

  const totalExpenses =
    safeTransactions.reduce((sum, t) => {
      if (!t || t.type !== 'expense') return sum;
      const amount = t.primary_currency === 'USD' 
        ? (Number(t.amount_usd) || 0)
        : (Number(t.amount_syp) || 0);
      return sum + amount;
    }, 0);

  // Calculate monthly trends (simplified - compare current month vs previous month)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7);

  const currentMonthIncome =
    safeTransactions
      .filter((t) => t && t.transaction_date && t.transaction_date.startsWith(currentMonth) && t.type === 'income')
      .reduce((sum, t) => {
        const amount = t.primary_currency === 'USD' 
          ? (Number(t.amount_usd) || 0)
          : (Number(t.amount_syp) || 0);
        return sum + amount;
      }, 0);

  const lastMonthIncome =
    safeTransactions
      .filter((t) => t && t.transaction_date && t.transaction_date.startsWith(lastMonthStr) && t.type === 'income')
      .reduce((sum, t) => {
        const amount = t.primary_currency === 'USD' 
          ? (Number(t.amount_usd) || 0)
          : (Number(t.amount_syp) || 0);
        return sum + amount;
      }, 0);

  const currentMonthExpenses =
    safeTransactions
      .filter((t) => t && t.transaction_date && t.transaction_date.startsWith(currentMonth) && t.type === 'expense')
      .reduce((sum, t) => {
        const amount = t.primary_currency === 'USD' 
          ? (Number(t.amount_usd) || 0)
          : (Number(t.amount_syp) || 0);
        return sum + amount;
      }, 0);

  const lastMonthExpenses =
    safeTransactions
      .filter((t) => t && t.transaction_date && t.transaction_date.startsWith(lastMonthStr) && t.type === 'expense')
      .reduce((sum, t) => {
        const amount = t.primary_currency === 'USD' 
          ? (Number(t.amount_usd) || 0)
          : (Number(t.amount_syp) || 0);
        return sum + amount;
      }, 0);

  return (
    <PullToRefresh
      queryKeys={['wallets', 'transactions', 'family-members', 'dashboard']}
      onRefresh={async () => {
        // Refresh all dashboard data
        await Promise.all([
          entities.wallet.filter({ owner_email: user!.email, is_active: true }),
          entities.transaction.filter({}),
          entities.familyMember.filter({ added_by: user!.email, is_active: true }),
        ]);
      }}
    >
      <div className="space-y-6 animate-fade-in">
        <RecurringProcessor />
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <h1 className="text-2xl font-bold text-gray-800 drop-shadow-sm">{t('dashboard.title')}</h1>
          <InfoTooltip
            content={t('dashboard.info') || 'The dashboard shows your complete financial status. All your wallets, transactions, budgets, savings goals, investments, and debts work together to calculate your net worth and financial health score. Use this overview to understand your financial position at a glance.'}
          />
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <StatsCard
            title={t('dashboard.totalBalance')}
            value={totalBalance}
            currency={user?.default_currency || 'SYP'}
            icon={<WalletIcon className="w-8 h-8" />}
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <StatsCard
            title={t('dashboard.income')}
            value={totalIncome}
            currency={user?.default_currency || 'SYP'}
            icon={<ArrowUpIcon className="w-8 h-8" />}
            trend={{
              value: currentMonthIncome - lastMonthIncome,
              isPositive: currentMonthIncome >= lastMonthIncome,
            }}
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <StatsCard
            title={t('dashboard.expenses')}
            value={totalExpenses}
            currency={user?.default_currency || 'SYP'}
            icon={<ArrowDownIcon className="w-8 h-8" />}
            trend={{
              value: currentMonthExpenses - lastMonthExpenses,
              isPositive: currentMonthExpenses <= lastMonthExpenses,
            }}
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <StatsCard
            title={t('dashboard.familyMembers')}
            value={safeFamilyMembers.length}
            currency={undefined}
            icon={<UserGroupIcon className="w-8 h-8" />}
          />
        </div>
      </div>

      {/* Financial Health Overview */}
      <FinancialHealthOverview />

      {/* Exchange Rate, Budget Widget, and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ExchangeRateWidget />
        <BudgetWidget />
        <QuickActions />
      </div>

      {/* Family Spending Widget */}
      <FamilySpendingWidget />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingTrendsChart />
        <CategoryDistributionChart />
      </div>
      </div>
    </PullToRefresh>
  );
}

export default Dashboard;
