import Card from '@/shared/components/Card/Card';
import { formatCurrency } from '@/shared/lib/formatters';
import { useTranslation } from 'react-i18next';

interface StatsCardProps {
  title: string;
  value: number;
  currency?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatsCard({ title, value, currency, icon, trend }: StatsCardProps) {
  const { i18n } = useTranslation();

  // If currency is undefined or null, display as number without currency formatting
  const displayValue = currency !== undefined && currency !== null
    ? formatCurrency(value, currency, i18n.language)
    : value.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US');

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {displayValue}
          </p>
          {trend && currency !== undefined && currency !== null && (
            <p
              className={`text-sm mt-1 font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {formatCurrency(trend.value, currency, i18n.language)}
            </p>
          )}
        </div>
        {icon && <div className="text-blue-600">{icon}</div>}
      </div>
    </Card>
  );
}

export default StatsCard;

