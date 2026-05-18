import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { SelectField } from '../../../../components/shared/SelectField';
import { postReview, ReviewsApiError, type ReviewRatingDto } from '../../api/reviewsApi';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import { useAuthStore } from '../../../../store/authStore';
import styles from './ReviewForm.module.css';

const RATING_KEYS: (keyof ReviewRatingDto)[] = [
  'overall',
  'staff',
  'cleanliness',
  'facilities',
  'value',
];

const RATING_LABEL_KEY: Record<keyof ReviewRatingDto, string> = {
  overall: 'yourRating',
  staff: 'staff',
  cleanliness: 'cleanliness',
  facilities: 'facilities',
  value: 'value',
};

export type ReviewFormProps = {
  listingSlug: string;
};

export function ReviewForm({ listingSlug }: ReviewFormProps) {
  const { t } = useTranslation('reviews');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const location = useLocation();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const loginHref = `/login?returnTo=${encodeURIComponent(location.pathname)}`;

  const [rating, setRating] = useState<ReviewRatingDto>({
    overall: 5,
    staff: 5,
    cleanliness: 5,
    facilities: 5,
    value: 5,
  });
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visitDate, setVisitDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [visitType, setVisitType] = useState<'individual' | 'group' | 'family'>(
    'individual',
  );
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      postReview({
        listing: listingSlug,
        rating,
        title: title.trim(),
        content: content.trim(),
        visitDate,
        visitType,
      }),
    onSuccess: async () => {
      setDone(true);
      await queryClient.invalidateQueries({ queryKey: ['reviews', listingSlug] });
      await queryClient.invalidateQueries({ queryKey: ['listing', listingSlug] });
    },
  });

  const errorMessage = useMemo(() => {
    if (!mutation.isError) return '';
    if (mutation.error instanceof ReviewsApiError && mutation.error.status === 409) {
      return t('duplicateReview');
    }
    return getApiErrorMessage(mutation.error, tErrors);
  }, [mutation.error, mutation.isError, t, tErrors]);

  function onSubmit(e: FormEvent): void {
    e.preventDefault();
    setDone(false);
    mutation.mutate();
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.root} data-testid="review-form-guest">
        <h2 className={styles.title}>{t('writeReview')}</h2>
        <p className={styles.hint}>
          {t('loginToReview')}{' '}
          <Link to={loginHref}>{tCommon('login')}</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.root} data-testid="review-form">
      <h2 className={styles.title}>{t('writeReview')}</h2>
      {done ? (
        <p className={styles.success} role="status">
          {t('submitSuccess')}
        </p>
      ) : null}
      {mutation.isError ? <p className={styles.error}>{errorMessage}</p> : null}
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.row}>
          {RATING_KEYS.map((key) => (
            <div key={key} className={styles.field}>
              <label className={styles.label} htmlFor={`rv-${key}`}>
                {t(RATING_LABEL_KEY[key])}
              </label>
              <SelectField
                id={`rv-${key}`}
                size="sm"
                triggerClassName={styles.select}
                value={String(rating[key])}
                onChange={(next) => {
                  const v = Number(next) as ReviewRatingDto[typeof key];
                  setRating((r) => ({ ...r, [key]: v }));
                }}
                options={[5, 4, 3, 2, 1].map((n) => ({
                  value: String(n),
                  label: String(n),
                }))}
              />
            </div>
          ))}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="rv-title">
            {t('reviewTitle')}
          </label>
          <input
            id="rv-title"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="rv-content">
            {t('reviewContent')}
          </label>
          <textarea
            id="rv-content"
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            maxLength={8000}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="rv-visit">
            {t('visitDate')}
          </label>
          <input
            id="rv-visit"
            className={styles.input}
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="rv-type">
            {t('visitType')}
          </label>
          <SelectField
            id="rv-type"
            triggerClassName={styles.select}
            value={visitType}
            onChange={(next) =>
              setVisitType(next as 'individual' | 'group' | 'family')
            }
            options={[
              { value: 'individual', label: t('visitIndividual') },
              { value: 'group', label: t('visitGroup') },
              { value: 'family', label: t('visitFamily') },
            ]}
          />
        </div>
        <button
          type="submit"
          className={styles.submit}
          disabled={mutation.isPending || !title.trim() || !content.trim()}
        >
          {t('submitReview')}
        </button>
      </form>
    </div>
  );
}
