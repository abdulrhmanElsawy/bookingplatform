import {
  buildCompareVenueFromSnapshot,
  type CompareVenueModel,
} from '../buildCompareViewModel';
import {
  computeCompareHighlights,
  pickBestChoiceSlug,
} from '../compareHighlights';
import type { CompareItem } from '../../compareStore';

const baseItem = {
  slug: 'a',
  name: { ar: 'أ', en: 'A' },
  location: { city: { ar: 'الرياض', en: 'Riyadh' } },
  amenities: ['pool', 'men_section'],
  packages: [{ price: 200 }],
  totalReviews: 10,
  averageRating: 4.2,
} satisfies CompareItem;

function venue(
  slug: string,
  patch: Partial<CompareVenueModel>,
): CompareVenueModel {
  return {
    ...buildCompareVenueFromSnapshot({ ...baseItem, slug }, 'en'),
    slug,
    ...patch,
  };
}

describe('compareHighlights', () => {
  it('marks cheapest and highest rating', () => {
    const venues = [
      venue('a', { monthlyPrice: 249, rating: 4.6, branchCount: 5 }),
      venue('b', { monthlyPrice: 199, rating: 4.3, branchCount: 12 }),
    ];
    const highlights = computeCompareHighlights(venues);
    expect(highlights.b?.has('cheapest')).toBe(true);
    expect(highlights.a?.has('highestRating')).toBe(true);
    expect(highlights.b?.has('mostBranches')).toBe(true);
  });

  it('picks best choice by combined badges', () => {
    const venues = [
      venue('cheap', {
        monthlyPrice: 150,
        rating: 4.0,
        branchCount: 2,
        nearestDistanceKm: 5,
      }),
      venue('best', {
        monthlyPrice: 150,
        rating: 4.8,
        branchCount: 10,
        nearestDistanceKm: 1,
        isFeatured: true,
        bestOfferText: 'Deal',
      }),
    ];
    expect(pickBestChoiceSlug(venues)).toBe('best');
  });
});
