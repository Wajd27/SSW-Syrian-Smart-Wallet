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
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <MobileMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-h-0 flex-1 flex-col lg:ml-72 rtl:lg:ml-0 rtl:lg:mr-72">
          <main className="page-enter flex min-h-0 flex-1 flex-col p-4 lg:p-8">
            <div className="flex-1">{children}</div>
          </main>
          <footer className="surface-footer shrink-0 py-3">
            <div className="px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-app-soft">
                {t('footer.developedBy')}{' '}
                <span className="font-semibold text-app">{t('footer.authorName')}</span>
                {' • '}
                <span>
                  {t('footer.copyright', { year: new Date().getFullYear() }) ||
                    `© ${new Date().getFullYear()} All rights reserved.`}
                </span>
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Layout;

