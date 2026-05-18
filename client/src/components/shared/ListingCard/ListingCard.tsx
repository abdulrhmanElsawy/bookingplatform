import type { BilingualField } from '@growth-world/shared';
import { getLocalizedValue } from '@growth-world/shared';
import { Check, ImageIcon, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLanguage } from '../../../hooks/useLanguage';
import { formatCurrency } from '../../../utils/formatters';
import { resolveUploadUrl } from '../../../utils/resolveUploadUrl';
import { getListingCity, getListingName } from '../../../utils/listing';
import { GuestSavingsStrip } from '../GuestSavingsStrip';
import { ScoreBadge } from '../ScoreBadge';
import styles from './ListingCard.module.css';

export type ListingCardImage = {
  url: string;
  alt?: BilingualField;
  isMain?: boolean;
};

export type ListingCardPackage = {
  price: number;
  currency?: string;
};

export type ListingCardData = {
  slug: string;
  name: BilingualField;
  location: { city: BilingualField };
  amenities: string[];
  packages: ListingCardPackage[];
  totalReviews: number;
  averageRating?: number;
  images?: ListingCardImage[];
  isFeatured?: boolean;
  isVerified?: boolean;
  googleMapsUrl?: string;
};

export type ListingCardProps = {
  listing?: ListingCardData;
  variant?: 'grid' | 'list';
  skeleton?: boolean;
  to?: string;
  showDealPrice?: boolean;
};

function pickMainImage(images: ListingCardImage[] | undefined): ListingCardImage | undefined {
  if (!images?.length) return undefined;
  const main = images.find((i) => i.isMain);
  return main ?? images[0];
}

/** Display-only compare price until API adds compareAtPrice. */
function comparePrice(price: number): number {
  return Math.round(price * 1.12);
}

