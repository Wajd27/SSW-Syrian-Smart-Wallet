import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import Button from '../Button/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInStandaloneMode = (window.navigator as any).standalone || standalone;
    setIsStandalone(isInStandaloneMode);
    setIsInstalled(isInStandaloneMode);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if already installed on iOS
    if (iOS && isInStandaloneMode) {
      return;
    }

    // Handle beforeinstallprompt event (Android/Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay if not dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was just installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // For iOS, show instructions
      if (isIOS) {
        setShowPrompt(true);
      }
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
      setIsInstalled(true);
    } else {
      setShowPrompt(false);
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or in standalone mode
  if (isInstalled || isStandalone || !showPrompt) {
    return null;
  }

  // iOS Install Instructions
  if (isIOS && showPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
        <div className="glass-card backdrop-blur-xl bg-white/40 border border-blue-200/50 rounded-xl p-4 shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                {t('install.installApp') || 'Install App'}
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2 text-sm text-gray-700 mb-4">
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

  // Android/Desktop Install Prompt
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
        <div className="glass-card backdrop-blur-xl bg-white/40 border border-blue-200/50 rounded-xl p-4 shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <ComputerDesktopIcon className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                {t('install.installApp') || 'Install App'}
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-700 mb-4">
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

