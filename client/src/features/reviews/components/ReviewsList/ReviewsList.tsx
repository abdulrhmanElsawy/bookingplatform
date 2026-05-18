import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { fetchReviews } from '../../api/reviewsApi';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { ReviewCard } from '../ReviewCard/ReviewCard';
import { ReviewsSkeleton } from '../ReviewsSkeleton/ReviewsSkeleton';
import styles from './ReviewsList.module.css';

export type ReviewsListProps = {
  listingSlug: string;
  onDimensionAverages?: (avg: {
    staff: number;
    cleanliness: number;
    facilities: number;
    value: number;
  }) => void;
};

export function ReviewsList({ listingSlug, onDimensionAverages }: ReviewsListProps) {
  const { t } = useTranslation('reviews');
  const { t: tErrors } = useTranslation('errors');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['reviews', listingSlug],
    queryFn: () => fetchReviews(listingSlug, 1, 20),
    enabled: Boolean(listingSlug),
  });

  const filtered = useMemo(() => {
    const reviews = data?.reviews ?? [];
    if (ratingFilter == null) return reviews;
    return reviews.filter((r) => Math.round(r.rating.overall) === ratingFilter);
  }, [data?.reviews, ratingFilter]);

  useEffect(() => {
    const reviews = data?.reviews ?? [];
    if (!reviews.length || !onDimensionAverages) return;
    const n = reviews.length;
    const sums = reviews.reduce(
      (acc, r) => ({
        staff: acc.staff + r.rating.staff,
        cleanliness: acc.cleanliness + r.rating.cleanliness,
        facilities: acc.facilities + r.rating.facilities,
        value: acc.value + r.rating.value,
      }),
      { staff: 0, cleanliness: 0, facilities: 0, value: 0 },
    );
    onDimensionAverages({
      staff: sums.staff / n,
      cleanliness: sums.cleanliness / n,
      facilities: sums.facilities / n,
      value: sums.value / n,
    });
  }, [data?.reviews, onDimensionAverages]);

  return (
    <div className={styles.root} data-testid="reviews-list">
      <div className={styles.head}>
        <h2 className={styles.title}>{t('allReviews')}</h2>
        <div className={styles.chips} role="group" aria-label={t('filterByRating')}>
          <button
            type="button"
            className={`${styles.chip} ${ratingFilter === null ? styles.chipActive : ''}`}
            onClick={() => setRatingFilter(null)}
          >
            {t('allRatings')}
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              type="button"
              className={`${styles.chip} ${ratingFilter === star ? styles.chipActive : ''}`}
              onClick={() => setRatingFilter(star)}
            >
              {star} ★
            </button>
          ))}
        </div>
      </div>
      {isLoading ? <ReviewsSkeleton /> : null}
      {isError ? (
        <p className={styles.error}>{getApiErrorMessage(error, tErrors)}</p>
      ) : null}
      {!isLoading && !isError && data?.total === 0 ? (
        <p className={styles.empty}>{t('noReviewsYet')}</p>
      ) : null}
      {!isLoading && !isError && filtered.length > 0 ? (
        <div className={styles.list}>
          {filtered.map((r) => (
            <ReviewCard key={r._id} review={r} />
          ))}
        </div>
      ) : null}
      {!isLoading && !isError && data && data.reviews.length > 0 && filtered.length === 0 ? (
        <p className={styles.empty}>{t('noReviewsMatchFilter')}</p>
      ) : null}
    </div>
  );
}
