import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import NotificationBell from '../NotificationBell/NotificationBell';
import InstallButton from '../InstallButton/InstallButton';
import UserGuide from '../UserGuide/UserGuide';
import FamilyMemberSwitcher from '../FamilyMemberSwitcher/FamilyMemberSwitcher';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <header className="glass-card backdrop-blur-xl bg-white/20 border-b border-white/30 sticky top-0 z-40 shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100/60 transition-all duration-300"
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
            <div className="flex items-center space-x-2 rtl:space-x-reverse ml-2 lg:ml-0 rtl:ml-0 rtl:mr-2 rtl:lg:mr-0">
              <img
                src="/AppImages/android/android-launchericon-48-48.png"
                alt={t('common.appName')}
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg"
              />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-800 drop-shadow-sm truncate max-w-[120px] sm:max-w-none">
                {t('common.appName')}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 rtl:space-x-reverse">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="p-1.5 sm:p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100/60 transition-all duration-300"
              title={t('userGuide.help')}
            >
              <QuestionMarkCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <div className="hidden sm:block">
              <InstallButton />
            </div>
            <NotificationBell />
            <LanguageSwitcher />
            <FamilyMemberSwitcher />
            {user && (
              <div className="hidden lg:flex items-center space-x-2 rtl:space-x-reverse">
                <div className="text-xs sm:text-sm text-gray-700 font-medium truncate max-w-[100px] xl:max-w-none">
                  {user.full_name || user.email}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <UserGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </header>
  );
}

export default Header;

