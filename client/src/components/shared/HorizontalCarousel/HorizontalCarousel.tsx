import type { ReactNode } from 'react';

import styles from './HorizontalCarousel.module.css';

export type HorizontalCarouselProps = {
  children: ReactNode;
  ariaLabel: string;
};

export function HorizontalCarousel({ children, ariaLabel }: HorizontalCarouselProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.track} role="list" aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  );
}
