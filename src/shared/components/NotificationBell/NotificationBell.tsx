import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import { BellIcon } from '@heroicons/react/24/outline';
import NotificationPopover from './NotificationPopover';
import { useFeedback } from '@/shared/hooks/useFeedback';

function NotificationBell() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { triggerFeedback } = useFeedback();
  const previousCountRef = useRef<number>(0);

  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.notification.filter({ wallet_owner: user.email, is_read: false });
    },
    enabled: !!user?.email,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notifications?.length || 0;

  // Trigger feedback when new notification arrives
  useEffect(() => {
    if (previousCountRef.current > 0 && unreadCount > previousCountRef.current) {
      triggerFeedback('notification');
    }
    previousCountRef.current = unreadCount;
  }, [unreadCount, triggerFeedback]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          triggerFeedback('click');
          setIsOpen(!isOpen);
        }}
        className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-app-soft transition-colors hover:bg-app-bg hover:text-app"
        title={t('notifications.title')}
        aria-label={t('notifications.title')}
      >
        <BellIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500 ring-2 ring-white rtl:right-auto rtl:left-0" />
        )}
      </button>
      {isOpen && <NotificationPopover onClose={() => setIsOpen(false)} />}
    </div>
  );
}

export default NotificationBell;

