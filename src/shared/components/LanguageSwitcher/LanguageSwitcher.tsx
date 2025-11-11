import React from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', newLang);
  };

  // Set initial direction
  React.useEffect(() => {
    const currentLang = i18n.language || 'en';
    const dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', currentLang);
  }, [i18n.language]);

  return (
    <button
      onClick={toggleLanguage}
      className="p-1.5 sm:p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-blue-50/60 transition-colors flex items-center"
      title={i18n.language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <GlobeAltIcon className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="ml-1 rtl:ml-0 rtl:mr-1 text-xs sm:text-sm font-medium hidden sm:inline">{i18n.language === 'ar' ? 'EN' : 'AR'}</span>
    </button>
  );
}

export default LanguageSwitcher;

