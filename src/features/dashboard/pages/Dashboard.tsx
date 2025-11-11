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
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import PullToRefresh from '@/shared/components/PullToRefresh/PullToRefresh';
import {
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.wallet.filter({ owner_email: user.email, is_active: true });
    },
    enabled: !!user?.email,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', 'summary', user?.email],
    queryFn: async () => {
      if (!user?.email || !wallets) return [];
      const walletIds = wallets.map((w) => w.id);
      const allTransactions = await Promise.all(
        walletIds.map((id) => entities.transaction.filter({ wallet_id: id }))
      );
      return allTransactions.flat();
    },
    enabled: !!user?.email && !!wallets,
  });

  const { data: familyMembers, isLoading: familyLoading } = useQuery({
    queryKey: ['family-members', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.familyMember.filter({ added_by: user.email, is_active: true });
    },
    enabled: !!user?.email,
  });

  if (walletsLoading || transactionsLoading || familyLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  // Calculate stats
  const totalBalance =
    wallets?.reduce((sum, wallet) => {
      const walletTransactions = transactions?.filter((t) => t.wallet_id === wallet.id) || [];
      const balance = walletTransactions.reduce((balanceSum, t) => {
        if (t.type === 'income') {
          return balanceSum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
        } else {
          return balanceSum - (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
        }
      }, wallet.initial_balance);
      return sum + balance;
    }, 0) || 0;

  const totalIncome =
    transactions?.reduce((sum, t) => {
      if (t.type === 'income') {
        return sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
      }
      return sum;
    }, 0) || 0;

  const totalExpenses =
    transactions?.reduce((sum, t) => {
      if (t.type === 'expense') {
        return sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
      }
      return sum;
    }, 0) || 0;

  // Calculate monthly trends (simplified - compare current month vs previous month)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7);

  const currentMonthIncome =
    transactions?.filter(
      (t) => t.transaction_date.startsWith(currentMonth) && t.type === 'income'
    ).reduce((sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp), 0) ||
    0;

  const lastMonthIncome =
    transactions?.filter(
      (t) => t.transaction_date.startsWith(lastMonthStr) && t.type === 'income'
    ).reduce((sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp), 0) ||
    0;

  const currentMonthExpenses =
    transactions?.filter(
      (t) => t.transaction_date.startsWith(currentMonth) && t.type === 'expense'
    ).reduce((sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp), 0) ||
    0;

  const lastMonthExpenses =
    transactions?.filter(
      (t) => t.transaction_date.startsWith(lastMonthStr) && t.type === 'expense'
    ).reduce((sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp), 0) ||
    0;

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
        <h1 className="text-2xl font-bold text-white drop-shadow-lg">{t('dashboard.title')}</h1>

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
            value={familyMembers?.length || 0}
            icon={<UserGroupIcon className="w-8 h-8" />}
          />
        </div>
      </div>

      {/* Exchange Rate and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExchangeRateWidget />
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
