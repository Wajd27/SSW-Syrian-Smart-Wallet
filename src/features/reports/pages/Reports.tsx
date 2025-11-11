import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import Card from '@/shared/components/Card/Card';
import LineChart from '@/shared/components/Charts/LineChart';
import BarChart from '@/shared/components/Charts/BarChart';
import PieChart from '@/shared/components/Charts/PieChart';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import PullToRefresh from '@/shared/components/PullToRefresh/PullToRefresh';
import InfoTooltip from '@/shared/components/InfoTooltip/InfoTooltip';
import { formatCurrency } from '@/shared/lib/formatters';
import { useState, useMemo } from 'react';
import Button from '@/shared/components/Button/Button';
import Input from '@/shared/components/Forms/Input';
import Select from '@/shared/components/Forms/Select';

function Reports() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [filters, setFilters] = useState({ start_date: '', end_date: '', family_member_id: '' });

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.wallet.filter({ owner_email: user.email, is_active: true });
    },
    enabled: !!user?.email,
    refetchOnMount: true,
  });

  const { data: familyMembers } = useQuery({
    queryKey: ['family-members', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.familyMember.filter({ added_by: user.email, is_active: true });
    },
    enabled: !!user?.email,
    refetchOnMount: true,
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', 'reports', user?.email, filters],
    queryFn: async () => {
      if (!user?.email || !wallets || wallets.length === 0) return [];
      const walletIds = wallets.map((w) => w.id);
      const allTransactions = await Promise.all(
        walletIds.map((id) => entities.transaction.filter({ wallet_id: id }))
      );
      let list = allTransactions.flat();
      if (filters.start_date) {
        list = list.filter((t) => t.transaction_date >= filters.start_date);
      }
      if (filters.end_date) {
        list = list.filter((t) => t.transaction_date <= filters.end_date);
      }
      if (filters.family_member_id) {
        if (filters.family_member_id === 'owner') {
          list = list.filter((t) => !t.family_member_id);
        } else {
          list = list.filter((t) => t.family_member_id === filters.family_member_id);
        }
      }
      return list;
    },
    enabled: !!user?.email && !!wallets && wallets.length > 0 && !walletsLoading,
    refetchOnMount: true,
  });

  const { data: investments } = useQuery({
    queryKey: ['investments', 'reports', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.investment.filter({ wallet_owner: user.email, is_active: true });
    },
    enabled: !!user?.email,
    refetchOnMount: true,
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  // Process data for charts
  const monthBuckets = useMemo(() => {
    const set = new Set<string>();
    (transactions || []).forEach((t) => set.add(t.transaction_date.slice(0, 7)));
    const arr = Array.from(set).sort();
    return arr.length > 0 ? arr : Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return date.toISOString().slice(0, 7);
    });
  }, [transactions]);

  const incomeVsExpenseData = monthBuckets.map((month) => {
    const monthTransactions = transactions?.filter((t) => t.transaction_date.startsWith(month)) || [];
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

  const categoryData = new Map<string, number>();
  transactions?.forEach((t) => {
    if (t.type === 'expense' && t.category) {
      const amount = t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp;
      categoryData.set(t.category, (categoryData.get(t.category) || 0) + amount);
    }
  });

  const categoryChartData = Array.from(categoryData.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const totalIncome = transactions?.reduce((sum, t) => {
    if (t.type === 'income') {
      return sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
    }
    return sum;
  }, 0) || 0;

  const totalExpenses = transactions?.reduce((sum, t) => {
    if (t.type === 'expense') {
      return sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
    }
    return sum;
  }, 0) || 0;

  const investmentPerformance = investments?.map((inv) => {
    const returnPercentage =
      ((inv.current_value - inv.initial_amount) / inv.initial_amount) * 100;
    return {
      name: inv.name,
      Return: returnPercentage,
    };
  }) || [];

  // Family Spending Comparison Data
  const familySpendingComparison = useMemo(() => {
    if (!familyMembers || !transactions || filters.family_member_id) return [];
    
    const memberSpending = familyMembers.map((member) => {
      const memberTransactions = transactions.filter(
        (t) => t.family_member_id === member.id && t.type === 'expense'
      );
      const total = memberTransactions.reduce((sum, t) => {
        return sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
      }, 0);
      return {
        name: member.name,
        Spending: total,
      };
    });

    // Add owner spending
    const ownerTransactions = transactions.filter(
      (t) => !t.family_member_id && t.type === 'expense'
    );
    const ownerTotal = ownerTransactions.reduce((sum, t) => {
      return sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
    }, 0);
    
    const result = [
      { name: user?.full_name || t('family.ownerOnly'), Spending: ownerTotal },
      ...memberSpending,
    ];
    
    return result.filter((item) => item.Spending > 0);
  }, [familyMembers, transactions, filters.family_member_id, user, t]);

  // Family Spending Trends (multiple lines)
  const familySpendingTrends = useMemo(() => {
    if (!familyMembers || !transactions || filters.family_member_id) return [];
    
    const result: any[] = monthBuckets.map((month) => {
      const data: any = {
        name: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      };
      
      // Owner spending
      const ownerMonthTransactions = transactions.filter(
        (t) => !t.family_member_id && t.type === 'expense' && t.transaction_date.startsWith(month)
      );
      const ownerTotal = ownerMonthTransactions.reduce((sum, t) => {
        return sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
      }, 0);
      data[user?.full_name || t('family.ownerOnly')] = ownerTotal;
      
      // Family member spending
      familyMembers.forEach((member) => {
        const memberMonthTransactions = transactions.filter(
          (t) =>
            t.family_member_id === member.id &&
            t.type === 'expense' &&
            t.transaction_date.startsWith(month)
        );
        const memberTotal = memberMonthTransactions.reduce((sum, t) => {
          return sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
        }, 0);
        data[member.name] = memberTotal;
      });
      
      return data;
    });
    
    return result;
  }, [familyMembers, transactions, monthBuckets, filters.family_member_id, user, t]);

  return (
    <PullToRefresh queryKeys={['wallets', 'transactions', 'investments', 'reports']}>
      <div className="space-y-6">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
          <InfoTooltip content={t('reports.info')} />
        </div>

      {/* Filters and Export */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Input
            label={t('common.startDate')}
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          />
          <Input
            label={t('common.endDate')}
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          />
          <Select
            label={t('family.filterByMember')}
            value={filters.family_member_id}
            onChange={(e) => setFilters({ ...filters, family_member_id: e.target.value })}
            options={[
              { value: '', label: t('common.all') },
              { value: 'owner', label: t('family.ownerOnly') },
              ...(familyMembers?.map((m) => ({ value: m.id, label: m.name })) || []),
            ]}
          />
          <div className="md:col-span-3 flex items-end justify-end space-x-2 rtl:space-x-reverse">
            <Button variant="secondary" onClick={() => setFilters({ start_date: '', end_date: '', family_member_id: '' })}>
              {t('common.clear') || 'Clear'}
            </Button>
            <Button variant="outline" onClick={() => exportCSV(transactions || [])}>
              {t('common.exportCsv') || 'Export CSV'}
            </Button>
            <Button onClick={exportPDF}>{t('common.exportPdf') || 'Export PDF'}</Button>
          </div>
        </div>
      </Card>

      {/* Financial Summary */}
      <Card title={t('reports.financialSummary')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">{t('dashboard.income')}</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome, user?.default_currency || 'SYP', i18n.language)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t('dashboard.expenses')}</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses, user?.default_currency || 'SYP', i18n.language)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Net</p>
            <p
              className={`text-2xl font-bold ${
                totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(
                totalIncome - totalExpenses,
                user?.default_currency || 'SYP',
                i18n.language
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t('reports.incomeVsExpense')}>
          <LineChart data={incomeVsExpenseData} dataKeys={['Income', 'Expenses']} height={300} />
        </Card>
        <Card title={t('reports.spendingAnalysis')}>
          <PieChart data={categoryChartData} height={300} />
        </Card>
      </div>

      {investmentPerformance.length > 0 && (
        <Card title={t('reports.investmentPerformance')}>
          <BarChart data={investmentPerformance} dataKeys={['Return']} height={300} />
        </Card>
      )}

      {/* Family Comparison Charts - Only show when not filtering by specific member */}
      {!filters.family_member_id && familyMembers && familyMembers.length > 0 && (
        <>
          {familySpendingComparison.length > 0 && (
            <Card title={t('family.memberComparison')}>
              <BarChart
                data={familySpendingComparison}
                dataKeys={['Spending']}
                height={300}
              />
            </Card>
          )}
          
          {familySpendingTrends.length > 0 && (
            <Card title={t('family.spendingTrend')}>
              <LineChart
                data={familySpendingTrends}
                dataKeys={[
                  user?.full_name || t('family.ownerOnly'),
                  ...(familyMembers.map((m) => m.name) || []),
                ]}
                height={300}
              />
            </Card>
          )}
        </>
      )}
      </div>
    </PullToRefresh>
  );
}

export default Reports;

// Helpers
function exportCSV(transactions: any[]) {
  const headers = [
    'Date',
    'Type',
    'Title',
    'Category',
    'Amount (SYP)',
    'Amount (USD)',
    'Wallet ID',
  ];
  const rows = transactions.map((t) => [
    t.transaction_date,
    t.type,
    escapeCsv(t.title || ''),
    escapeCsv(t.category || ''),
    t.amount_syp,
    t.amount_usd,
    t.wallet_id,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `reports-${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportPDF() {
  // Use browser print to PDF
  window.print();
}

function escapeCsv(v: string) {
  if (v?.includes(',') || v?.includes('"') || v?.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
