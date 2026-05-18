import { useTranslation } from 'react-i18next';

import { ScoreBadge } from '../../../../components/shared/ScoreBadge';
import { formatCurrency } from '../../../../utils/formatters';
import { useLanguage } from '../../../../hooks/useLanguage';
import styles from './ReservationCard.module.css';

export type ReservationCardProps = {
  price: number | null;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  cityLabel: string;
  onBook?: () => void;
  onContact?: () => void;
};

export function ReservationCard({
  price,
  averageRating,
  totalReviews,
  isVerified,
  cityLabel,
  onBook,
  onContact,
}: ReservationCardProps) {
  const { t } = useTranslation('listings');
  const { currentLang } = useLanguage();

  return (
    <aside className={styles.card} data-testid="reservation-card">
      {price != null ? (
        <p className={styles.price}>
          {formatCurrency(price, currentLang)}
          <span className={styles.taxes}> {t('taxesAndFees')}</span>
        </p>
      ) : null}
      {averageRating > 0 ? (
        <ScoreBadge averageRating={averageRating} totalReviews={totalReviews} />
      ) : null}
      <button type="button" className="btnPrimary" onClick={onBook}>
        {t('bookNow')}
      </button>
      <button type="button" className="btnSecondary" onClick={onContact}>
        {t('contactVenue')}
      </button>
      <ul className={styles.highlights}>
        {isVerified ? <li>✓ {t('highlightVerified')}</li> : null}
        <li>✓ {t('highlightLocation')}: {cityLabel}</li>
        {averageRating > 0 ? <li>✓ {t('highlightRated')}</li> : null}
      </ul>
    </aside>
  );
}
