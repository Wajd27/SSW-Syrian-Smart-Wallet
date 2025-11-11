import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import { FinancialStatusService } from '@/shared/services/FinancialStatusService';
import Card from '@/shared/components/Card/Card';
import { formatCurrency } from '@/shared/lib/formatters';
import {
  WalletIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import InfoTooltip from '@/shared/components/InfoTooltip/InfoTooltip';

function FinancialHealthOverview() {
  const { t, i18n } = useTranslation();
  const { user, selectedFamilyMember } = useAuth();

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.wallet.filter({ owner_email: user.email, is_active: true });
    },
    enabled: !!user?.email,
    refetchOnMount: true,
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'health', user?.email, selectedFamilyMember],
    queryFn: async () => {
      if (!user?.email || !wallets || wallets.length === 0) return [];
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
    enabled: !!user?.email && !!wallets && wallets.length > 0 && !walletsLoading,
    refetchOnMount: true,
  });

  const { data: budgets } = useQuery({
    queryKey: ['budgets', 'health', user?.email],
    queryFn: async () => {
      if (!user?.email || !wallets || wallets.length === 0) return [];
      const walletIds = wallets.map((w) => w.id);
      const allBudgets = await Promise.all(
        walletIds.map((id) => entities.budget.filter({ wallet_id: id }))
      );
      return allBudgets.flat();
    },
    enabled: !!user?.email && !!wallets && wallets.length > 0 && !walletsLoading,
    refetchOnMount: true,
  });

  const { data: savingsGoals } = useQuery({
    queryKey: ['savings-goals', 'health', user?.email],
    queryFn: async () => {
      if (!user?.email || !wallets || wallets.length === 0) return [];
      const walletIds = wallets.map((w) => w.id);
      const allGoals = await Promise.all(
        walletIds.map((id) => entities.savingsGoal.filter({ wallet_id: id }))
      );
      return allGoals.flat();
    },
    enabled: !!user?.email && !!wallets && wallets.length > 0 && !walletsLoading,
    refetchOnMount: true,
  });

  const { data: investments } = useQuery({
    queryKey: ['investments', 'health', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.investment.filter({ wallet_owner: user.email, is_active: true });
    },
    enabled: !!user?.email,
    refetchOnMount: true,
  });

  const { data: debts } = useQuery({
    queryKey: ['debts', 'health', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.debt.filter({ wallet_owner: user.email, is_active: true });
    },
    enabled: !!user?.email,
    refetchOnMount: true,
  });

  const { data: recurringTransactions } = useQuery({
    queryKey: ['recurring', 'health', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.recurringTransaction.filter({ wallet_owner: user.email, is_active: true });
    },
    enabled: !!user?.email,
    refetchOnMount: true,
  });

  if (
    !wallets ||
    !transactions ||
    !budgets ||
    !savingsGoals ||
    !investments ||
    !debts ||
    !recurringTransactions
  ) {
    return null;
  }

    const financialStatus = FinancialStatusService.getFinancialStatus(
      wallets,
      transactions,
      budgets,
      savingsGoals,
      investments,
      debts,
      recurringTransactions,
      selectedFamilyMember && selectedFamilyMember !== 'owner' ? selectedFamilyMember.id : (selectedFamilyMember === 'owner' ? null : undefined)
    );

  const healthColor = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    fair: 'text-yellow-600',
    poor: 'text-red-600',
  }[financialStatus.healthStatus];

  const healthBgColor = {
    excellent: 'bg-green-50 border-green-200',
    good: 'bg-blue-50 border-blue-200',
    fair: 'bg-yellow-50 border-yellow-200',
    poor: 'bg-red-50 border-red-200',
  }[financialStatus.healthStatus];

  return (
    <Card className={`${healthBgColor} border-2`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <WalletIcon className="w-6 h-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            {t('dashboard.financialHealth') || 'Financial Health'}
          </h3>
          <InfoTooltip
            content={t('dashboard.financialHealthInfo') || 'Your financial health score is calculated based on net worth, savings rate, debt-to-income ratio, budget adherence, and goal progress. Excellent (80+), Good (60-79), Fair (40-59), Poor (<40).'}
          />
        </div>
        <div className={`text-2xl font-bold ${healthColor}`}>
          {financialStatus.financialHealthScore}/100
        </div>
      </div>

      <div className="space-y-4">
        {/* Health Status */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {financialStatus.healthStatus === 'excellent' || financialStatus.healthStatus === 'good' ? (
            <CheckCircleIcon className={`w-5 h-5 ${healthColor}`} />
          ) : (
            <ExclamationCircleIcon className={`w-5 h-5 ${healthColor}`} />
          )}
          <span className={`font-semibold capitalize ${healthColor}`}>
            {t(`dashboard.healthStatus.${financialStatus.healthStatus}`) ||
              financialStatus.healthStatus}
          </span>
        </div>

        {/* Net Worth */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-sm text-gray-600">
              {t('dashboard.netWorth') || 'Net Worth'}
            </span>
            <InfoTooltip
              content={t('dashboard.netWorthInfo') || 'Net Worth = (Wallet Balances + Investment Values) - Total Debts'}
            />
          </div>
          <span
            className={`font-semibold ${
              financialStatus.netWorth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(
              financialStatus.netWorth,
              user?.default_currency || 'SYP',
              i18n.language
            )}
          </span>
        </div>

        {/* Savings Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-sm text-gray-600">
              {t('dashboard.savingsRate') || 'Savings Rate'}
            </span>
            <InfoTooltip
              content={t('dashboard.savingsRateInfo') || 'Savings Rate = (Income - Expenses) / Income * 100. Higher is better.'}
            />
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {financialStatus.savingsRate >= 0 ? (
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
            )}
            <span
              className={`font-semibold ${
                financialStatus.savingsRate >= 20
                  ? 'text-green-600'
                  : financialStatus.savingsRate >= 10
                  ? 'text-blue-600'
                  : financialStatus.savingsRate >= 0
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {financialStatus.savingsRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Debt-to-Income Ratio */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-sm text-gray-600">
              {t('dashboard.debtToIncome') || 'Debt-to-Income'}
            </span>
            <InfoTooltip
              content={t('dashboard.debtToIncomeInfo') || 'Debt-to-Income Ratio = Monthly Debt Payments / Monthly Income * 100. Lower is better (aim for <30%).'}
            />
          </div>
          <span
            className={`font-semibold ${
              financialStatus.debtToIncomeRatio < 20
                ? 'text-green-600'
                : financialStatus.debtToIncomeRatio < 30
                ? 'text-blue-600'
                : financialStatus.debtToIncomeRatio < 40
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}
          >
            {financialStatus.debtToIncomeRatio.toFixed(1)}%
          </span>
        </div>

        {/* Cash Flow */}
        <div className="pt-3 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            {t('dashboard.monthlyCashFlow') || 'Monthly Cash Flow'}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-gray-500">{t('dashboard.income')}</div>
              <div className="font-semibold text-green-600">
                {formatCurrency(
                  financialStatus.cashFlow.monthlyIncome,
                  user?.default_currency || 'SYP',
                  i18n.language
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-500">{t('dashboard.expenses')}</div>
              <div className="font-semibold text-red-600">
                {formatCurrency(
                  financialStatus.cashFlow.monthlyExpenses,
                  user?.default_currency || 'SYP',
                  i18n.language
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-500">{t('dashboard.net') || 'Net'}</div>
              <div
                className={`font-semibold ${
                  financialStatus.cashFlow.netCashFlow >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrency(
                  financialStatus.cashFlow.netCashFlow,
                  user?.default_currency || 'SYP',
                  i18n.language
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default FinancialHealthOverview;

