import { getLocalizedValue } from '@growth-world/shared';

import type { ListingBranchDto, ListingDetailDto } from '../api/listingsApi';

export type ResolvedBranch = ListingBranchDto & {
  _id: string;
  distanceKm: number | null;
};

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function branchFromListingLocation(listing: ListingDetailDto): ListingBranchDto {
  return {
    _id: 'main',
    name: listing.name,
    address: listing.location.address,
    city: listing.location.city,
    district: listing.location.district,
    googleMapsUrl: listing.location.googleMapsUrl,
    coordinates: listing.location.coordinates,
    isMain: true,
    isActive: true,
    is24Hours: listing.is24Hours,
    operatingHours: listing.operatingHours,
    sortOrder: 0,
  };
}

export function resolveListingBranches(listing: ListingDetailDto): ListingBranchDto[] {
  const fromDb = (listing.branches ?? []).filter((b) => b.isActive !== false);
  if (fromDb.length > 0) return fromDb;
  return [branchFromListingLocation(listing)];
}

export function sortBranchesByDistance(
  branches: ListingBranchDto[],
  userCoords: { lat: number; lng: number } | null,
): ResolvedBranch[] {
  const resolved: ResolvedBranch[] = branches.map((branch, index) => {
    const coords = branch.coordinates?.coordinates;
    const distanceKm =
      userCoords && coords && coords.length === 2
        ? haversineKm(userCoords.lat, userCoords.lng, coords[1], coords[0])
        : null;
    return {
      ...branch,
      _id: branch._id ?? `branch-${index}`,
      distanceKm,
    };
  });

  if (!userCoords) {
    return [...resolved].sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
  }

  return [...resolved].sort((a, b) => {
    if (a.distanceKm == null && b.distanceKm == null) return 0;
    if (a.distanceKm == null) return 1;
    if (b.distanceKm == null) return -1;
    return a.distanceKm - b.distanceKm;
  });
}

export function branchLabel(
  branch: ListingBranchDto,
  lang: 'ar' | 'en',
): string {
  return getLocalizedValue(branch.name, lang);
}

export function branchAddressLine(
  branch: ListingBranchDto,
  lang: 'ar' | 'en',
): string {
  const district = getLocalizedValue(branch.district, lang);
  const city = getLocalizedValue(branch.city, lang);
  return `${district}، ${city}`;
}
