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
    last_exchange_rate: user?.last_exchange_rate || 13000,
    notification_settings: {
      recurring_reminders: user?.notification_settings?.recurring_reminders ?? true,
      budget_alerts: user?.notification_settings?.budget_alerts ?? true,
      budget_threshold: user?.notification_settings?.budget_threshold || 80,
      savings_milestones: user?.notification_settings?.savings_milestones ?? true,
      investment_updates: user?.notification_settings?.investment_updates ?? true,
      haptic_feedback_enabled: user?.notification_settings?.haptic_feedback_enabled ?? true,
      sound_effects_enabled: user?.notification_settings?.sound_effects_enabled ?? true,
      sound_volume: user?.notification_settings?.sound_volume ?? 0.4,
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
      last_exchange_rate: formData.last_exchange_rate,
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
            <Input
              label={t('settings.defaultExchangeRate')}
              type="number"
              step="0.01"
              value={formData.last_exchange_rate}
              onChange={(e) =>
                setFormData({ ...formData, last_exchange_rate: parseFloat(e.target.value) || 13000 })
              }
              helperText={t('settings.exchangeRateHelper')}
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

        <Card title={t('settings.feedbackSettings') || 'Feedback Settings'}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/90 drop-shadow-sm">
                {t('settings.enableHapticFeedback') || 'Enable Haptic Feedback'}
              </label>
              <input
                type="checkbox"
                checked={formData.notification_settings.haptic_feedback_enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notification_settings: {
                      ...formData.notification_settings,
                      haptic_feedback_enabled: e.target.checked,
                    },
                  })
                }
                className="rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/90 drop-shadow-sm">
                {t('settings.enableSoundEffects') || 'Enable Sound Effects'}
              </label>
              <input
                type="checkbox"
                checked={formData.notification_settings.sound_effects_enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notification_settings: {
                      ...formData.notification_settings,
                      sound_effects_enabled: e.target.checked,
                    },
                  })
                }
                className="rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500"
              />
            </div>
            {formData.notification_settings.sound_effects_enabled && (
              <div>
                <label className="block text-sm font-medium text-white/90 drop-shadow-sm mb-2">
                  {t('settings.soundVolume') || 'Sound Volume'}:{' '}
                  {Math.round((formData.notification_settings.sound_volume || 0.4) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.notification_settings.sound_volume || 0.4}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notification_settings: {
                        ...formData.notification_settings,
                        sound_volume: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
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
