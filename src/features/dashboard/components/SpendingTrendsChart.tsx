import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import Card from '@/shared/components/Card/Card';
import LineChart from '@/shared/components/Charts/LineChart';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';

function SpendingTrendsChart() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', 'dashboard', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const wallets = await entities.wallet.filter({ owner_email: user.email });
      const walletIds = wallets.map((w) => w.id);
      const allTransactions = await Promise.all(
        walletIds.map((id) => entities.transaction.filter({ wallet_id: id }))
      );
      return allTransactions.flat();
    },
    enabled: !!user?.email,
  });

  if (isLoading) {
    return (
      <Card title={t('dashboard.spendingTrends')}>
        <LoadingSpinner size="lg" className="h-64" />
      </Card>
    );
  }

  // Process data for chart (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return date.toISOString().slice(0, 7);
  });

  const chartData = months.map((month) => {
    const monthTransactions = transactions?.filter((t) =>
      t.transaction_date.startsWith(month)
    ) || [];
    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp), 0);
    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp), 0);

    return {
      name: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      Income: income,
      Expenses: expenses,
    };
  });

  return (
    <Card title={t('dashboard.spendingTrends')}>
      <LineChart data={chartData} dataKeys={['Income', 'Expenses']} height={300} />
    </Card>
  );
}

export default SpendingTrendsChart;

