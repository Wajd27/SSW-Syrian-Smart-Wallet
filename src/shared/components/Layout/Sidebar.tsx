import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  HomeIcon,
  WalletIcon,
  ArrowRightOnRectangleIcon,
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const { logout } = useAuth();

  const navItems = [
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

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 pt-16 glass-card backdrop-blur-xl bg-white/20 border-r border-white/30 rtl:border-r-0 rtl:border-l">
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-blue-100/80 text-blue-900 shadow-lg backdrop-blur-md'
                        : 'text-gray-700 hover:bg-blue-50/60 hover:text-blue-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 ml-3 rtl:ml-0 rtl:mr-3 transition-transform duration-300 group-hover:scale-110" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/30">
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-100/60 hover:text-red-700 transition-all duration-300"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 ml-3 rtl:ml-0 rtl:mr-3" />
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}
    </>
  );
}

export default Sidebar;

