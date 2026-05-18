import { SkeletonBar } from '../../../../components/shared/skeleton';

import styles from './ReviewsSkeleton.module.css';

export function ReviewsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.list} data-testid="reviews-skeleton" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.card}>
          <SkeletonBar variant="short" />
          <SkeletonBar variant="medium" className={styles.spaced} />
          <SkeletonBar variant="medium" className={styles.spaced} />
        </div>
      ))}
    </div>
  );
}
