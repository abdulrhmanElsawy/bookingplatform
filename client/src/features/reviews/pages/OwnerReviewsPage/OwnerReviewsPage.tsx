import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ScoreBadge } from '../../../../components/shared/ScoreBadge';
import { useLanguage } from '../../../../hooks/useLanguage';
import { formatDashboardRating } from '../../../../utils/formatDashboardNumber';
import { formatDate } from '../../../../utils/formatters';
import {
  fetchOwnerReviews,
  postOwnerReviewReply,
  type OwnerReviewRowDto,
  type ReviewDto,
} from '../../api/reviewsApi';
import { getApiErrorMessage } from '../../../../utils/apiErrorMessage';
import styles from './OwnerReviewsPage.module.css';

const VISIT_TYPE_KEY: Record<ReviewDto['visitType'], string> = {
  individual: 'visitIndividual',
  group: 'visitGroup',
  family: 'visitFamily',
};

function guestInitials(firstName: string, lastName: string, fallback: string): string {
  const name = `${firstName} ${lastName}`.trim();
  if (!name) return fallback.charAt(0).toUpperCase() || '?';
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
}

function ReplyForm({ review }: { review: OwnerReviewRowDto }) {
  const { t } = useTranslation('reviews');
  const { t: tErrors } = useTranslation('errors');
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  const mutation = useMutation({
    mutationFn: () => postOwnerReviewReply(review._id, text.trim()),
    onSuccess: async () => {
      setText('');
      await queryClient.invalidateQueries({ queryKey: ['owner-reviews'] });
    },
  });

  const canSubmit = text.trim().length > 0 && !mutation.isPending;

  return (
    <form
      className={styles.replyForm}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) mutation.mutate();
      }}
    >
      <p className={styles.replyLabel} id={`reply-label-${review._id}`}>
        {t('replyToReview')}
      </p>
      <textarea
        id={`owner-reply-${review._id}`}
        className={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('replyPlaceholder')}
        aria-labelledby={`reply-label-${review._id}`}
        rows={4}
      />
      {mutation.isError ? (
        <p className={styles.formError} role="alert">
          {getApiErrorMessage(mutation.error, tErrors)}
        </p>
      ) : null}
      <button type="submit" className={`btnPrimary ${styles.submitBtn}`} disabled={!canSubmit}>
        {t('replyToReview')}
      </button>
    </form>
  );
}

export function OwnerReviewsPage() {
  const { t: tDash } = useTranslation('dashboard');
  const { t: tRev } = useTranslation('reviews');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const { currentLang } = useLanguage();
  const isEn = currentLang === 'en';
  const lang = isEn ? 'en' : 'ar';

  const listQuery = useQuery({
    queryKey: ['owner-reviews', 1],
    queryFn: () => fetchOwnerReviews(1, 40),
  });

  const total = listQuery.data?.total ?? 0;

  return (
    <div className={styles.page} data-testid="owner-reviews-page">
      <div className={styles.container}>
        <Link className={styles.backLink} to="/owner">
          ←{' '}
          {tDash('backToOwnerDashboard', {
            defaultValue: isEn ? 'Back to dashboard' : 'العودة إلى لوحة التحكم',
          })}
        </Link>

        <header className={styles.header}>
          <h1 className={styles.title}>{tDash('reviewsManagement')}</h1>
          <p className={styles.subtitle}>{tDash('ownerReviewsSubtitle')}</p>
          {!listQuery.isLoading && !listQuery.isError && total > 0 ? (
            <span className={styles.countBadge}>
              {tDash('ownerReviewsCount', {
                count: total,
                defaultValue: isEn ? '{{count}} reviews' : '{{count}} تقييم',
              })}
            </span>
          ) : null}
        </header>

        {listQuery.isLoading ? (
          <p className={styles.loadingWrap}>{tCommon('loading')}</p>
        ) : null}

        {listQuery.isError ? (
          <p className={styles.error} role="alert">
            {getApiErrorMessage(listQuery.error, tErrors)}
          </p>
        ) : null}

        {!listQuery.isLoading &&
        !listQuery.isError &&
        listQuery.data &&
        listQuery.data.reviews.length === 0 ? (
          <div className={styles.empty} data-testid="owner-reviews-empty">
            <span className={styles.emptyIcon} aria-hidden>
              <MessageSquare size={24} strokeWidth={2} />
            </span>
            <p className={styles.emptyTitle}>{tRev('noReviewsYet')}</p>
            <p className={styles.emptySub}>
              {tDash('ownerReviewsEmptySub', {
                defaultValue: isEn
                  ? 'When guests leave approved reviews on your venues, they will appear here so you can respond.'
                  : 'عندما يترك الزوار تقييمات معتمدة على منشآتك، ستظهر هنا لتتمكن من الرد عليها.',
              })}
            </p>
          </div>
        ) : null}

        {!listQuery.isLoading && !listQuery.isError && listQuery.data ? (
          <div className={styles.list}>
            {listQuery.data.reviews.map((r) => {
              const listingName = r.listingInfo.name[lang];
              const guest =
                `${r.user.firstName} ${r.user.lastName}`.trim() || tRev('anonymous');
              const listingHref = r.listingInfo.slug ? `/listings/${r.listingInfo.slug}` : null;
              const visitLabel = tRev(VISIT_TYPE_KEY[r.visitType] as 'visitIndividual');
              const visitDate = formatDate(new Date(r.visitDate), currentLang);
              const posted = formatDate(new Date(r.createdAt), currentLang);

              return (
                <article key={r._id} className={styles.card} data-testid={`owner-review-${r._id}`}>
                  <div className={styles.cardTop}>
                    <span className={styles.venuePill}>
                      {listingHref ? (
                        <Link className={styles.listingLink} to={listingHref}>
                          {listingName}
                        </Link>
                      ) : (
                        <span className={styles.venuePlain}>{listingName}</span>
                      )}
                    </span>
                    <ScoreBadge averageRating={r.rating.overall} compact />
                  </div>

                  <div className={styles.reviewHeader}>
                    <span className={styles.avatar} aria-hidden>
                      {guestInitials(r.user.firstName, r.user.lastName, tRev('anonymous'))}
                    </span>
                    <div className={styles.authorBlock}>
                      <span className={styles.guestName}>{guest}</span>
                      <span className={styles.meta}>
                        {visitDate} · {visitLabel} · {tRev('overallLabel')}:{' '}
                        {formatDashboardRating(r.rating.overall, lang)} / 5 · {posted}
                      </span>
                    </div>
                  </div>

                  <h2 className={styles.reviewTitle}>{r.title}</h2>
                  <p className={styles.reviewBody}>{r.content}</p>

                  {r.ownerReply ? (
                    <div className={styles.ownerReplyBlock}>
                      <p className={styles.ownerReplyLabel}>{tRev('ownerReply')}</p>
                      <p className={styles.ownerReplyText}>{r.ownerReply.content}</p>
                    </div>
                  ) : (
                    <ReplyForm review={r} />
                  )}
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
