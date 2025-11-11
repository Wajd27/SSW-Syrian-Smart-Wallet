import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Workbox } from 'workbox-window';
import Button from '@/shared/components/Button/Button';
import Modal from '@/shared/components/Modal/Modal';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

function ServiceWorkerUpdate() {
  const { t } = useTranslation();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [wb, setWb] = useState<Workbox | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && (import.meta as any).env?.PROD) {
      const workbox = new Workbox('/sw.js', { type: 'classic' });
      setWb(workbox);

      // Check for updates every hour
      const checkForUpdates = () => {
        workbox.update();
      };

      // Check immediately and then every hour
      checkForUpdates();
      const interval = setInterval(checkForUpdates, 60 * 60 * 1000); // 1 hour

      // Listen for service worker waiting (update available)
      workbox.addEventListener('waiting', () => {
        setUpdateAvailable(true);
      });

      // Listen for service worker controlling (update installed)
      workbox.addEventListener('controlling', () => {
        // Reload the page to use the new service worker
        window.location.reload();
      });

      // Register the service worker
      workbox.register().catch((err) => {
        console.error('Service worker registration failed:', err);
      });

      return () => {
        clearInterval(interval);
      };
    }
  }, []);

  const handleUpdate = async () => {
    if (wb) {
      setIsUpdating(true);
      
      // Send skipWaiting message to the service worker
      wb.messageSkipWaiting();
      
      // The service worker will take control and trigger 'controlling' event
      // which will reload the page
    }
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <Modal
      isOpen={updateAvailable}
      onClose={() => setUpdateAvailable(false)}
      title={t('common.updateAvailable') || 'Update Available'}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          {t('common.updateAvailableMessage') || 'A new version of the app is available. Would you like to update now?'}
        </p>
        <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-4">
          <Button
            variant="secondary"
            onClick={() => setUpdateAvailable(false)}
            disabled={isUpdating}
          >
            {t('common.later') || 'Later'}
          </Button>
          <Button
            onClick={handleUpdate}
            isLoading={isUpdating}
            className="flex items-center"
          >
            <ArrowPathIcon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2" />
            {t('common.update') || 'Update Now'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ServiceWorkerUpdate;

