import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GW_LANGUAGE_CHANGED, type GwLanguageChangedDetail } from '../../lib/languageEvents';

/**
 * Announces UI language changes to assistive tech (`aria-live="polite"`).
 */
export function LanguageLiveRegion() {
  const { i18n } = useTranslation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    let hideTimer: number | undefined;

    const onLang = (e: Event) => {
      const ce = e as CustomEvent<GwLanguageChangedDetail>;
      const { lang } = ce.detail;
      const text =
        lang === 'ar'
          ? i18n.getFixedT('ar')('common:languageSwitchedToArabic')
          : i18n.getFixedT('en')('common:languageSwitchedToEnglish');
      if (hideTimer !== undefined) window.clearTimeout(hideTimer);
      setMessage(text);
      hideTimer = window.setTimeout(() => setMessage(''), 2500);
    };

    window.addEventListener(GW_LANGUAGE_CHANGED, onLang as EventListener);
    return () => {
      window.removeEventListener(GW_LANGUAGE_CHANGED, onLang as EventListener);
      if (hideTimer !== undefined) window.clearTimeout(hideTimer);
    };
  }, [i18n]);

  return (
    <div
      className="srOnly"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="language-live-region"
    >
      {message}
    </div>
  );
}
