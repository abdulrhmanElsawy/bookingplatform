import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useAuthStore } from '../../../store/authStore';
import styles from './GuestSavingsStrip.module.css';

export function GuestSavingsStrip() {
  const { t } = useTranslation('common');
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (sessionStatus !== 'ready' || isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.strip} data-testid="guest-savings-strip">
      <p className={styles.text}>{t('guestSavingsTitle')}</p>
      <Link className={styles.cta} to="/login">
        {t('guestSavingsCta')}
      </Link>
    </div>
  );
}
