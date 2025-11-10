import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  WalletIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TargetIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  UserGroupIcon,
  SparklesIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { t } = useTranslation();
  const { logout } = useAuth();

  const navItems = [
    { path: '/', label: t('dashboard.title'), icon: HomeIcon },
    { path: '/wallets', label: t('wallets.title'), icon: WalletIcon },
    { path: '/transactions', label: t('transactions.title'), icon: CurrencyDollarIcon },
    { path: '/recurring', label: t('recurring.title'), icon: CalendarIcon },
    { path: '/budgets', label: t('budgets.title'), icon: ChartBarIcon },
    { path: '/savings-goals', label: t('savingsGoals.title'), icon: TargetIcon },
    { path: '/investments', label: t('investments.title'), icon: BuildingLibraryIcon },
    { path: '/debts', label: t('debts.title'), icon: CreditCardIcon },
    { path: '/family', label: t('family.title'), icon: UserGroupIcon },
    { path: '/ai-assistant', label: t('aiAssistant.title'), icon: SparklesIcon },
    { path: '/reports', label: t('reports.title'), icon: DocumentChartBarIcon },
    { path: '/settings', label: t('settings.title'), icon: Cog6ToothIcon },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:hidden">
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t('common.appName')}</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-md text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Icon className="w-5 h-5 ml-3 rtl:ml-0 rtl:mr-3" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 ml-3 rtl:ml-0 rtl:mr-3" />
          {t('auth.logout')}
        </button>
      </div>
    </div>
  );
}

export default MobileMenu;

