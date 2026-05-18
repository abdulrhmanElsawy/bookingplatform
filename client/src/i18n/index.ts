import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import { getDefaultAppLanguage, getSupportedAppLanguages } from '../config/publicEnv';
import arSubscriptions from './locales/ar/subscriptions.json';
import enSubscriptions from './locales/en/subscriptions.json';

export const namespaces = [
  'common',
  'auth',
  'listings',
  'reviews',
  'dashboard',
  'admin',
  'profile',
  'notifications',
  'payments',
  'subscriptions',
  'errors',
] as const;

const initialLng = getDefaultAppLanguage();
const supportedLngs = getSupportedAppLanguages();

async function buildBackendOptions(): Promise<Record<string, unknown>> {
  const backend: Record<string, unknown> = {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  };
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    const { i18nextNodeRequest } = await import('./nodeTestRequest.js');
    backend.request = i18nextNodeRequest;
  }
  return backend;
}

export const i18nReady = buildBackendOptions().then((backend) =>
  i18n
    .use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      lng: initialLng,
      fallbackLng: initialLng,
      supportedLngs,
      nonExplicitSupportedLngs: true,
      defaultNS: 'common',
      ns: [...namespaces],
      partialBundledLanguages: true,
      resources: {
        en: { subscriptions: enSubscriptions },
        ar: { subscriptions: arSubscriptions },
      },
      interpolation: { escapeValue: false },
      backend,
      react: {
        useSuspense: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'gw_language',
      },
    }),
);

export default i18n;
