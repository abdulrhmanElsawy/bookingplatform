import { useTranslation } from 'react-i18next';

import { useLanguage } from '../../../hooks/useLanguage';
import { formatNumber } from '../../../utils/formatters';
import { getScoreLabelKey, ratingToScore10 } from '../../../utils/ratingScore';
import styles from './ScoreBadge.module.css';

export type ScoreBadgeProps = {
  averageRating: number;
  totalReviews?: number;
  compact?: boolean;
};

export function ScoreBadge({ averageRating, totalReviews, compact }: ScoreBadgeProps) {
  const { t } = useTranslation('common');
  const { currentLang } = useLanguage();
  const score10 = ratingToScore10(averageRating);
  const labelKey = getScoreLabelKey(score10);

  return (
    <div className={`${styles.badge} ${compact ? styles.compact : ''}`} data-testid="score-badge">
      <span className={styles.score}>{formatNumber(score10, currentLang)}</span>
      <div className={styles.meta}>
        <span className={styles.label}>{t(labelKey)}</span>
        {totalReviews != null && totalReviews > 0 && !compact ? (
          <span className={styles.count}>{t('review', { count: totalReviews })}</span>
        ) : null}
      </div>
    </div>
  );
}
