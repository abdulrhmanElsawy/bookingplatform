import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';

import { LanguageSwitcher } from '../../../../components/auth/LanguageSwitcher';
import { AUTH_PANEL_IMAGE } from '../../data/authMedia';

import styles from './AuthLayout.module.css';

export function AuthLayout() {
  const { t } = useTranslation('common');

  return (
    <div className={styles.shell} data-testid="auth-layout">
      <div
        className={styles.bg}
        style={{ backgroundImage: `url(${AUTH_PANEL_IMAGE})` }}
        aria-hidden
      />
      <div className={styles.overlay} aria-hidden />
      <header className={styles.topBar}>
        <Link className={styles.homeLink} to="/" data-testid="auth-back-home">
          <ArrowLeft size={18} strokeWidth={2} className={styles.homeIcon} aria-hidden />
          {t('home')}
        </Link>
        <LanguageSwitcher variant="panel" />
      </header>
      <main className={styles.main}>
        <div className={styles.card}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}