import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import Card from '@/shared/components/Card/Card';
import Button from '@/shared/components/Button/Button';
import Input from '@/shared/components/Forms/Input';
import Select from '@/shared/components/Forms/Select';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';

function Settings() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    default_currency: user?.default_currency || 'SYP',
    notification_settings: {
      recurring_reminders: user?.notification_settings?.recurring_reminders ?? true,
      budget_alerts: user?.notification_settings?.budget_alerts ?? true,
      budget_threshold: user?.notification_settings?.budget_threshold || 80,
      savings_milestones: user?.notification_settings?.savings_milestones ?? true,
      investment_updates: user?.notification_settings?.investment_updates ?? true,
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      full_name: formData.full_name,
      default_currency: formData.default_currency,
      notification_settings: formData.notification_settings,
    });
  };

  if (!user) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>

      <form onSubmit={handleSubmit}>
        <Card title={t('settings.profile')} className="mb-6">
          <div className="space-y-4">
            <Input
              label={t('auth.fullName')}
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
            <Select
              label={t('settings.defaultCurrency')}
              value={formData.default_currency}
              onChange={(e) => setFormData({ ...formData, default_currency: e.target.value })}
              options={[
                { value: 'SYP', label: 'SYP' },
                { value: 'USD', label: 'USD' },
              ]}
            />
          </div>
        </Card>

        <Card title={t('settings.notificationSettings')}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {t('settings.recurringReminders')}
              </label>
              <input
                type="checkbox"
                checked={formData.notification_settings.recurring_reminders}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notification_settings: {
                      ...formData.notification_settings,
                      recurring_reminders: e.target.checked,
                    },
                  })
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {t('settings.budgetAlerts')}
              </label>
              <input
                type="checkbox"
                checked={formData.notification_settings.budget_alerts}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notification_settings: {
                      ...formData.notification_settings,
                      budget_alerts: e.target.checked,
                    },
                  })
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
            {formData.notification_settings.budget_alerts && (
              <Input
                label={t('settings.budgetThreshold')}
                type="number"
                value={formData.notification_settings.budget_threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notification_settings: {
                      ...formData.notification_settings,
                      budget_threshold: parseInt(e.target.value) || 80,
                    },
                  })
                }
                helperText="Percentage threshold for budget alerts"
              />
            )}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {t('settings.savingsMilestones')}
              </label>
              <input
                type="checkbox"
                checked={formData.notification_settings.savings_milestones}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notification_settings: {
                      ...formData.notification_settings,
                      savings_milestones: e.target.checked,
                    },
                  })
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {t('settings.investmentUpdates')}
              </label>
              <input
                type="checkbox"
                checked={formData.notification_settings.investment_updates}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notification_settings: {
                      ...formData.notification_settings,
                      investment_updates: e.target.checked,
                    },
                  })
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
          </div>
        </Card>

        <div className="mt-6">
          <Button type="submit" isLoading={updateMutation.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
