import type { ReactNode } from 'react';

import styles from './PageShell.module.css';

export type PageShellProps = {
  children: ReactNode;
  title?: string;
  narrow?: boolean;
};

export function PageShell({ children, title, narrow }: PageShellProps) {
  return (
    <div className={styles.shell}>
      <div className={`${styles.inner} ${narrow ? styles.narrow : ''}`}>
        {title ? <h1 className={styles.title}>{title}</h1> : null}
        {children}
      </div>
    </div>
  );
}
