import { useTranslation } from 'react-i18next';

import styles from './RoleSelector.module.css';

export type RegistrationRole = 'user' | 'gym_owner';

interface RoleSelectorProps {
  value: RegistrationRole;
  onChange: (role: RegistrationRole) => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const { t } = useTranslation('auth');

  return (
    <div className={styles.grid} data-testid="role-selector">
      <button
        type="button"
        className={`${styles.card} ${value === 'user' ? styles.cardActive : ''}`}
        onClick={() => onChange('user')}
      >
        <p className={styles.title}>{t('roleUser')}</p>
        <p className={styles.desc}>{t('roleUserDesc')}</p>
      </button>
      <button
        type="button"
        className={`${styles.card} ${value === 'gym_owner' ? styles.cardActive : ''}`}
        onClick={() => onChange('gym_owner')}
      >
        <p className={styles.title}>{t('roleGymOwner')}</p>
        <p className={styles.desc}>{t('roleGymOwnerDesc')}</p>
      </button>
    </div>
  );
}
