import { useTranslation } from 'react-i18next';

import { useLanguage } from '../../../../hooks/useLanguage';
import { formatNumber } from '../../../../utils/formatters';
import { getScoreLabelKey, ratingToScore10 } from '../../../../utils/ratingScore';
import styles from './RatingSummary.module.css';

const STAR_ORDER = [5, 4, 3, 2, 1] as const;

const BAR_LABEL_KEY: Record<(typeof STAR_ORDER)[number], string> = {
  5: 'excellent',
  4: 'veryGood',
  3: 'good',
  2: 'fair',
  1: 'poor',
};

export type RatingSummaryProps = {
  averageRating: number;
  totalReviews: number;
  breakdown?: Partial<Record<'1' | '2' | '3' | '4' | '5', number>> | null;
  dimensionAverages?: {
    staff?: number;
    cleanliness?: number;
    facilities?: number;
    value?: number;
  } | null;
};

function countForStar(
  breakdown: RatingSummaryProps['breakdown'],
  star: number,
): number {
  if (!breakdown) return 0;
  const key = String(star) as '1' | '2' | '3' | '4' | '5';
  return breakdown[key] ?? 0;
}

export function RatingSummary({
  averageRating,
  totalReviews,
  breakdown,
  dimensionAverages,
}: RatingSummaryProps) {
  const { t } = useTranslation('reviews');
  const { t: tCommon } = useTranslation('common');
  const { currentLang } = useLanguage();

  const score10 = ratingToScore10(averageRating);
  const labelKey = getScoreLabelKey(score10);

  const maxBar = STAR_ORDER.reduce(
    (m, s) => Math.max(m, countForStar(breakdown, s)),
    0,
  );

  const dimensions: {
    key: keyof NonNullable<RatingSummaryProps['dimensionAverages']>;
    label: string;
  }[] = [
    { key: 'cleanliness', label: t('cleanliness') },
    { key: 'facilities', label: t('facilities') },
    { key: 'staff', label: t('staff') },
    { key: 'value', label: t('value') },
  ];

  return (
    <div className={styles.root} data-testid="rating-summary">
      <div className={styles.hero}>
        <span className={styles.bigScore}>{formatNumber(score10, currentLang)}</span>
        <div>
          <span className={styles.bigLabel}>{tCommon(labelKey)}</span>
          <p className={styles.count}>{t('reviewCount', { count: totalReviews })}</p>
        </div>
      </div>

      {dimensionAverages ? (
        <div className={styles.dimensions}>
          {dimensions.map(({ key, label }) => {
            const val = dimensionAverages[key];
            if (val == null) return null;
            const pct = Math.round((val / 5) * 100);
            return (
              <div key={key} className={styles.dimRow}>
                <span className={styles.dimLabel}>{label}</span>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.dimVal}>{formatNumber(val, currentLang)}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {breakdown ? (
        <div className={styles.starBars}>
          {STAR_ORDER.map((star) => {
            const count = countForStar(breakdown, star);
            const pct = maxBar > 0 ? Math.round((count / maxBar) * 100) : 0;
            const labelKeyStar = BAR_LABEL_KEY[star];
            return (
              <div key={star} className={styles.barRow}>
                <span className={styles.barLabel}>
                  {star} ★ — {t(labelKeyStar)}
                </span>
                <div className={styles.barTrackWrap}>
                  <div className={styles.track}>
                    <div className={styles.fill} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={styles.countHint}>{formatNumber(count, currentLang)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
