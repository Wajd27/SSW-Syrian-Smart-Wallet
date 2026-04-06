import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import NotificationBell from '../NotificationBell/NotificationBell';
import InstallButton from '../InstallButton/InstallButton';
import UserGuide from '../UserGuide/UserGuide';
import FamilyMemberSwitcher from '../FamilyMemberSwitcher/FamilyMemberSwitcher';
import RefreshButton from '../RefreshButton/RefreshButton';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const getRefreshQueryKeys = () => {
    const path = location.pathname;
    if (path === '/') return ['wallets', 'transactions', 'family-members', 'dashboard'];
    if (path === '/transactions') return ['transactions', 'wallets'];
    if (path === '/wallets') return ['wallets'];
    if (path === '/family') return ['family-members', 'transactions'];
    if (path === '/budgets') return ['budgets', 'transactions', 'wallets'];
    if (path === '/debts') return ['debts'];
    if (path === '/savings-goals') return ['savings-goals', 'wallets'];
    if (path === '/investments') return ['investments', 'savings-goals', 'wallets'];
    if (path === '/recurring') return ['recurring-transactions', 'wallets', 'family-members'];
    if (path === '/reports') return ['wallets', 'transactions', 'investments', 'reports'];
    return [];
  };

  const refreshKeys = getRefreshQueryKeys();

  return (
    <header className="surface-header">
      <div className="px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center min-h-14 h-14 sm:h-16">
          <div className="flex items-center min-w-0 flex-1">
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-xl min-h-11 min-w-11 inline-flex items-center justify-center text-app-soft hover:text-app hover:bg-app-bg transition-all duration-200 shrink-0"
              aria-label={t('common.openMenu')}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex items-center gap-2 rtl:space-x-reverse ml-1 sm:ml-2 lg:ml-0 rtl:ml-0 rtl:mr-1 rtl:sm:mr-2 rtl:lg:mr-0 min-w-0">
              <img
                src="/AppImages/android/android-launchericon-48-48.png"
                alt=""
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg shrink-0"
              />
              <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-app truncate">
                {t('common.appName')}
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-end gap-0.5 sm:gap-1 md:gap-2 shrink-0">
            {refreshKeys.length > 0 && (
              <RefreshButton queryKeys={refreshKeys} size="sm" className="min-h-11 min-w-11 rounded-xl" />
            )}
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="p-2 rounded-xl min-h-11 min-w-11 inline-flex items-center justify-center text-app-soft hover:text-app hover:bg-app-bg transition-all duration-200"
              title={t('userGuide.help')}
              aria-label={t('userGuide.help')}
            >
              <QuestionMarkCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
            </button>
            <div className="hidden sm:block">
              <InstallButton />
            </div>
            <NotificationBell />
            <LanguageSwitcher />
            <FamilyMemberSwitcher />
          </div>
        </div>
      </div>
      <UserGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </header>
  );
}

export default Header;
