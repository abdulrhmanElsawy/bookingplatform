import './styles/global.css';
import React from 'react';
import ReactDOM from 'react-dom/client';

import {
  configurePublicEnv,
  getDefaultAppLanguage,
  getSupportedAppLanguages,
} from './config/publicEnv';

configurePublicEnv({
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  siteUrl: import.meta.env.VITE_SITE_URL ?? '',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? '',
  googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_KEY ?? '',
  cloudinaryUploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? '',
  defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE ?? '',
  supportedLanguages: import.meta.env.VITE_SUPPORTED_LANGUAGES ?? '',
});

const envDefault = getDefaultAppLanguage();
const supported = getSupportedAppLanguages();
const storedLang = localStorage.getItem('gw_language');
if (storedLang === 'ar' || storedLang === 'en') {
  if (!supported.includes(storedLang)) {
    localStorage.setItem('gw_language', envDefault);
  }
}
const savedLang = localStorage.getItem('gw_language') || envDefault;
document.documentElement.lang = savedLang;
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.setAttribute('data-lang', savedLang);

void import('./i18n').then(({ i18nReady, default: i18n }) => {
  void i18nReady.then(() => {
    void import('./App').then(({ default: App }) => {
      const el = document.getElementById('root');
      if (!el) {
        throw new Error('Root element #root not found');
      }
      ReactDOM.createRoot(el).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      );
      const resolved = i18n.language?.split('-')[0] === 'en' ? 'en' : 'ar';
      document.documentElement.lang = resolved;
      document.documentElement.dir = resolved === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('data-lang', resolved);
    });
  });
});
