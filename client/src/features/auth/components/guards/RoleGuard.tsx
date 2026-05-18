import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '../../../../store/authStore';

import styles from './RoleGuard.module.css';

interface RoleGuardProps {
  allow: string[];
  children: ReactNode;
}

export function RoleGuard({ allow, children }: RoleGuardProps) {
  const { t } = useTranslation('errors');
  const role = useAuthStore((s) => s.user?.role);

  if (!role || !allow.includes(role)) {
    return (
      <section className={styles.wrap} data-testid="role-guard-forbidden">
        <h1 className={styles.title}>403</h1>
        <p className={styles.body}>{t('forbidden')}</p>
      </section>
    );
  }

  return children;
}
