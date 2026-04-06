import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useNavItems } from './navItems';
import { getNavLinkClassName } from './navStyles';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navItems = useNavItems();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 z-50 flex w-[min(100vw,20rem)] sm:w-72 flex-col surface-panel shadow-xl lg:hidden animate-slide-up pb-[env(safe-area-inset-bottom)]"
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.mainNavigation')}
    >
      <div className="flex items-center justify-between h-14 min-h-[3.5rem] px-4 border-b border-app-border shrink-0">
        <h2 className="text-lg font-semibold text-app truncate pr-2">{t('common.appName')}</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl min-h-11 min-w-11 inline-flex items-center justify-center text-app-soft hover:text-app hover:bg-app-bg transition-all duration-200"
          aria-label={t('nav.closeMenu')}
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-4 space-y-1" aria-label={t('nav.mainNavigation')}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => getNavLinkClassName(isActive)}
            >
              <Icon className="w-5 h-5 shrink-0 opacity-90" aria-hidden />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-app-border shrink-0">
        <button
          type="button"
          onClick={() => {
            logout();
            onClose();
          }}
          className="flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-app-soft rounded-xl min-h-[44px] hover:bg-red-50 hover:text-red-700 transition-all duration-200"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" aria-hidden />
          {t('auth.logout')}
        </button>
      </div>
    </div>
  );
}

export default MobileMenu;
