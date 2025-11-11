import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import Card from '@/shared/components/Card/Card';
import { formatCurrency } from '@/shared/lib/formatters';
import { ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import InfoTooltip from '@/shared/components/InfoTooltip/InfoTooltip';

function BudgetWidget() {
  const { t, i18n } = useTranslation();
  const { user, selectedFamilyMember } = useAuth();

  const { data: wallets } = useQuery({
    queryKey: ['wallets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.wallet.filter({ owner_email: user.email, is_active: true });
    },
    enabled: !!user?.email,
  });

  const { data: budgets } = useQuery({
    queryKey: ['budgets', 'widget', user?.email],
    queryFn: async () => {
      if (!user?.email || !wallets) return [];
      const walletIds = wallets.map((w) => w.id);
      const allBudgets = await Promise.all(
        walletIds.map((id) => entities.budget.filter({ wallet_id: id }))
      );
      return allBudgets.flat();
    },
    enabled: !!user?.email && !!wallets,
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'budget-widget', user?.email, selectedFamilyMember],
    queryFn: async () => {
      if (!user?.email || !wallets) return [];
      const walletIds = wallets.map((w) => w.id);
      const allTransactions = await Promise.all(
        walletIds.map((id) => entities.transaction.filter({ wallet_id: id }))
      );
      let filtered = allTransactions.flat();
      
      // Filter by selected family member if not viewing as owner
      if (selectedFamilyMember && selectedFamilyMember !== 'owner') {
        filtered = filtered.filter((t) => t.family_member_id === selectedFamilyMember.id);
      } else if (selectedFamilyMember === 'owner') {
        filtered = filtered.filter((t) => !t.family_member_id);
      }
      
      return filtered;
    },
    enabled: !!user?.email && !!wallets,
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthBudgets = budgets?.filter((b) => b.month === currentMonth) || [];

  const budgetsWithProgress = currentMonthBudgets.map((budget) => {
    const budgetTransactions =
      transactions?.filter(
        (t) =>
          t.wallet_id === budget.wallet_id &&
          t.transaction_date?.startsWith(budget.month) &&
          t.type === 'expense' &&
          t.category === budget.category
      ) || [];
    const spent = budgetTransactions.reduce(
      (sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp),
      0
    );
    const percentage = (spent / budget.amount) * 100;
    return { ...budget, spent, percentage, remaining: budget.amount - spent };
  });

  const budgetsAtRisk = budgetsWithProgress.filter((b) => b.percentage >= 80);
  const budgetsExceeded = budgetsWithProgress.filter((b) => b.percentage > 100);

  if (currentMonthBudgets.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <ChartBarIcon className="w-6 h-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">{t('budgets.title')}</h3>
            <InfoTooltip
              content={t('budgets.widgetInfo') || 'Budgets help you control spending by setting monthly limits for categories. Create budgets to track your expenses and stay on track.'}
            />
          </div>
        </div>
        <p className="text-gray-600 mb-4">
          {t('budgets.noBudgetsThisMonth') || 'No budgets set for this month.'}
        </p>
        <Link to="/budgets" className="text-blue-600 hover:text-blue-700 font-medium">
          {t('budgets.createBudget') || 'Create Budget'} →
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <ChartBarIcon className="w-6 h-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">{t('budgets.title')}</h3>
          <InfoTooltip
            content={t('budgets.widgetInfo') || 'This month\'s budget status. Green = under budget, Yellow = 80-100% spent, Red = exceeded.'}
          />
        </div>
        <Link
          to="/budgets"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {t('common.viewAll') || 'View All'} →
        </Link>
      </div>

      {budgetsExceeded.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            <span className="text-sm font-semibold text-red-800">
              {t('budgets.exceededAlert', { count: budgetsExceeded.length }) ||
                `${budgetsExceeded.length} budget(s) exceeded`}
            </span>
          </div>
          <ul className="text-xs text-red-700 space-y-1">
            {budgetsExceeded.slice(0, 3).map((budget) => (
              <li key={budget.id}>
                {budget.category}: {formatCurrency(budget.spent, 'SYP', i18n.language)} /{' '}
                {formatCurrency(budget.amount, 'SYP', i18n.language)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {budgetsAtRisk.length > 0 && budgetsExceeded.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-800">
              {t('budgets.atRiskAlert', { count: budgetsAtRisk.length }) ||
                `${budgetsAtRisk.length} budget(s) at risk`}
            </span>
          </div>
          <ul className="text-xs text-yellow-700 space-y-1">
            {budgetsAtRisk.slice(0, 3).map((budget) => (
              <li key={budget.id}>
                {budget.category}: {budget.percentage.toFixed(1)}% spent
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {budgetsWithProgress.slice(0, 3).map((budget) => {
          const wallet = wallets?.find((w) => w.id === budget.wallet_id);
          return (
            <div key={budget.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">{budget.category}</span>
                <span className="text-gray-600">
                  {formatCurrency(budget.spent, wallet?.currency || 'SYP', i18n.language)} /{' '}
                  {formatCurrency(budget.amount, wallet?.currency || 'SYP', i18n.language)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    budget.percentage > 100
                      ? 'bg-red-600'
                      : budget.percentage >= 80
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {currentMonthBudgets.length > 3 && (
        <div className="mt-4 text-center">
          <Link
            to="/budgets"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('budgets.viewMore', { count: currentMonthBudgets.length - 3 }) ||
              `View ${currentMonthBudgets.length - 3} more`}
          </Link>
        </div>
      )}
    </Card>
  );
}

export default BudgetWidget;

