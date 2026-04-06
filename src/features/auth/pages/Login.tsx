import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/shared/hooks/useToast';

function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      showSuccess(t('auth.loginSuccess'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-8 animate-scale-in">
        <div className="surface-panel rounded-2xl p-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-app">
              {t('auth.login')}
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-[10px] animate-shake">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-app-soft mb-1">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input mt-1 text-app placeholder:text-muted"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-app-soft mb-1">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input mt-1 text-app placeholder:text-muted"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? t('common.loading') : t('auth.login')}
            </button>
          </div>

          <div className="text-center">
            <Link to="/register" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200">
              {t('auth.dontHaveAccount')}
            </Link>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default Login;

