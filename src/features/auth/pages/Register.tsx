import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/shared/hooks/useToast';

function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      const errorMessage = 'Passwords do not match';
      setError(errorMessage);
      showError(errorMessage);
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.fullName);
      showSuccess(t('auth.registerSuccess'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
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
              {t('auth.register')}
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
              <label htmlFor="fullName" className="block text-sm font-medium text-app-soft mb-1">
                {t('auth.fullName')}
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                className="input mt-1 text-app placeholder:text-muted"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                autoComplete="new-password"
                required
                className="input mt-1 text-app placeholder:text-muted"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-app-soft mb-1">
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="input mt-1 text-app placeholder:text-muted"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? t('common.loading') : t('auth.register')}
            </button>
          </div>

          <div className="text-center">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200">
              {t('auth.alreadyHaveAccount')}
            </Link>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default Register;

