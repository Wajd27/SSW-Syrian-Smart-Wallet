import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Button from '../Button/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function InstallButton() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if app is already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInStandaloneMode = (window.navigator as any).standalone || standalone;
    setIsStandalone(isInStandaloneMode);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Handle beforeinstallprompt event (Android/Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was just installed
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Check if user is in Safari
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (!isSafari) {
        // Show message to use Safari
        alert(t('install.iosInstructions') || 'To install this app on your iOS device, please use Safari:');
      }
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Don't show if already installed
  if (isStandalone || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="hidden sm:flex items-center space-x-1 rtl:space-x-reverse"
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
        <span>{t('install.install') || 'Install'}</span>
      </Button>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-card backdrop-blur-xl bg-white/40 border border-blue-200/50 rounded-xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {t('install.installApp') || 'Install App'}
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 text-sm text-gray-700 mb-6">
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

