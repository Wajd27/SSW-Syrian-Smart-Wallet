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
    <Card className="hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80 drop-shadow-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-2 drop-shadow-md">
            {formatCurrency(value, currency, i18n.language)}
          </p>
          {trend && (
            <p
              className={`text-sm mt-1 drop-shadow-sm ${
                trend.isPositive ? 'text-green-300' : 'text-red-300'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {formatCurrency(trend.value, currency, i18n.language)}
            </p>
          )}
        </div>
        {icon && <div className="text-white drop-shadow-lg">{icon}</div>}
      </div>
    </Card>
  );
}

export default StatsCard;

