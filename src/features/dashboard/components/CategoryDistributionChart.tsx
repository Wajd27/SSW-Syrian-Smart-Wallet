import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import Card from '@/shared/components/Card/Card';
import PieChart from '@/shared/components/Charts/PieChart';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';

function CategoryDistributionChart() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', 'categories', user?.email],
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
      <Card title={t('dashboard.categoryDistribution')}>
        <LoadingSpinner size="lg" className="h-64" />
      </Card>
    );
  }

  // Process data for pie chart
  const categoryMap = new Map<string, number>();
  transactions?.forEach((transaction) => {
    if (transaction.type === 'expense' && transaction.category) {
      const amount =
        transaction.primary_currency === 'USD' ? transaction.amount_usd : transaction.amount_syp;
      categoryMap.set(
        transaction.category,
        (categoryMap.get(transaction.category) || 0) + amount
      );
    }
  });

  const chartData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Top 6 categories

  return (
    <Card title={t('dashboard.categoryDistribution')}>
      {chartData.length > 0 ? (
        <PieChart data={chartData} height={300} />
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          {t('common.noData')}
        </div>
      )}
    </Card>
  );
}

export default CategoryDistributionChart;

