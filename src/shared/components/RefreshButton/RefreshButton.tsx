import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useFeedback } from '@/shared/hooks/useFeedback';

interface RefreshButtonProps {
  queryKeys?: string[];
  onRefresh?: () => Promise<void> | void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

function RefreshButton({
  queryKeys = [],
  onRefresh,
  className = '',
  size = 'md',
}: RefreshButtonProps) {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { triggerFeedback } = useFeedback();

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    triggerFeedback('click');

    try {
      if (onRefresh) {
        await onRefresh();
      }

      if (queryKeys.length > 0) {
        queryKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      } else {
        queryClient.invalidateQueries();
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      triggerFeedback('success');
    } catch (error) {
      console.error('Refresh error:', error);
      triggerFeedback('error');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh, queryKeys, queryClient, triggerFeedback]);

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`inline-flex items-center justify-center rounded-xl text-app-soft hover:text-app hover:bg-app-bg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${className}`}
      title={t('common.refresh')}
      aria-label={t('common.refresh')}
    >
      <ArrowPathIcon
        className={`${iconSizes[size]} transition-transform duration-300 ${
          isRefreshing ? 'animate-spin' : ''
        }`}
        aria-hidden
      />
    </button>
  );
}

export default RefreshButton;
