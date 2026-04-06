import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import Button from '../Button/Button';
import { usePwaInstallPrompt, clearPwaInstallDeferred } from '@/shared/hooks/usePwaInstallPrompt';

function InstallPrompt() {
  const { t } = useTranslation();
  const { deferredPrompt } = usePwaInstallPrompt();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInStandaloneMode = (window.navigator as Navigator & { standalone?: boolean }).standalone || standalone;
    setIsStandalone(isInStandaloneMode);
    setIsInstalled(isInStandaloneMode);

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(iOS);

    if (isInStandaloneMode) {
      return undefined;
    }

    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      return undefined;
    }

    // Chromium: deferred prompt. iOS Safari: no beforeinstallprompt — still show manual steps.
    const shouldOfferInstall = Boolean(deferredPrompt) || iOS;
    if (!shouldOfferInstall) {
      return undefined;
    }

    const id = window.setTimeout(() => setShowPrompt(true), 3000);
    return () => window.clearTimeout(id);
  }, [deferredPrompt]);

  useEffect(() => {
    const onInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowPrompt(true);
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      setIsInstalled(true);
    } else {
      setShowPrompt(false);
      sessionStorage.setItem('pwa-install-dismissed', 'true');
      clearPwaInstallDeferred();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
    clearPwaInstallDeferred();
  };

  if (isInstalled || isStandalone || !showPrompt) {
    return null;
  }

  if (isIOS && showPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] animate-slide-up">
        <div className="surface-panel rounded-2xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <DevicePhoneMobileIcon className="w-6 h-6 text-primary-500" />
              <h3 className="text-lg font-semibold text-app">
                {t('install.installApp') || 'Install App'}
              </h3>
            </div>
            <button type="button" onClick={handleDismiss} className="text-muted hover:text-app transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2 text-sm text-app-soft mb-4">
            <p className="font-medium">{t('install.iosInstructions') || 'To install this app on your iOS device, please use Safari:'}</p>
            <ol className="list-decimal list-inside space-y-1 rtl:text-right">
              <li>{t('install.iosStep1') || 'Open this page in Safari browser'}</li>
              <li>{t('install.iosStep2') || 'Tap the Share button at the bottom'}</li>
              <li>{t('install.iosStep3') || 'Scroll down and tap "Add to Home Screen"'}</li>
              <li>{t('install.iosStep4') || 'Tap "Add" to confirm'}</li>
            </ol>
          </div>
          <Button onClick={handleDismiss} variant="primary" size="sm" className="w-full">
            {t('common.gotIt') || 'Got it'}
          </Button>
        </div>
      </div>
    );
  }

  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] animate-slide-up">
        <div className="surface-panel rounded-2xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <ComputerDesktopIcon className="w-6 h-6 text-primary-500" />
              <h3 className="text-lg font-semibold text-app">
                {t('install.installApp') || 'Install App'}
              </h3>
            </div>
            <button type="button" onClick={handleDismiss} className="text-muted hover:text-app transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-app-soft mb-4">
            {t('install.installDescription') || 'Install this app on your device for a better experience and offline access.'}
          </p>
          <div className="flex space-x-2 rtl:space-x-reverse">
            <Button onClick={handleDismiss} variant="secondary" size="sm" className="flex-1">
              {t('common.later') || 'Later'}
            </Button>
            <Button onClick={handleInstallClick} variant="primary" size="sm" className="flex-1">
              {t('install.install') || 'Install'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default InstallPrompt;
