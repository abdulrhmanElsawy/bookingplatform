import { useTranslation } from 'react-i18next';

import styles from './CategoryComingSoon.module.css';

export type CategoryComingSoonProps = {
  className?: string;
};

export function CategoryComingSoon({ className }: CategoryComingSoonProps) {
  const { t } = useTranslation('common');

  return (
    <span className={`${styles.overlay} ${className ?? ''}`.trim()} aria-hidden>
      <span className={styles.badge}>{t('categoryComingSoon')}</span>
    </span>
  );
}
