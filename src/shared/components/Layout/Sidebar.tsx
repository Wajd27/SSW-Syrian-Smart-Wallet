import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useNavItems } from './navItems';
import { getNavLinkClassName } from './navStyles';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navItems = useNavItems();

  return (
    <>
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-72 fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 pt-16 surface-sidebar">
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto min-h-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
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
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-app-soft rounded-xl min-h-[44px] hover:bg-red-50 hover:text-red-700 transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" aria-hidden />
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden
        />
      )}
    </>
  );
}

export default Sidebar;
