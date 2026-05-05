import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from '@/src/infrastructure/lang/translation/en.json';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: {
        translation: enTranslation,
      },
    },
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
