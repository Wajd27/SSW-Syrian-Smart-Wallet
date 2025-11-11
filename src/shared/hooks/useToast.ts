import { useCallback } from 'react';
import { toastManager } from '@/shared/components/Toast/ToastContainer';
import { useTranslation } from 'react-i18next';

export function useToast() {
  const { t } = useTranslation();

  const showSuccess = useCallback((message?: string) => {
    toastManager.success(message || t('common.success') || 'Success');
  }, [t]);

  const showError = useCallback((message?: string) => {
    toastManager.error(message || t('common.error') || 'An error occurred');
  }, [t]);

  const showWarning = useCallback((message: string) => {
    toastManager.warning(message);
  }, []);

  const showInfo = useCallback((message: string) => {
    toastManager.info(message);
  }, []);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}

