import { useQueries } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  Check,
  ChevronLeft,
  Clock3,
  Gift,
  MapPin,
  Plus,
  Share2,
  Star,
  Tag,
  Trophy,
  UserRound,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { useLanguage } from '../../../../hooks/useLanguage';
import { useSEO } from '../../../../hooks/useSEO';
import { formatCurrency } from '../../../../utils/formatters';
import { resolveUploadUrl } from '../../../../utils/resolveUploadUrl';
import { fetchListingBySlug } from '../../../listings/api/listingsApi';
import {
  COMPARE_MAX_ITEMS,
  COMPARE_MIN_ITEMS,
  useCompareStore,
  type CompareItem,
} from '../../compareStore';
import {
  buildCompareVenueFromDetail,
  buildCompareVenueFromSnapshot,
  mergeCompareVenue,
  type ClubGenderType,
  type CompareVenueModel,
} from '../../utils/buildCompareViewModel';
import {
  bestChoiceReasons,
  computeCompareHighlights,
  pickBestChoiceSlug,
  type CompareHighlightKey,
} from '../../utils/compareHighlights';
import styles from './ComparePage.module.css';

function mainImage(item: CompareItem): string | undefined {
  const image = item.images?.find((entry) => entry.isMain) ?? item.images?.[0];
  return image?.url ? resolveUploadUrl(image.url) : undefined;
}

function highlightLabel(
  key: CompareHighlightKey,
  t: (k: string) => string,
): string {
  const map: Record<CompareHighlightKey, string> = {
    cheapest: t('listings:compareBadgeCheapest'),
    mostBranches: t('listings:compareBadgeMostBranches'),
    highestRating: t('listings:compareBadgeHighest'),
    nearest: t('listings:compareBadgeNearest'),
    bestOffer: t('listings:compareBadgeBestOffer'),
  };
  return map[key];
}

function genderLabel(type: ClubGenderType, t: (k: string) => string): string {
  switch (type) {
    case 'mixed':
      return t('listings:compareGenderMixed');
    case 'women':
      return t('listings:compareGenderWomen');
    case 'men':
      return t('listings:compareGenderMen');
    default:
      return t('listings:compareNotAvailable');
  }
}

