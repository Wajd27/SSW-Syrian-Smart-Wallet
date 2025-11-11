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
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import PullToRefresh from '@/shared/components/PullToRefresh/PullToRefresh';
import Card from '@/shared/components/Card/Card';
import Button from '@/shared/components/Button/Button';
import InfoTooltip from '@/shared/components/InfoTooltip/InfoTooltip';
import {
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: wallets, isLoading: walletsLoading, error: walletsError } = useQuery({
    queryKey: ['wallets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.wallet.filter({ owner_email: user.email, is_active: true });
    },
    enabled: !!user?.email,
    retry: 1,
  });

  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ['transactions', 'summary', user?.email],
    queryFn: async () => {
      if (!user?.email || !wallets || wallets.length === 0) return [];
      const walletIds = wallets.map((w) => w.id);
      const allTransactions = await Promise.all(
        walletIds.map((id) => entities.transaction.filter({ wallet_id: id }))
      );
      return allTransactions.flat();
    },
    enabled: !!user?.email && !!wallets && wallets.length > 0,
    retry: 1,
  });

  const { data: familyMembers, isLoading: familyLoading, error: familyError } = useQuery({
    queryKey: ['family-members', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.familyMember.filter({ added_by: user.email, is_active: true });
    },
    enabled: !!user?.email,
    retry: 1,
  });

  // Show error state if any query failed
  if (walletsError || transactionsError || familyError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('common.error')}</h2>
          <p className="text-gray-600 mb-4">
            {walletsError?.message || transactionsError?.message || familyError?.message || t('common.error')}
          </p>
          <Button onClick={() => window.location.reload()}>
            {t('common.refresh') || 'Refresh Page'}
          </Button>
        </Card>
      </div>
    );
  }

  if (walletsLoading || (transactionsLoading && wallets && wallets.length > 0) || familyLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  // Ensure we have valid data
  const safeWallets = wallets || [];
  const safeTransactions = transactions || [];
  const safeFamilyMembers = familyMembers || [];

  // Calculate stats with safe defaults
  const totalBalance =
    safeWallets.reduce((sum, wallet) => {
      const walletTransactions = safeTransactions.filter((t) => t.wallet_id === wallet.id);
      const balance = walletTransactions.reduce((balanceSum, t) => {
        if (t.type === 'income') {
          return balanceSum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
        } else {
          return balanceSum - (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
        }
      }, wallet.initial_balance || 0);
      return sum + balance;
    }, 0);

  const totalIncome =
    safeTransactions.reduce((sum, t) => {
      if (t.type === 'income') {
        return sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
      }
      return sum;
    }, 0);

  const totalExpenses =
    safeTransactions.reduce((sum, t) => {
      if (t.type === 'expense') {
        return sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
      }
      return sum;
    }, 0);

  // Calculate monthly trends (simplified - compare current month vs previous month)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7);

  const currentMonthIncome =
    safeTransactions
      .filter((t) => t.transaction_date?.startsWith(currentMonth) && t.type === 'income')
      .reduce((sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp), 0);

  const lastMonthIncome =
    safeTransactions
      .filter((t) => t.transaction_date?.startsWith(lastMonthStr) && t.type === 'income')
      .reduce((sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp), 0);

  const currentMonthExpenses =
    safeTransactions
      .filter((t) => t.transaction_date?.startsWith(currentMonth) && t.type === 'expense')
      .reduce((sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp), 0);

  const lastMonthExpenses =
    safeTransactions
      .filter((t) => t.transaction_date?.startsWith(lastMonthStr) && t.type === 'expense')
      .reduce((sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp), 0);

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
