import { useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useFeedback } from '@/shared/hooks/useFeedback';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void> | void;
  queryKeys?: string[];
  threshold?: number;
  disabled?: boolean;
  showRefreshButton?: boolean; // Show refresh button on desktop
}

function PullToRefresh({
  children,
  onRefresh,
  queryKeys = [],
  threshold = 80,
  disabled = false,
  showRefreshButton = true, // Default to true
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { triggerFeedback } = useFeedback();

  // Detect if device is desktop (has mouse, not touch-only)
  useEffect(() => {
    const checkIsDesktop = () => {
      // Check if device has mouse capability and is not primarily touch
      const hasMouse = window.matchMedia('(pointer: fine)').matches;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsDesktop(hasMouse && (!hasTouch || window.innerWidth >= 768));
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // Refresh handler function
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
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Success feedback when refresh completes
      triggerFeedback('success');
    } catch (error) {
      console.error('Refresh error:', error);
      triggerFeedback('error');
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [isRefreshing, onRefresh, queryKeys, queryClient, triggerFeedback]);

  useEffect(() => {
    if (disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the scrollable area (with small tolerance)
      // This prevents accidental refresh when user is trying to scroll up
      if (container.scrollTop <= 5) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;

      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);

      // Only allow pull-to-refresh if:
      // 1. User is pulling down (distance > 0)
      // 2. Container is at the top (scrollTop <= 5 for tolerance)
      // 3. User started from the top (startY is valid)
      if (distance > 0 && container.scrollTop <= 5 && startY.current > 0) {
        // Only prevent default if user is actually pulling down significantly
        if (distance > 10) {
          e.preventDefault();
        }
        setPullDistance(Math.min(distance, threshold * 1.5));
      } else if (container.scrollTop > 5) {
        // If user scrolled down, cancel pull-to-refresh
        setIsPulling(false);
        setPullDistance(0);
        startY.current = 0;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      if (pullDistance >= threshold) {
        await handleRefresh();
      } else {
        setPullDistance(0);
      }

      setIsPulling(false);
      startY.current = 0;
      currentY.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, threshold, disabled, handleRefresh, triggerFeedback]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const shouldShowIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Desktop Refresh Button - Positioned to avoid conflicts with action buttons */}
      {/* Moved to top-left area to avoid overlapping with add buttons which are usually top-right */}
      {isDesktop && showRefreshButton && (
        <div className="fixed top-20 left-4 z-30 lg:top-24 lg:left-8 rtl:left-auto rtl:right-4 rtl:lg:right-8">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="glass-card backdrop-blur-xl bg-white/30 border border-white/40 rounded-full p-2.5 sm:p-3 shadow-lg hover:bg-white/40 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh"
          >
            <ArrowPathIcon
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-700 transition-transform duration-300 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            />
          </button>
        </div>
      )}

      {/* Pull to Refresh Indicator (Mobile) */}
      {shouldShowIndicator && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-300"
          style={{
            transform: `translateY(${Math.min(pullDistance - 20, threshold)}px)`,
            opacity: pullProgress,
          }}
        >
          <div className="glass-card backdrop-blur-xl bg-white/30 border border-white/40 rounded-full p-3 shadow-lg">
            <ArrowPathIcon
              className={`w-6 h-6 text-white transition-transform duration-300 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{
                transform: `rotate(${pullProgress * 180}deg)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          transition: isRefreshing ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;

