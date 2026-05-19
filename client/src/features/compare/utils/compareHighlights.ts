import type { CompareVenueModel } from './buildCompareViewModel';

export type CompareHighlightKey =
  | 'cheapest'
  | 'mostBranches'
  | 'highestRating'
  | 'nearest'
  | 'bestOffer';

export type CompareHighlights = Record<string, Set<CompareHighlightKey>>;

export function computeCompareHighlights(
  venues: CompareVenueModel[],
): CompareHighlights {
  const result: CompareHighlights = {};
  for (const v of venues) {
    result[v.slug] = new Set();
  }
  if (venues.length < 2) return result;

  const prices = venues
    .map((v) => ({ slug: v.slug, price: v.monthlyPrice }))
    .filter((v): v is { slug: string; price: number } => v.price != null);
  if (prices.length) {
    const min = Math.min(...prices.map((p) => p.price));
    for (const p of prices.filter((x) => x.price === min)) {
      result[p.slug]?.add('cheapest');
    }
  }

  const maxBranches = Math.max(...venues.map((v) => v.branchCount));
  for (const v of venues.filter((x) => x.branchCount === maxBranches)) {
    result[v.slug]?.add('mostBranches');
  }

  const ratings = venues
    .map((v) => ({ slug: v.slug, rating: v.rating }))
    .filter((v): v is { slug: string; rating: number } => v.rating != null);
  if (ratings.length) {
    const max = Math.max(...ratings.map((r) => r.rating));
    for (const r of ratings.filter((x) => x.rating === max)) {
      result[r.slug]?.add('highestRating');
    }
  }

  const withDistance = venues.filter((v) => v.nearestDistanceKm != null);
  if (withDistance.length >= 2) {
    const minDist = Math.min(
      ...withDistance.map((v) => v.nearestDistanceKm as number),
    );
    for (const v of withDistance.filter((x) => x.nearestDistanceKm === minDist)) {
      result[v.slug]?.add('nearest');
    }
  }

  const withOffer = venues.filter((v) => v.bestOfferText.trim().length > 0);
  if (withOffer.length) {
    const featured = withOffer.filter((v) => v.isFeatured);
    const winners = featured.length > 0 ? featured : withOffer;
    for (const v of winners) {
      result[v.slug]?.add('bestOffer');
    }
  }

  return result;
}

export function pickBestChoiceSlug(venues: CompareVenueModel[]): string | null {
  if (!venues.length) return null;
  if (venues.length === 1) return venues[0]!.slug;

  const highlights = computeCompareHighlights(venues);
  const scores = venues.map((v) => {
    const badges = highlights[v.slug] ?? new Set();
    let score = 0;
    if (badges.has('cheapest')) score += 3;
    if (badges.has('nearest')) score += 3;
    if (badges.has('highestRating')) score += 2;
    if (badges.has('mostBranches')) score += 1;
    if (badges.has('bestOffer')) score += 1;
    if (v.isFeatured) score += 1;
    return { slug: v.slug, score };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores[0]?.slug ?? venues[0]!.slug;
}

export function bestChoiceReasons(
  slug: string,
  highlights: CompareHighlights,
): CompareHighlightKey[] {
  const set = highlights[slug];
  if (!set) return [];
  const order: CompareHighlightKey[] = [
    'cheapest',
    'nearest',
    'highestRating',
    'mostBranches',
    'bestOffer',
  ];
  return order.filter((k) => set.has(k));
}
