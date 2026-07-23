import type { BilingualField } from '@growth-world/shared';
import { getLocalizedValue } from '@growth-world/shared';
import { Check, Clock3, Heart, ImageIcon, MapPin, Scale, Star, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { FavoriteButton } from '../../../features/favorites/components/FavoriteButton/FavoriteButton';
import { useFormatCurrency } from '../../../hooks/useFormatCurrency';
import { useLanguage } from '../../../hooks/useLanguage';
import { resolveUploadUrl } from '../../../utils/resolveUploadUrl';
import { getListingCity, getListingName } from '../../../utils/listing';
import { GuestSavingsStrip } from '../GuestSavingsStrip';
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
  compare?: {
    selected: boolean;
    disabled?: boolean;
    onToggle: () => void;
  };
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
  compare,
}: ListingCardProps) {
  const { t } = useTranslation(['common', 'listings']);
  const { currentLang } = useLanguage();
  const formatPrice = useFormatCurrency();
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
  const compareDisabled = Boolean(compare?.disabled && !compare.selected);
  const compareLabel = compare?.selected
    ? t('listings:listingCardCompareAdded')
    : t('listings:listingCardCompareAdd');
  const compareButton = compare ? (
    <button
      type="button"
      className={`${styles.compareButton} ${compare.selected ? styles.compareButtonActive : ''}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        compare.onToggle();
      }}
      disabled={compareDisabled}
      aria-pressed={compare.selected}
      title={compareDisabled ? t('listings:listingCardCompareLimit') : compareLabel}
    >
      <Scale size={15} strokeWidth={2.2} aria-hidden />
      <span>{compareLabel}</span>
    </button>
  ) : null;
  const gridFeatures = [
    { key: 'hours', label: t('listings:homeFilter24h'), icon: Clock3 },
    {
      key: 'amenity',
      label: amenitiesPreview[0] ? t(`listings:amenities.${amenitiesPreview[0]}`) : t('listings:homeFilterPool'),
      icon: Users,
    },
    { key: 'training', label: t('listings:navPackages'), icon: Users },
  ];

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
          {showStrike ? <span className={styles.discountBadge}>{t('listings:listingCardDiscount')}</span> : null}
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
          <div className={styles.amenities}>
            {gridFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <span key={feature.key} className={styles.amenity}>
                  <Icon size={14} strokeWidth={2} aria-hidden />
                  {feature.label}
                </span>
              );
            })}
          </div>
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
            <div className={styles.listRating}>
              <span>
                {rating.toFixed(1)}
                <Star size={15} fill="currentColor" strokeWidth={2} aria-hidden />
              </span>
              <small>{t('common:review', { count: listing.totalReviews })}</small>
            </div>
          ) : null}
          <FavoriteButton listingSlug={listing.slug} className={styles.listFavoriteButton} />
          {compareButton}
          <div className={styles.priceBlock}>
            {firstPrice != null ? (
              <>
                {showStrike ? (
                  <span className={styles.priceOriginal}>
                    {formatPrice(comparePrice(firstPrice))}
                  </span>
                ) : null}
                <span className={styles.price}>
                  {formatPrice(firstPrice)}
                </span>
                <span className={styles.taxes}>
                  {t('common:from')}
                </span>
              </>
            ) : null}
            <Link className={styles.optionsBtn} to={href}>
              {t('common:viewDetails')}
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
      {compareButton}
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
          <span className={styles.favoriteIcon} aria-hidden>
            <Heart size={21} strokeWidth={2.1} />
          </span>
          <div className={styles.badges}>
            {showStrike ? <span className={styles.discountBadge}>{t('listings:listingCardDiscount')}</span> : null}
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
          <div className={styles.gridTitleRow}>
            <h3 className={styles.title}>{getListingName(listing, currentLang)}</h3>
            {rating > 0 ? (
              <span className={styles.gridRating}>
                {rating.toFixed(1)}
                <Star size={14} fill="currentColor" strokeWidth={2} aria-hidden />
              </span>
            ) : null}
          </div>
          <p className={styles.meta} data-testid="listing-card-location">
            <MapPin className={styles.pin} size={13} strokeWidth={2} aria-hidden />
            <span>{getListingCity(listing, currentLang)}</span>
          </p>
          <div className={styles.gridFeatureRow}>
            {gridFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <span key={feature.key} className={styles.gridFeature}>
                  <Icon size={16} strokeWidth={2} aria-hidden />
                  {feature.label}
                </span>
              );
            })}
          </div>
          {firstPrice != null ? (
            <div className={styles.priceRow}>
              <span className={styles.packageLabel}>{t('listings:listingCardPackageStarts')}</span>
              <span className={styles.price}>
                {t('common:from')} {formatPrice(firstPrice)}
              </span>
            </div>
          ) : null}
          <span className={styles.detailsBtn}>{t('common:viewDetails')}</span>
        </div>
      </Link>
    </article>
  );
}
