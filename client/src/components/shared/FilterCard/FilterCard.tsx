import type { ReactNode } from 'react';

import styles from './FilterCard.module.css';

export type FilterCardProps = {
  title: string;
  children: ReactNode;
  compact?: boolean;
};

export function FilterCard({ title, children, compact }: FilterCardProps) {
  return (
    <section className={`${styles.card} ${compact ? styles.cardCompact : ''}`.trim()}>
      <h3 className={styles.title}>{title}</h3>
      {children}
    </section>
  );
}
