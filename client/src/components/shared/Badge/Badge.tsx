import type { ReactNode } from 'react';

import styles from './Badge.module.css';

export type BadgeVariant =
  | 'featured'
  | 'deal'
  | 'new'
  | 'popular'
  | 'verified'
  | 'score';

export type BadgeProps = {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
  'data-testid'?: string;
};

export function Badge({ variant, children, className, 'data-testid': testId }: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[variant], className].filter(Boolean).join(' ')}
      data-testid={testId}
    >
      {children}
    </span>
  );
}
