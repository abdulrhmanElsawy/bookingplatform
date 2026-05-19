import type { ListingDetailDto } from '../../api/listingsApi';
import {
  branchFromListingLocation,
  haversineKm,
  resolveListingBranches,
  sortBranchesByDistance,
} from '../listingBranches';

const baseListing = {
  _id: '1',
  slug: 'test-gym',
  name: { ar: 'نادي', en: 'Gym' },
  description: { ar: 'وصف', en: 'Desc' },
  shortDescription: { ar: 'قصير', en: 'Short' },
  location: {
    address: { ar: '١', en: '1' },
    city: { ar: 'الرياض', en: 'Riyadh' },
    district: { ar: 'الياسمين', en: 'Al Yasmin' },
    googleMapsUrl: 'https://maps.google.com/?q=24.7,46.7',
    coordinates: { type: 'Point' as const, coordinates: [46.7, 24.7] as [number, number] },
  },
  amenities: [],
} satisfies ListingDetailDto;

describe('listingBranches utils', () => {
  it('falls back to main location when no branches exist', () => {
    const branches = resolveListingBranches(baseListing);
    expect(branches).toHaveLength(1);
    expect(branches[0]?.isMain).toBe(true);
  });

  it('uses listing branches when provided', () => {
    const listing: ListingDetailDto = {
      ...baseListing,
      branches: [
        {
          _id: 'b1',
          name: { ar: 'فرع ١', en: 'Branch 1' },
          address: { ar: '١', en: '1' },
          city: { ar: 'الرياض', en: 'Riyadh' },
          district: { ar: 'حي', en: 'Dist' },
          coordinates: { type: 'Point', coordinates: [46.71, 24.71] },
          isMain: true,
        },
      ],
    };
    expect(resolveListingBranches(listing)).toHaveLength(1);
    expect(resolveListingBranches(listing)[0]?.name.en).toBe('Branch 1');
  });

  it('sorts branches by distance when user coordinates exist', () => {
    const a = branchFromListingLocation(baseListing);
    const b = {
      ...a,
      _id: 'far',
      coordinates: { type: 'Point' as const, coordinates: [47.5, 25.5] as [number, number] },
    };
    const sorted = sortBranchesByDistance([b, a], { lat: 24.7, lng: 46.7 });
    expect(sorted[0]?._id).toBe('main');
    expect(sorted[0]?.distanceKm).not.toBeNull();
  });

  it('computes haversine distance', () => {
    const km = haversineKm(24.7, 46.7, 24.71, 46.71);
    expect(km).toBeGreaterThan(0);
    expect(km).toBeLessThan(5);
  });
});
