import { getLocalizedValue } from '@growth-world/shared';

import type { ListingDetailDto } from '../../listings/api/listingsApi';
import {
  branchLabel,
  resolveListingBranches,
  sortBranchesByDistance,
  type ResolvedBranch,
} from '../../listings/utils/listingBranches';
import type { CompareItem } from '../compareStore';

export type ClubGenderType = 'men' | 'women' | 'mixed' | 'unknown';

export type CompareVenueModel = {
  slug: string;
  name: string;
  city: string;
  heroImageUrl?: string;
  logoImageUrl?: string;
  rating: number | null;
  reviewCount: number;
  monthlyPrice: number | null;
  branchCount: number;
  is24Hours: boolean;
  hasPool: boolean;
  hasSaunaSteam: boolean;
  hasPersonalTraining: boolean;
  genderType: ClubGenderType;
  nearestBranch: ResolvedBranch | null;
  nearestDistanceKm: number | null;
  nearestBranchLabel: string;
  mapUrl: string | null;
  bestOfferText: string;
  detailUrl: string;
  isFeatured: boolean;
};

function pickMainImageUrl(
  images: { url: string; isMain?: boolean }[] | undefined,
): string | undefined {
  const image = images?.find((i) => i.isMain) ?? images?.[0];
  return image?.url;
}

function cheapestMonthlyPrice(
  packages: ListingDetailDto['packages'] | CompareItem['packages'],
): number | null {
  const active = (packages ?? []).filter(
    (p) => ('isActive' in p ? p.isActive !== false : true),
  );
  if (!active.length) return null;
  const monthly = active.filter((p) => !('duration' in p) || p.duration === 'month');
  const pool = monthly.length > 0 ? monthly : active;
  return Math.min(...pool.map((p) => p.price));
}

function inferGenderType(amenities: string[]): ClubGenderType {
  const hasMen = amenities.includes('men_section');
  const hasWomen = amenities.includes('women_section');
  const hasFamily = amenities.includes('family_section');
  if (hasMen && (hasWomen || hasFamily)) return 'mixed';
  if (hasWomen && !hasMen) return 'women';
  if (hasMen) return 'men';
  return 'unknown';
}

function bestOfferFromListing(
  listing: ListingDetailDto,
  lang: 'ar' | 'en',
): string {
  const popular = (listing.packages ?? []).find((p) => p.isPopular && p.isActive !== false);
  const pkg = popular ?? (listing.packages ?? []).find((p) => p.isActive !== false);
  if (!pkg) return '';
  const name = getLocalizedValue(pkg.name, lang);
  const desc = getLocalizedValue(pkg.description, lang);
  return desc || name;
}

function bestOfferFromSnapshot(item: CompareItem, lang: 'ar' | 'en'): string {
  if (!item.packages[0]) return '';
  return lang === 'ar' ? 'عرض اشتراك متاح' : 'Subscription offer available';
}

export function buildCompareVenueFromDetail(
  listing: ListingDetailDto,
  lang: 'ar' | 'en',
  userCoords: { lat: number; lng: number } | null,
): CompareVenueModel {
  const branches = resolveListingBranches(listing);
  const sorted = sortBranchesByDistance(branches, userCoords);
  const nearest = sorted[0] ?? null;
  const amenities = listing.amenities ?? [];
  const sortedImages = [...(listing.images ?? [])].sort(
    (a, b) => Number(b.isMain) - Number(a.isMain),
  );

  return {
    slug: listing.slug,
    name: getLocalizedValue(listing.name, lang),
    city: getLocalizedValue(listing.location.city, lang),
    heroImageUrl: pickMainImageUrl(sortedImages),
    logoImageUrl: pickMainImageUrl(sortedImages),
    rating: listing.averageRating ?? null,
    reviewCount: listing.totalReviews ?? 0,
    monthlyPrice: cheapestMonthlyPrice(listing.packages),
    branchCount: branches.length,
    is24Hours: Boolean(
      listing.is24Hours || branches.some((b) => b.is24Hours),
    ),
    hasPool: amenities.includes('pool'),
    hasSaunaSteam: amenities.includes('sauna'),
    hasPersonalTraining: amenities.includes('personal_trainer'),
    genderType: inferGenderType(amenities),
    nearestBranch: nearest,
    nearestDistanceKm: nearest?.distanceKm ?? null,
    nearestBranchLabel: nearest ? branchLabel(nearest, lang) : '',
    mapUrl:
      nearest?.googleMapsUrl ?? listing.location.googleMapsUrl ?? null,
    bestOfferText: bestOfferFromListing(listing, lang),
    detailUrl: `/listings/${listing.slug}`,
    isFeatured: Boolean(listing.isFeatured),
  };
}

export function buildCompareVenueFromSnapshot(
  item: CompareItem,
  lang: 'ar' | 'en',
): CompareVenueModel {
  const amenities = item.amenities ?? [];

  return {
    slug: item.slug,
    name: getLocalizedValue(item.name, lang),
    city: getLocalizedValue(item.location.city, lang),
    heroImageUrl: pickMainImageUrl(item.images),
    logoImageUrl: pickMainImageUrl(item.images),
    rating: item.averageRating ?? null,
    reviewCount: item.totalReviews ?? 0,
    monthlyPrice: cheapestMonthlyPrice(item.packages),
    branchCount: 1,
    is24Hours: false,
    hasPool: amenities.includes('pool'),
    hasSaunaSteam: amenities.includes('sauna'),
    hasPersonalTraining: amenities.includes('personal_trainer'),
    genderType: inferGenderType(amenities),
    nearestBranch: null,
    nearestDistanceKm: null,
    nearestBranchLabel: '',
    mapUrl: item.googleMapsUrl ?? null,
    bestOfferText: bestOfferFromSnapshot(item, lang),
    detailUrl: `/listings/${item.slug}`,
    isFeatured: Boolean(item.isFeatured),
  };
}

export function mergeCompareVenue(
  detail: CompareVenueModel | null,
  snapshot: CompareVenueModel,
): CompareVenueModel {
  if (!detail) return snapshot;
  return {
    ...detail,
    heroImageUrl: detail.heroImageUrl ?? snapshot.heroImageUrl,
    logoImageUrl: detail.logoImageUrl ?? snapshot.logoImageUrl,
    monthlyPrice: detail.monthlyPrice ?? snapshot.monthlyPrice,
    rating: detail.rating ?? snapshot.rating,
    reviewCount: detail.reviewCount || snapshot.reviewCount,
    bestOfferText: detail.bestOfferText || snapshot.bestOfferText,
    mapUrl: detail.mapUrl ?? snapshot.mapUrl,
  };
}
