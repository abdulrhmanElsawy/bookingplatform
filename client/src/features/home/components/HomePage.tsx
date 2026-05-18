import { getLocalizedValue } from '@growth-world/shared';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createSearchParams, Link } from 'react-router-dom';

import { DealsSlider } from '../../../components/shared/DealsSlider';
import { HorizontalCarousel } from '../../../components/shared/HorizontalCarousel';
import { ListingCard } from '../../../components/shared/ListingCard';
import { SearchBar } from '../../../components/shared/SearchBar';
import i18n from '../../../i18n';
import { useSEO } from '../../../hooks/useSEO';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAuthStore } from '../../../store/authStore';
import {
  fetchCategories,
  fetchFeaturedListings,
  fetchListings,
} from '../../listings/api/listingsApi';
import { mapListingToCard } from '../../listings/utils/mapListingToCard';
import { CategoryBrowseTile } from './CategoryBrowseTile';
import {
  categoryTileBackground,
  HOME_HERO_IMAGE,
  HOME_HERO_IMAGE_FALLBACK,
  HOME_OFFERS_IMAGE,
} from '../data/categoryCoverImages';
import { HOME_CITIES } from '../data/homeCities';
import styles from './HomePage.module.css';

const FEATURED_LIMIT = 8;
const DEALS_LIMIT = 10;

