import { useTranslation } from 'react-i18next';

import { getSupportedAppLanguages } from '../../config/publicEnv';
import { useLanguage } from '../../hooks/useLanguage';
import styles from './LanguageSwitcher.module.css';

export type LanguageSwitcherProps = {
  /** `header` = white text on blue bar (mobile auth); `panel` = default pill on white card */
  variant?: 'panel' | 'header';
};

export function LanguageSwitcher({ variant = 'panel' }: LanguageSwitcherProps) {
  const { t } = useTranslation('common');
  const { switchLanguage, currentLang } = useLanguage();
  const supported = getSupportedAppLanguages();
  const showAr = supported.includes('ar');
  const showEn = supported.includes('en');
  const rootClass =
    variant === 'header'
      ? `${styles.root} ${styles.rootHeader}`
      : styles.root;

  if (!showAr && !showEn) {
    return null;
  }

  if (!showAr || !showEn) {
    const only = showAr ? 'ar' : 'en';
    return (
      <div
        className={rootClass}
        role="group"
        aria-label={t('language')}
        data-testid="auth-language-switcher"
      >
        <span className={variant === 'header' ? styles.activeHeader : styles.active}>
          {only.toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div
      className={rootClass}
      role="group"
      aria-label={t('language')}
      data-testid="auth-language-switcher"
    >
      <button
        type="button"
        className={
          currentLang === 'ar'
            ? variant === 'header'
              ? styles.activeHeader
              : styles.active
            : variant === 'header'
              ? styles.btnHeader
              : styles.btn
        }
        onClick={() => switchLanguage('ar')}
      >
        AR
      </button>
      <span className={variant === 'header' ? styles.sepHeader : styles.sep} aria-hidden>
        |
      </span>
      <button
        type="button"
        className={
          currentLang === 'en'
            ? variant === 'header'
              ? styles.activeHeader
              : styles.active
            : variant === 'header'
              ? styles.btnHeader
              : styles.btn
        }
        onClick={() => switchLanguage('en')}
      >
        EN
      </button>
    </div>
  );
}
