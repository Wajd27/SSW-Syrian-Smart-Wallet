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

function StatsCard({ title, value, currency = 'SYP', icon, trend }: StatsCardProps) {
  const { i18n } = useTranslation();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(value, currency, i18n.language)}
          </p>
          {trend && (
            <p
              className={`text-sm mt-1 ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {formatCurrency(trend.value, currency, i18n.language)}
            </p>
          )}
        </div>
        {icon && <div className="text-primary-600">{icon}</div>}
      </div>
    </Card>
  );
}

export default StatsCard;

