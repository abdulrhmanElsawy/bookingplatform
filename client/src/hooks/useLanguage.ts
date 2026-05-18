import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { GW_LANGUAGE_CHANGED, type GwLanguageChangedDetail } from '../lib/languageEvents';
import { syncLanguagePreference } from '../services/userPreferenceSync';
import { useAuthStore } from '../store/authStore';

export type AppLang = 'ar' | 'en';

export function useLanguage() {
  const { i18n } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const switchLanguage = useCallback(
    async (lang: AppLang) => {
      const prev: AppLang = i18n.language?.split('-')[0] === 'en' ? 'en' : 'ar';
      await i18n.changeLanguage(lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('data-lang', lang);
      localStorage.setItem('gw_language', lang);

      if (prev !== lang) {
        window.dispatchEvent(
          new CustomEvent<GwLanguageChangedDetail>(GW_LANGUAGE_CHANGED, { detail: { lang } }),
        );
      }

      if (isAuthenticated) {
        await syncLanguagePreference(lang);
      }
    },
    [i18n, isAuthenticated],
  );

  const rawLang = i18n.language?.split('-')[0];
  const currentLang: AppLang = rawLang === 'en' ? 'en' : 'ar';
  const isRTL = currentLang === 'ar';

  return { switchLanguage, isRTL, currentLang };
}
