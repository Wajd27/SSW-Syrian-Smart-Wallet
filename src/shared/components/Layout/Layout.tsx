import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileMenu from './MobileMenu';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-0">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <MobileMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:ml-64 rtl:lg:ml-0 rtl:lg:mr-64 p-4 lg:p-8 page-enter min-h-0 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
      <footer className="glass-card backdrop-blur-xl bg-white/20 border-t border-white/30 py-3 shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-left rtl:text-right">
            <p className="text-sm text-gray-600">
              {t('footer.developedBy') || 'Developed by'} <span className="font-semibold text-gray-800">Wajd Hannoun</span>
              {' • '}
              <span>{t('footer.copyright', { year: new Date().getFullYear() }) || `© ${new Date().getFullYear()} All rights reserved.`}</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;

