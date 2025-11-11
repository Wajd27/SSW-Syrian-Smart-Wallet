import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/i18n/config';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from '@/shared/components/ErrorBoundary/ErrorBoundary';
import NotificationMonitor from '@/features/notifications/components/NotificationMonitor';
import InstallPrompt from '@/shared/components/InstallPrompt/InstallPrompt';
import { initializeAudioOnInteraction } from '@/shared/utils/sounds';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  // Initialize audio context on first user interaction
  React.useEffect(() => {
    initializeAudioOnInteraction();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <AuthProvider>
              <NotificationMonitor />
              <InstallPrompt />
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </I18nextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

