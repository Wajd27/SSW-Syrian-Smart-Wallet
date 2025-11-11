import { useCallback, useState } from 'react';
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
  size = 'md'
}: RefreshButtonProps) {
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

      // Invalidate specified query keys
      if (queryKeys.length > 0) {
        queryKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      } else {
        // Invalidate all queries if no specific keys provided
        queryClient.invalidateQueries();
      }

      // Wait a bit for the refresh to complete
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Success feedback when refresh completes
      triggerFeedback('success');
    } catch (error) {
      console.error('Refresh error:', error);
      triggerFeedback('error');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh, queryKeys, queryClient, triggerFeedback]);

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${className}`}
      title="Refresh"
    >
      <ArrowPathIcon
        className={`${iconSizes[size]} transition-transform duration-300 ${
          isRefreshing ? 'animate-spin' : ''
        }`}
      />
    </button>
  );
}

export default RefreshButton;

