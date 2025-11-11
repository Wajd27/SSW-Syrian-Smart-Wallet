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
        <div className="glass-card backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-8 shadow-2xl">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-800 drop-shadow-sm">
              {t('auth.register')}
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="glass backdrop-blur-md bg-red-500/20 border border-red-400/50 text-red-100 px-4 py-3 rounded-lg animate-shake">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.fullName')}
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="input mt-1 text-gray-900 placeholder:text-gray-500"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input mt-1 text-gray-900 placeholder:text-gray-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input mt-1 text-gray-900 placeholder:text-gray-500"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="input mt-1 text-gray-900 placeholder:text-gray-500"
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
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-300">
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

