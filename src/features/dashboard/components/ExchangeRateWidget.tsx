import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { exchangeRateApi } from '@/shared/api/exchangeRate';
import { useAuth } from '@/features/auth/context/AuthContext';
import Card from '@/shared/components/Card/Card';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import Button from '@/shared/components/Button/Button';
import { CurrencyDollarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

function ExchangeRateWidget() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // User's last used exchange rate (default for new transactions)
  const userRate = user?.last_exchange_rate || null;
  // Display rate: prefer user's last rate, fallback to live rate
  const displayRate = userRate || liveRate;

  const updateUserRateMutation = useMutation({
    mutationFn: async (rate: number) => {
      await updateUser({ last_exchange_rate: rate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const latestRate = await exchangeRateApi.getLatestRate();
        setLiveRate(latestRate);
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRate();
    // Refresh every 5 minutes
    const interval = setInterval(fetchRate, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleUseAsDefault = () => {
    if (liveRate) {
      updateUserRateMutation.mutate(liveRate);
    }
  };

  return (
    <Card title={t('dashboard.exchangeRate')} className="h-full">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <CurrencyDollarIcon className="w-8 h-8 text-primary-600" />
            <div>
              {loading && !displayRate ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">
                    1 USD = {displayRate?.toLocaleString()} SYP
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-500">
                      {userRate ? t('dashboard.lastUsedRate') : t('dashboard.liveRate')}
                    </p>
                    {userRate && liveRate && userRate !== liveRate && (
                      <span className="text-xs text-gray-400">
                        ({t('dashboard.liveRate')}: {liveRate.toLocaleString()})
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {liveRate && !userRate && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUseAsDefault}
            isLoading={updateUserRateMutation.isPending}
            className="w-full"
          >
            <ArrowPathIcon className="w-4 h-4 inline mr-1 rtl:mr-0 rtl:ml-1" />
            {t('dashboard.useAsDefault')}
          </Button>
        )}
        
        {liveRate && userRate && userRate !== liveRate && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUseAsDefault}
            isLoading={updateUserRateMutation.isPending}
            className="w-full"
          >
            <ArrowPathIcon className="w-4 h-4 inline mr-1 rtl:mr-0 rtl:ml-1" />
            {t('dashboard.updateToLiveRate')}
          </Button>
        )}
      </div>
    </Card>
  );
}

export default ExchangeRateWidget;

