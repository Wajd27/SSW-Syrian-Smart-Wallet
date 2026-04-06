import React from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', newLang);
  };

  React.useEffect(() => {
    const currentLang = i18n.language || 'en';
    const dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', currentLang);
  }, [i18n.language]);

  const isAr = i18n.language === 'ar';

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl p-2 text-app-soft transition-colors hover:bg-app-bg hover:text-app sm:min-w-0 sm:px-2"
      title={isAr ? t('language.switchToEnglish') : t('language.switchToArabic')}
      aria-label={isAr ? t('language.switchToEnglish') : t('language.switchToArabic')}
    >
      <GlobeAltIcon className="h-5 w-5 shrink-0 sm:h-5 sm:w-5" aria-hidden />
      <span className="hidden text-xs font-medium sm:inline">
        {isAr ? 'EN' : 'AR'}
      </span>
    </button>
  );
}

export default LanguageSwitcher;
