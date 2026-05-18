import { ThumbsUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ScoreBadge } from '../../../../components/shared/ScoreBadge';
import type { ReviewDto } from '../../api/reviewsApi';
import { useLanguage } from '../../../../hooks/useLanguage';
import { formatDate } from '../../../../utils/formatters';
import styles from './ReviewCard.module.css';

const VISIT_TYPE_KEY: Record<ReviewDto['visitType'], string> = {
  individual: 'visitIndividual',
  group: 'visitGroup',
  family: 'visitFamily',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase() || '?';
}

export type ReviewCardProps = {
  review: ReviewDto;
};

export function ReviewCard({ review }: ReviewCardProps) {
  const { t } = useTranslation(['reviews', 'listings']);
  const { currentLang } = useLanguage();

  const user = review.user;
  const authorName =
    user && typeof user === 'object' && 'firstName' in user
      ? `${user.firstName} ${user.lastName}`.trim()
      : t('reviews:anonymous');

  const visitLabel = t(`reviews:${VISIT_TYPE_KEY[review.visitType]}` as 'visitIndividual');
  const visitDate = formatDate(new Date(review.visitDate), currentLang);
  const posted = formatDate(new Date(review.createdAt), currentLang);
  const avg = review.rating.overall;

  return (
    <article className={styles.card} data-testid="review-card">
      <div className={styles.header}>
        <span className={styles.avatar} aria-hidden>
          {initials(authorName)}
        </span>
        <div className={styles.authorBlock}>
          <span className={styles.author}>{authorName}</span>
          <span className={styles.meta}>
            {t('listings:reviewGuest')} · {visitDate} · {visitLabel}
          </span>
        </div>
        <ScoreBadge averageRating={avg} compact />
      </div>

      <div className={styles.positive}>
        <ThumbsUp className={styles.icon} size={18} strokeWidth={2} aria-hidden />
        <div>
          <strong>{t('listings:positiveReview')}</strong>
          <p className={styles.quote}>{review.title}</p>
        </div>
      </div>

      <p className={styles.body}>{review.content}</p>

      {review.ownerReply?.content ? (
        <div className={styles.ownerReply}>
          <p className={styles.ownerReplyTitle}>{t('reviews:ownerReply')}</p>
          <p className={styles.ownerReplyMeta}>
            {formatDate(new Date(review.ownerReply.repliedAt), currentLang)}
          </p>
          <p className={styles.body}>{review.ownerReply.content}</p>
        </div>
      ) : null}

      <footer className={styles.footer}>
        {posted}
        {review.isVerified ? (
          <span className={styles.verified}>{t('reviews:verifiedReview')}</span>
        ) : null}
      </footer>
    </article>
  );
}
