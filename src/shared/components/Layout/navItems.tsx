import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  WalletIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  UserGroupIcon,
  SparklesIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export type NavItemConfig = {
  path: string;
  label: string;
  icon: typeof HomeIcon;
};

export function useNavItems(): NavItemConfig[] {
  const { t } = useTranslation();
  return [
    { path: '/', label: t('dashboard.title'), icon: HomeIcon },
    { path: '/wallets', label: t('wallets.title'), icon: WalletIcon },
    { path: '/transactions', label: t('transactions.title'), icon: CurrencyDollarIcon },
    { path: '/recurring', label: t('recurring.title'), icon: CalendarIcon },
    { path: '/budgets', label: t('budgets.title'), icon: ChartBarIcon },
    { path: '/savings-goals', label: t('savingsGoals.title'), icon: TagIcon },
    { path: '/investments', label: t('investments.title'), icon: BuildingLibraryIcon },
    { path: '/debts', label: t('debts.title'), icon: CreditCardIcon },
    { path: '/family', label: t('family.title'), icon: UserGroupIcon },
    { path: '/ai-assistant', label: t('aiAssistant.title'), icon: SparklesIcon },
    { path: '/reports', label: t('reports.title'), icon: DocumentChartBarIcon },
    { path: '/settings', label: t('settings.title'), icon: Cog6ToothIcon },
  ];
}
