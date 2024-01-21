// i18n.js
import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

if (!i18n.isInitialized) {
  i18n
    .use(Backend)
    .use(initReactI18next) // Pass i18n instance to react-i18next
    .init({
      fallbackLng: 'en',
      debug: false,
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
      },
      react: {
        useSuspense: false, // Set to true to use React Suspense
      },
    });
}

export default i18n;