export function HomePage() {
  const { t } = useTranslation('listings');
  const { currentLang } = useLanguage();
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showGuestBanner = sessionStatus === 'ready' && !isAuthenticated;

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['listings', 'featured', FEATURED_LIMIT],
    queryFn: () => fetchFeaturedListings(FEATURED_LIMIT),
  });

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['listings', 'deals', DEALS_LIMIT],
    queryFn: () => fetchListings({ limit: DEALS_LIMIT, sort: 'rating', isPremium: true }),
  });

  useSEO({
    titleAr: i18n.getFixedT('ar')('common:appName'),
    titleEn: i18n.getFixedT('en')('common:appName'),
    descAr: i18n.getFixedT('ar')('common:tagline'),
    descEn: i18n.getFixedT('en')('common:tagline'),
    path: '/',
  });

  const featuredListings = featuredData?.listings ?? [];
  const dealListings = dealsData?.listings ?? [];
  const [heroImageSrc, setHeroImageSrc] = useState(HOME_HERO_IMAGE);

  function onHeroImageError() {
    setHeroImageSrc((current) =>
      current === HOME_HERO_IMAGE_FALLBACK ? current : HOME_HERO_IMAGE_FALLBACK,
    );
  }

  function citySearchLabel(city: (typeof HOME_CITIES)[number]): string {
    return currentLang === 'ar' ? city.ar : city.en;
  }

  const largeCities = HOME_CITIES.slice(0, 2);
  const smallCities = HOME_CITIES.slice(2, 5);

  return (
    <div className={styles.root} data-testid="home-page">
      <section className={styles.hero} aria-labelledby="home-hero-heading">
        <img
          className={styles.heroBg}
          src={heroImageSrc}
          alt=""
          decoding="async"
          fetchPriority="high"
          aria-hidden
          onError={onHeroImageError}
        />
        <div className={styles.heroOverlay} aria-hidden />
        <div className={`${styles.heroInner} gwContainer`}>
          <h1 id="home-hero-heading" className={styles.heroTitle}>
            {t('heroTitle')}
          </h1>
          <p className={styles.heroSubtitle}>{t('heroSubtitle')}</p>
          <SearchBar variant="hero" categories={categories} />
        </div>
      </section>

      <div className={`${styles.content} gwContainer`}>
        <section className={styles.offers} aria-labelledby="home-offers-heading">
          <div className={styles.offersCard}>
            <div className={styles.offersText}>
              <h2 id="home-offers-heading" className={styles.sectionTitle}>
                {t('offersTitle')}
              </h2>
              <p className={styles.offersDesc}>{t('offersDesc')}</p>
              <Link className="btnPrimary" to="/listings">
                {t('offersCta')}
              </Link>
            </div>
            <img
              className={styles.offersVisual}
              src={HOME_OFFERS_IMAGE}
              alt=""
              loading="lazy"
              aria-hidden
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="home-cat-types-heading">
          <h2 id="home-cat-types-heading" className={styles.sectionTitle}>
            {t('categoriesTitle')}
          </h2>
          <ul className={styles.categoryGrid}>
            {categories.slice(0, 4).map((c) => (
              <li key={c._id}>
                <CategoryBrowseTile
                  slug={c.slug}
                  imageFromApi={c.image}
                  labelClassName={styles.categoryTileLabel}
                  to={{
                    pathname: '/listings',
                    search: createSearchParams({ category: c.slug }).toString(),
                  }}
                >
                  {getLocalizedValue(c.name, currentLang)}
                </CategoryBrowseTile>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="home-cities-heading">
          <h2 id="home-cities-heading" className={styles.sectionTitle}>
            {t('trendingCities')}
          </h2>
          <ul className={styles.cityGrid} data-testid="home-cities">
            {largeCities.map((city) => (
              <li key={city.slug} className={styles.cityLarge}>
                <Link
                  className={styles.cityCard}
                  style={categoryTileBackground(city.imageUrl)}
                  to={{
                    pathname: '/listings',
                    search: createSearchParams({ search: citySearchLabel(city) }).toString(),
                  }}
                >
                  <span className={styles.cityCardLabel}>{citySearchLabel(city)}</span>
                </Link>
              </li>
            ))}
            {smallCities.map((city) => (
              <li key={city.slug} className={styles.citySmall}>
                <Link
                  className={styles.cityCard}
                  style={categoryTileBackground(city.imageUrl)}
                  to={{
                    pathname: '/listings',
                    search: createSearchParams({ search: citySearchLabel(city) }).toString(),
                  }}
                >
                  <span className={styles.cityCardLabel}>{citySearchLabel(city)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section
          className={styles.section}
          aria-labelledby="home-deals-heading"
          data-testid="home-deals-section"
        >
          <DealsSlider
            ariaLabel={t('dealsTitle')}
            title={t('dealsTitle')}
            titleId="home-deals-heading"
          >
            {dealsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <ListingCard key={`deal-sk-${i}`} skeleton variant="grid" />
                ))
              : dealListings.map((item) => (
                  <ListingCard
                    key={item._id}
                    listing={mapListingToCard(item)}
                    variant="grid"
                    showDealPrice
                  />
                ))}
          </DealsSlider>
        </section>

        <section className={styles.section} aria-labelledby="home-browse-heading">
          <h2 id="home-browse-heading" className={styles.sectionTitle}>
            {t('browseByType')}
          </h2>
          <ul className={styles.browseGrid}>
            {categories.slice(0, 4).map((c) => (
              <li key={`browse-${c._id}`}>
                <CategoryBrowseTile
                  slug={c.slug}
                  imageFromApi={c.image}
                  labelClassName={styles.categoryTileLabel}
                  to={{
                    pathname: '/listings',
                    search: createSearchParams({ category: c.slug }).toString(),
                  }}
                >
                  {getLocalizedValue(c.name, currentLang)}
                </CategoryBrowseTile>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="home-featured-heading">
          <h2 id="home-featured-heading" className={styles.sectionTitle}>
            {t('featuredUnique')}
          </h2>
          <HorizontalCarousel ariaLabel={t('featuredUnique')}>
            {featuredLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <ListingCard key={`feat-sk-${i}`} skeleton variant="grid" />
                ))
              : featuredListings.map((item) => (
                  <ListingCard key={item._id} listing={mapListingToCard(item)} variant="grid" />
                ))}
          </HorizontalCarousel>
        </section>

        {showGuestBanner ? (
          <section className={styles.guestBanner} aria-labelledby="home-guest-heading">
            <div className={styles.guestBannerInner}>
              <div>
                <h2 id="home-guest-heading" className={styles.guestTitle}>
                  {t('guestSignInBannerTitle')}
                </h2>
                <p className={styles.guestDesc}>{t('guestSignInBannerDesc')}</p>
              </div>
              <Link className={styles.guestCta} to="/login">
                {t('guestSignInBannerCta')}
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