export function ComparePage() {
  const { t } = useTranslation(['listings', 'common']);
  const { currentLang } = useLanguage();
  const navigate = useNavigate();
  const items = useCompareStore((s) => s.items);
  const removeItem = useCompareStore((s) => s.removeItem);
  const clear = useCompareStore((s) => s.clear);
  const ready = items.length >= COMPARE_MIN_ITEMS;
  const dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  const lang = currentLang === 'ar' ? 'ar' : 'en';
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserCoords(null),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []);

  const detailQueries = useQueries({
    queries: items.map((item) => ({
      queryKey: ['listing', item.slug, 'compare'],
      queryFn: () => fetchListingBySlug(item.slug),
      enabled: ready,
      staleTime: 60_000,
    })),
  });

  const venues = useMemo(() => {
    return items.map((item, index) => {
      const snapshot = buildCompareVenueFromSnapshot(item, lang);
      const detailData = detailQueries[index]?.data;
      if (detailData) {
        const fromDetail = buildCompareVenueFromDetail(detailData, lang, userCoords);
        return mergeCompareVenue(fromDetail, snapshot);
      }
      return snapshot;
    });
  }, [items, detailQueries, lang, userCoords]);

  const highlights = useMemo(() => computeCompareHighlights(venues), [venues]);
  const bestSlug = useMemo(() => pickBestChoiceSlug(venues), [venues]);
  const bestVenue = venues.find((v) => v.slug === bestSlug) ?? venues[0];
  const isLoadingDetails = detailQueries.some((q) => q.isLoading);

  useSEO({
    titleAr: t('listings:comparePageTitle'),
    titleEn: t('listings:comparePageTitle'),
    descAr: t('listings:comparePageDesc'),
    descEn: t('listings:comparePageDesc'),
    path: '/compare',
  });

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = t('listings:comparePageTitle');
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* cancelled */
    }
  };

  const updatedLabel = t('listings:compareDataUpdated', {
    date: new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date()),
  });

  return (
    <div className={styles.page} dir={dir} data-testid="compare-page">
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => navigate(-1)}
          aria-label={t('common:back')}
        >
          <ChevronLeft size={22} aria-hidden />
        </button>
        <div className={styles.topTitles}>
          <h1>{t('listings:comparePageTitle')}</h1>
          <p>{t('listings:comparePageSubtitle')}</p>
        </div>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => void handleShare()}
          aria-label={t('listings:compareShare')}
        >
          <Share2 size={20} aria-hidden />
        </button>
      </header>

      {!ready ? (
        <section className={styles.emptyState}>
          <p className={styles.emptyTitle}>{t('listings:compareNeedMoreTitle')}</p>
          <p>{t('listings:compareNeedMoreDesc')}</p>
          <Link className={styles.primaryBtn} to="/">
            {t('listings:compareBackHome')}
          </Link>
        </section>
      ) : (
        <>
          <section className={styles.selectionRow} aria-label={t('listings:comparePageTitle')}>
            {venues.map((venue) => {
              const item = items.find((i) => i.slug === venue.slug)!;
              const thumb = mainImage(item);
              return (
                <article key={venue.slug} className={styles.selectionCard}>
                  <button
                    type="button"
                    className={styles.selectionRemove}
                    onClick={() => removeItem(venue.slug)}
                    aria-label={t('listings:homeCompareRemove', { name: venue.name })}
                  >
                    <X size={14} aria-hidden />
                  </button>
                  {thumb ? (
                    <img src={thumb} alt="" className={styles.selectionLogo} />
                  ) : (
                    <span className={styles.selectionLogoFallback} aria-hidden />
                  )}
                  <strong>{venue.name}</strong>
                  <span>{venue.city}</span>
                </article>
              );
            })}
            {venues.length < COMPARE_MAX_ITEMS ? (
              <Link className={styles.addSlot} to="/listings">
                <Plus size={22} aria-hidden />
                <span>{t('listings:compareAddClub')}</span>
              </Link>
            ) : null}
          </section>

          {isLoadingDetails ? (
            <p className={styles.loadingHint}>{t('common:loading')}</p>
          ) : null}

          <div className={styles.tableScroll}>
            <div
              className={styles.compareGrid}
              style={{
                gridTemplateColumns: `minmax(7.5rem, 9rem) repeat(${venues.length}, minmax(9.5rem, 1fr))`,
              }}
            >
              <CompareHeaderRow venues={venues} t={t} />
              <CompareMetricRow
                label={t('listings:compareRowMonthlyPrice')}
                icon={Tag}
                venues={venues}
                renderCell={(v) =>
                  v.monthlyPrice != null
                    ? formatCurrency(v.monthlyPrice, currentLang)
                    : t('listings:compareNotAvailable')
                }
                badgeFor={(slug) =>
                  highlights[slug]?.has('cheapest') ? 'compareBadgeCheapest' : null
                }
                t={t}
              />
              <CompareMetricRow
                label={t('listings:compareRowBranches')}
                icon={Building2}
                venues={venues}
                renderCell={(v) =>
                  t('listings:compareBranchCount', { count: v.branchCount })
                }
                badgeFor={(slug) =>
                  highlights[slug]?.has('mostBranches') ? 'compareBadgeMostBranches' : null
                }
                t={t}
              />
              <CompareMetricRow
                label={t('listings:compareRow24h')}
                icon={Clock3}
                venues={venues}
                renderCell={(v) => <BoolCell value={v.is24Hours} t={t} />}
                t={t}
              />
              <CompareMetricRow
                label={t('listings:compareRowPool')}
                icon={Waves}
                venues={venues}
                renderCell={(v) => <BoolCell value={v.hasPool} t={t} />}
                t={t}
              />
              <CompareMetricRow
                label={t('listings:compareRowSauna')}
                icon={Wind}
                venues={venues}
                renderCell={(v) => <BoolCell value={v.hasSaunaSteam} t={t} />}
                t={t}
              />
              <CompareMetricRow
                label={t('listings:compareRowTrainer')}
                icon={UserRound}
                venues={venues}
                renderCell={(v) => <BoolCell value={v.hasPersonalTraining} t={t} />}
                t={t}
              />
              <CompareMetricRow
                label={t('listings:compareRowGender')}
                icon={UserRound}
                venues={venues}
                renderCell={(v) => genderLabel(v.genderType, t)}
                t={t}
              />
              <CompareMetricRow
                label={t('listings:compareRowRating')}
                icon={Star}
                venues={venues}
                renderCell={(v) =>
                  v.rating != null ? (
                    <span className={styles.ratingCell}>
                      <Star size={14} className={styles.starIcon} aria-hidden />
                      {v.rating.toFixed(1)}
                    </span>
                  ) : (
                    t('listings:compareNotAvailable')
                  )
                }
                badgeFor={(slug) =>
                  highlights[slug]?.has('highestRating') ? 'compareBadgeHighest' : null
                }
                t={t}
              />
              <CompareMetricRow
                label={t('listings:compareRowNearest')}
                icon={MapPin}
                venues={venues}
                renderCell={(v) =>
                  v.nearestDistanceKm != null ? (
                    <span className={styles.nearestCell}>
                      {t('listings:compareDistanceBranch', {
                        distance: v.nearestDistanceKm.toFixed(1),
                        branch: v.nearestBranchLabel,
                      })}
                    </span>
                  ) : (
                    t('listings:compareNotAvailable')
                  )
                }
                badgeFor={(slug) =>
                  highlights[slug]?.has('nearest') ? 'compareBadgeNearest' : null
                }
                t={t}
              />
              <CompareMetricRow
                label={t('listings:compareRowOffer')}
                icon={Gift}
                venues={venues}
                renderCell={(v) =>
                  v.bestOfferText || t('listings:compareNotAvailable')
                }
                badgeFor={(slug) =>
                  highlights[slug]?.has('bestOffer') ? 'compareBadgeBestOffer' : null
                }
                t={t}
              />
            </div>
          </div>

          {bestVenue ? (
            <section className={styles.bestChoice} aria-label={t('listings:compareBestChoice')}>
              <div className={styles.bestChoiceHead}>
                <Trophy size={22} className={styles.trophy} aria-hidden />
                <div>
                  <h2>{t('listings:compareBestChoice')}</h2>
                  <p className={styles.bestChoiceName}>{bestVenue.name}</p>
                </div>
              </div>
              <p className={styles.bestChoiceDesc}>
                {t('listings:compareBestChoiceDesc', { name: bestVenue.name })}
              </p>
              <ul className={styles.bestChoiceList}>
                {bestChoiceReasons(bestVenue.slug, highlights).map((key) => (
                  <li key={key}>
                    <Check size={16} aria-hidden />
                    {highlightLabel(key, t)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <footer className={styles.bottomBar}>
            {venues.map((venue) => {
              const isBest = venue.slug === bestSlug;
              return (
                <Link
                  key={venue.slug}
                  to={venue.detailUrl}
                  className={`${styles.bottomBtn} ${isBest ? styles.bottomBtnPrimary : styles.bottomBtnOutline}`}
                >
                  {t('listings:compareViewClubPage', { name: venue.name })}
                  <ArrowRight size={18} aria-hidden />
                </Link>
              );
            })}
          </footer>

          <p className={styles.dataUpdated}>{updatedLabel}</p>

          <button type="button" className={styles.clearLink} onClick={clear}>
            {t('listings:compareClear')}
          </button>
        </>
      )}
    </div>
  );
}

function CompareHeaderRow({
  venues,
  t,
}: {
  venues: CompareVenueModel[];
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <>
      <div className={`${styles.labelCell} ${styles.headerLabel}`}>
        {t('listings:compareRowClub')}
      </div>
      {venues.map((venue) => {
        const img = venue.heroImageUrl ? resolveUploadUrl(venue.heroImageUrl) : undefined;
        return (
          <div key={`header-${venue.slug}`} className={styles.clubHeaderCell}>
            {img ? (
              <img src={img} alt="" className={styles.clubHero} loading="lazy" />
            ) : (
              <div className={styles.clubHeroFallback} aria-hidden />
            )}
            <div className={styles.clubHeaderBody}>
              {venue.logoImageUrl ? (
                <img
                  src={resolveUploadUrl(venue.logoImageUrl)}
                  alt=""
                  className={styles.clubMiniLogo}
                />
              ) : null}
              <strong>{venue.name}</strong>
              <span className={styles.clubRating}>
                <Star size={12} aria-hidden />
                {venue.rating?.toFixed(1) ?? '—'}
                <span className={styles.reviewCount}>
                  ({t('common:review', { count: venue.reviewCount })})
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}

function CompareMetricRow({
  label,
  icon: Icon,
  venues,
  renderCell,
  badgeFor,
  t,
}: {
  label: string;
  icon: typeof Tag;
  venues: CompareVenueModel[];
  renderCell: (v: CompareVenueModel) => ReactNode;
  badgeFor?: (slug: string) => string | null;
  t: (key: string) => string;
}) {
  return (
    <>
      <div className={styles.labelCell}>
        <Icon size={16} aria-hidden />
        <span>{label}</span>
      </div>
      {venues.map((venue) => {
        const badgeKey = badgeFor?.(venue.slug);
        return (
          <div key={`${label}-${venue.slug}`} className={styles.valueCell}>
            {badgeKey ? (
              <span className={styles.badge}>{t(`listings:${badgeKey}`)}</span>
            ) : null}
            <div className={styles.cellContent}>{renderCell(venue)}</div>
          </div>
        );
      })}
    </>
  );
}

function BoolCell({
  value,
  t,
}: {
  value: boolean;
  t: (key: string) => string;
}) {
  if (value) {
    return (
      <span className={styles.yesCell}>
        <Check size={16} aria-hidden />
        {t('listings:compareYes')}
      </span>
    );
  }
  return (
    <span className={styles.noCell}>
      <X size={16} aria-hidden />
      {t('listings:compareNo')}
    </span>
  );
}
