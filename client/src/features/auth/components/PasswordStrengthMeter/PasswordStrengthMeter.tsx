import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './PasswordStrengthMeter.module.css';

export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4;

export function passwordStrengthLevel(password: string): PasswordStrengthLevel {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/i.test(password) && /[0-9]/.test(password)) score += 1;
  if (/[^a-z0-9]/i.test(password)) score += 1;
  return Math.min(4, score) as PasswordStrengthLevel;
}

function labelKey(level: PasswordStrengthLevel): string {
  switch (level) {
    case 0:
    case 1:
      return 'passwordWeak';
    case 2:
      return 'passwordFair';
    case 3:
      return 'passwordGood';
    case 4:
      return 'passwordStrong';
    default:
      return 'passwordWeak';
  }
}

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { t } = useTranslation('auth');
  const level = useMemo(() => passwordStrengthLevel(password), [password]);
  const pct = (level / 4) * 100;

  return (
    <div className={styles.root} data-testid="password-strength">
      <div className={styles.label}>{t(labelKey(level))}</div>
      <p className={styles.hint}>{t('passwordRequirements')}</p>
      <div className={styles.track} aria-hidden>
        <div
          className={styles.fill}
          data-level={level}
          style={{ inlineSize: `${pct}%` }}
        />
      </div>
    </div>
  );
}
