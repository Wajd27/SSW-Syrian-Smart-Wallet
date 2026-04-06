import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Button from '../Button/Button';
import { usePwaInstallPrompt } from '@/shared/hooks/usePwaInstallPrompt';

function InstallButton() {
  const { t } = useTranslation();
  const { deferredPrompt } = usePwaInstallPrompt();
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInStandaloneMode = (window.navigator as Navigator & { standalone?: boolean }).standalone || standalone;
    setIsStandalone(isInStandaloneMode);

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(iOS);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (!isSafari) {
        alert(t('install.iosInstructions') || 'To install this app on your iOS device, please use Safari:');
      }
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      /* appinstalled will clear deferred state */
    }
  };

  if (isStandalone || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="flex items-center space-x-1 rtl:space-x-reverse"
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
        <span>{t('install.install') || 'Install'}</span>
      </Button>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="surface-panel rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-app">
                {t('install.installApp') || 'Install App'}
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="text-muted hover:text-app transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 text-sm text-app-soft mb-6">
              <p className="font-medium">{t('install.iosInstructions') || 'To install this app on your iOS device, please use Safari:'}</p>
              <ol className="list-decimal list-inside space-y-2 rtl:text-right">
                <li>{t('install.iosStep1') || 'Open this page in Safari browser'}</li>
                <li>{t('install.iosStep2') || 'Tap the Share button at the bottom'}</li>
                <li>{t('install.iosStep3') || 'Scroll down and tap "Add to Home Screen"'}</li>
                <li>{t('install.iosStep4') || 'Tap "Add" to confirm'}</li>
              </ol>
            </div>
            <Button onClick={() => setShowIOSModal(false)} variant="primary" className="w-full">
              {t('common.gotIt') || 'Got it'}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default InstallButton;
