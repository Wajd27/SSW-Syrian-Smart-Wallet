import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';

interface NotificationPopoverProps {
  onClose: () => void;
}

function NotificationPopover({ onClose }: NotificationPopoverProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'all', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.notification.filter({ wallet_owner: user.email });
    },
    enabled: !!user?.email,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => entities.notification.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 rtl:right-auto rtl:left-0">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{t('notifications.title')}</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {!notifications || notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {t('notifications.noNotifications')}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications?.slice(0, 10).map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  !notification.is_read ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                  </div>
                  {!notification.is_read && (
                    <div className="ml-2 h-2 w-2 rounded-full bg-primary-600 rtl:ml-0 rtl:mr-2" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationPopover;

