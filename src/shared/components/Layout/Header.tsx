import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import NotificationBell from '../NotificationBell/NotificationBell';

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="ml-2 lg:ml-0 text-xl font-semibold text-gray-900">
              {t('common.appName')}
            </h1>
          </div>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <NotificationBell />
            <LanguageSwitcher />
            {user && (
              <div className="hidden sm:flex items-center space-x-2 rtl:space-x-reverse">
                <div className="text-sm text-gray-700">
                  {user.full_name || user.email}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

