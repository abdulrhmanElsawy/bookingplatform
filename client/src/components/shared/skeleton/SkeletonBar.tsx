import type { HTMLAttributes } from 'react';

import styles from './Skeleton.module.css';

export type SkeletonBarProps = HTMLAttributes<HTMLDivElement> & {
  /** Width preset; `full` spans the container. */
  variant?: 'full' | 'short' | 'medium';
};

export function SkeletonBar({ variant = 'full', className = '', ...rest }: SkeletonBarProps) {
  const widthMod =
    variant === 'short' ? styles.barShort : variant === 'medium' ? styles.barMedium : '';
  const combined = [styles.bar, widthMod, className].filter(Boolean).join(' ');
  return <div className={combined} {...rest} />;
}