export function ListingCard({
  listing,
  variant = 'grid',
  skeleton,
  to,
  showDealPrice,
}: ListingCardProps) {
  const { t } = useTranslation(['common', 'listings']);
  const { currentLang } = useLanguage();
  const dir = currentLang === 'ar' ? 'rtl' : 'ltr';

  if (skeleton || !listing) {
    return (
      <div
        className={`${styles.card} ${styles.skeleton} ${variant === 'list' ? styles.list : styles.grid}`}
        data-testid="listing-card"
        data-variant="skeleton"
        dir={dir}
        aria-busy="true"
        aria-label={t('common:loading')}
      >
        <div className={styles.media} />
        <div className={styles.body}>
          <div className={`${styles.line} ${styles.lineMedium}`} />
          <div className={`${styles.line} ${styles.lineShort}`} />
          <div className={styles.pills}>
            <div className={styles.pill} />
            <div className={styles.pill} />
          </div>
        </div>
      </div>
    );
  }

  const href = to ?? `/listings/${listing.slug}`;
  const mainImage = pickMainImage(listing.images);
  const imgAlt = mainImage?.alt
    ? getLocalizedValue(mainImage.alt, currentLang)
    : getListingName(listing, currentLang);
  const firstPrice = listing.packages[0]?.price;
  const amenitiesPreview = listing.amenities.slice(0, 3);
  const showStrike = (showDealPrice ?? listing.isFeatured) && firstPrice != null;
  const rating = listing.averageRating ?? 0;

  if (variant === 'list') {
    return (
      <article
        className={`${styles.card} ${styles.list}`}
        data-testid="listing-card"
        data-variant="list"
        dir={dir}
      >
        <Link className={styles.listMedia} to={href} tabIndex={-1} aria-hidden>
          {mainImage ? (
            <img
              className={styles.image}
              src={resolveUploadUrl(mainImage.url)}
              alt=""
              loading="lazy"
            />
          ) : (
            <div className={styles.placeholder} aria-hidden>
              <ImageIcon size={32} strokeWidth={1.5} />
            </div>
          )}
        </Link>
        <div className={styles.listMain}>
          <Link className={styles.titleLink} to={href}>
            <h3 className={styles.title}>{getListingName(listing, currentLang)}</h3>
          </Link>
          <p className={styles.meta} data-testid="listing-card-location">
            <MapPin className={styles.pin} size={14} strokeWidth={2} aria-hidden />
            <span>{getListingCity(listing, currentLang)}</span>
            {listing.googleMapsUrl ? (
              <>
                {' · '}
                <a
                  className={styles.mapLink}
                  href={listing.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t('common:showOnMap')}
                </a>
              </>
            ) : null}
          </p>
          {amenitiesPreview.length > 0 ? (
            <div className={styles.amenities}>
              {amenitiesPreview.map((key) => (
                <span key={key} className={styles.amenity}>
                  {t(`listings:amenities.${key}`)}
                </span>
              ))}
            </div>
          ) : null}
          <ul className={styles.perks}>
            {listing.isVerified ? (
              <li className={styles.perk}>
                <Check size={14} strokeWidth={2.5} aria-hidden /> {t('listings:freeCancellation')}
              </li>
            ) : null}
            {listing.isFeatured ? (
              <li className={styles.perk}>
                <Check size={14} strokeWidth={2.5} aria-hidden /> {t('listings:noPrepayment')}
              </li>
            ) : null}
          </ul>
        </div>
        <div className={styles.listAside}>
          {rating > 0 ? (
            <ScoreBadge averageRating={rating} totalReviews={listing.totalReviews} />
          ) : null}
          <div className={styles.priceBlock}>
            {firstPrice != null ? (
              <>
                {showStrike ? (
                  <span className={styles.priceOriginal}>
                    {formatCurrency(comparePrice(firstPrice), currentLang)}
                  </span>
                ) : null}
                <span className={styles.price}>
                  {formatCurrency(firstPrice, currentLang)}
                </span>
                <span className={styles.taxes}>{t('listings:taxesAndFees')}</span>
              </>
            ) : null}
            <Link className={styles.optionsBtn} to={href}>
              {t('common:seeAllOptions')} ›
            </Link>
          </div>
        </div>
        <GuestSavingsStrip />
      </article>
    );
  }

  return (
    <article
      className={`${styles.card} ${styles.grid}`}
      data-testid="listing-card"
      data-variant="grid"
      dir={dir}
    >
      <Link className={styles.gridLink} to={href}>
        <div className={styles.media}>
          {mainImage ? (
            <img
              className={styles.image}
              src={resolveUploadUrl(mainImage.url)}
              alt={imgAlt}
              loading="lazy"
            />
          ) : (
            <div className={styles.placeholder} aria-hidden>
              <ImageIcon size={32} strokeWidth={1.5} />
            </div>
          )}
          <div className={styles.badges}>
            {listing.isVerified ? (
              <span className={styles.badge}>{t('common:verified')}</span>
            ) : null}
            {listing.isFeatured ? (
              <span className={`${styles.badge} ${styles.badgeFeatured}`}>
                {t('common:featured')}
              </span>
            ) : null}
          </div>
        </div>
        <div className={styles.body}>
          <h3 className={styles.title}>{getListingName(listing, currentLang)}</h3>
          <p className={styles.meta} data-testid="listing-card-location">
            {getListingCity(listing, currentLang)}
          </p>
          {rating > 0 ? (
            <div className={styles.scoreRow}>
              <ScoreBadge
                averageRating={rating}
                totalReviews={listing.totalReviews}
                compact
              />
              <span className={styles.reviewCount} data-testid="listing-card-reviews">
                {t('common:review', { count: listing.totalReviews })}
              </span>
            </div>
          ) : null}
          {firstPrice != null ? (
            <div className={styles.priceRow}>
              {showStrike ? (
                <span className={styles.priceOriginal}>
                  {formatCurrency(comparePrice(firstPrice), currentLang)}
                </span>
              ) : null}
              <span className={styles.price}>
                {t('common:from')} {formatCurrency(firstPrice, currentLang)}
              </span>
            </div>
          ) : null}
        </div>
      </Link>
      <GuestSavingsStrip />
    </article>
  );
}
