import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { useCompareStore } from '../../compareStore';
import styles from './CompareFloatingBar.module.css';

export function CompareFloatingBar() {
  const { t } = useTranslation('common');
  const location = useLocation();
  const count = useCompareStore((s) => s.items.length);

  if (count === 0 || location.pathname === '/compare') {
    return null;
  }

  return (
    <div className={styles.bar} data-testid="compare-floating-bar">
      <p className={styles.title}>{t('compareBarTitle', { count })}</p>
      <Link className={styles.cta} to="/compare" data-testid="compare-floating-bar-cta">
        {t('compareBarCta')}
      </Link>
    </div>
  );
}
