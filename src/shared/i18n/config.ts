import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';
import { guideSectionsEn, guideSectionsAr } from './guideSections';

const enMerged = {
  ...enTranslations,
  userGuide: {
    ...enTranslations.userGuide,
    sections: guideSectionsEn,
  },
};

const arMerged = {
  ...arTranslations,
  userGuide: {
    ...arTranslations.userGuide,
    sections: guideSectionsAr,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enMerged,
      },
      ar: {
        translation: arMerged,
      },
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

