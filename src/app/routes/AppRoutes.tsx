import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import ProtectedRoute from '@/shared/components/ProtectedRoute/ProtectedRoute';
import Layout from '@/shared/components/Layout/Layout';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';

// Auth pages
const Login = React.lazy(() => import('@/features/auth/pages/Login'));
const Register = React.lazy(() => import('@/features/auth/pages/Register'));

// Feature pages
const Dashboard = React.lazy(() => import('@/features/dashboard/pages/Dashboard'));
const Wallets = React.lazy(() => import('@/features/wallets/pages/Wallets'));
const Transactions = React.lazy(() => import('@/features/transactions/pages/Transactions'));
const Recurring = React.lazy(() => import('@/features/recurring/pages/Recurring'));
const Budgets = React.lazy(() => import('@/features/budgets/pages/Budgets'));
const SavingsGoals = React.lazy(() => import('@/features/savings-goals/pages/SavingsGoals'));
const Investments = React.lazy(() => import('@/features/investments/pages/Investments'));
const Debts = React.lazy(() => import('@/features/debts/pages/Debts'));
const Family = React.lazy(() => import('@/features/family/pages/Family'));
const AIAssistant = React.lazy(() => import('@/features/ai-assistant/pages/AIAssistant'));
const Reports = React.lazy(() => import('@/features/reports/pages/Reports'));
const Settings = React.lazy(() => import('@/features/settings/pages/Settings'));

// Wrapper component to handle auth redirects
function AuthRouteWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthRouteWrapper>
            <Login />
          </AuthRouteWrapper>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRouteWrapper>
            <Register />
          </AuthRouteWrapper>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<LoadingSpinner size="lg" className="min-h-screen" />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/wallets" element={<Wallets />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/recurring" element={<Recurring />} />
                  <Route path="/budgets" element={<Budgets />} />
                  <Route path="/savings-goals" element={<SavingsGoals />} />
                  <Route path="/investments" element={<Investments />} />
                  <Route path="/debts" element={<Debts />} />
                  <Route path="/family" element={<Family />} />
                  <Route path="/ai-assistant" element={<AIAssistant />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;

