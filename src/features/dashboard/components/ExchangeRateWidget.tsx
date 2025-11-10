import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exchangeRateApi } from '@/shared/api/exchangeRate';
import Card from '@/shared/components/Card/Card';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

function ExchangeRateWidget() {
  const { t } = useTranslation();
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const latestRate = await exchangeRateApi.getLatestRate();
        setRate(latestRate);
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

  return (
    <Card title={t('dashboard.exchangeRate')} className="h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <CurrencyDollarIcon className="w-8 h-8 text-primary-600" />
          <div>
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900">
                  1 USD = {rate?.toLocaleString()} SYP
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date().toLocaleDateString()}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ExchangeRateWidget;

