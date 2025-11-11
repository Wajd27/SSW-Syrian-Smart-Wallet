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
import ToastContainer from '@/shared/components/Toast/ToastContainer';
import ServiceWorkerUpdate from '@/shared/components/ServiceWorkerUpdate/ServiceWorkerUpdate';
import { initializeAudioOnInteraction } from '@/shared/utils/sounds';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Always refetch when component mounts
      staleTime: 0, // Consider data stale immediately to ensure fresh data
      gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes (formerly cacheTime)
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
              <ServiceWorkerUpdate />
              <ToastContainer />
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </I18nextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

