import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enDashboard from './locales/en/dashboard.json';
import enHoldings from './locales/en/holdings.json';
import enSync from './locales/en/sync.json';
import enTransactions from './locales/en/transactions.json';
import enNotifications from './locales/en/notifications.json';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: {
        common: enCommon,
        nav: enNav,
        dashboard: enDashboard,
        holdings: enHoldings,
        sync: enSync,
        transactions: enTransactions,
        notifications: enNotifications,
      },
    },
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
