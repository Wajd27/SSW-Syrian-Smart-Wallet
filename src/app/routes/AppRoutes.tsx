import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import ProtectedRoute from '@/shared/components/ProtectedRoute/ProtectedRoute';
import Layout from '@/shared/components/Layout/Layout';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';

// Auth pages
const Login = React.lazy(() => import('@/features/auth/pages/Login'));
const Register = React.lazy(() => import('@/features/auth/pages/Register'));
const FamilyMemberSelector = React.lazy(() => import('@/features/auth/pages/FamilyMemberSelector'));

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

// Redirect component that safely handles navigation
function SafeRedirect({ to }: { to: string }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Use setTimeout to ensure this happens after render cycle completes
    const timer = setTimeout(() => {
      navigate(to, { replace: true });
    }, 0);
    
    return () => clearTimeout(timer);
  }, [navigate, to]);

  return <LoadingSpinner size="lg" className="min-h-screen" />;
}

// Wrapper component to handle auth redirects
function AuthRouteWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = React.useState(false);

  // Use useEffect to handle redirect after render completes
  // This prevents React error #426 by ensuring redirect happens after render cycle
  useEffect(() => {
    if (!loading && user) {
      // Defer redirect to next tick to avoid updating during render
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 0);
      return () => clearTimeout(timer);
    } else if (!loading && !user) {
      // Reset redirect flag when user logs out
      setShouldRedirect(false);
    }
  }, [user, loading]);

  if (loading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  // Only redirect if flag is set (after useEffect runs)
  if (shouldRedirect) {
    return <SafeRedirect to="/" />;
  }

  // Required for React.lazy Login/Register: without Suspense, navigation triggers error #426
  // ("A component suspended while responding to synchronous input").
  return (
    <Suspense fallback={<LoadingSpinner size="lg" className="min-h-screen" />}>{children}</Suspense>
  );
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
                  <Route path="/select-family-member" element={<FamilyMemberSelector />} />
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

