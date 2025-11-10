import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/i18n/config';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from '@/shared/components/ErrorBoundary/ErrorBoundary';
import NotificationMonitor from '@/features/notifications/components/NotificationMonitor';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <AuthProvider>
              <NotificationMonitor />
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </I18nextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

