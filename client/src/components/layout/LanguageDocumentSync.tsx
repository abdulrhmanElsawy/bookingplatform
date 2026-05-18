import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function applyLangToDocument(lang: string) {
  const resolved: 'ar' | 'en' = lang.startsWith('en') ? 'en' : 'ar';
  document.documentElement.lang = resolved;
  document.documentElement.dir = resolved === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('data-lang', resolved);
}

export function LanguageDocumentSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    applyLangToDocument(i18n.language);
    const onChange = (lng: string) => applyLangToDocument(lng);
    i18n.on('languageChanged', onChange);
    return () => {
      i18n.off('languageChanged', onChange);
    };
  }, [i18n]);

  return null;
}
