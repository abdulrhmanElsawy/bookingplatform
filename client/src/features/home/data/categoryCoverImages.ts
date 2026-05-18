import type { CSSProperties } from 'react';

/**
 * Unsplash fallbacks — URLs verified via `npm run verify:media -w client`.
 * IDs can 404 over time; re-run the script after changing any link.
 */
export const CATEGORY_COVER_BY_SLUG: Record<string, string> = {
  gyms: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800&q=80',
  padel: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&q=80',
  boxing: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80',
  swimming: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80',
  activities: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
  restaurants: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'personal-training': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  rehabilitation: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
};

export const HOME_OFFERS_IMAGE =
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80';

/** Home hero — gym floor (verified). */
export const HOME_HERO_IMAGE =
  'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=1600&q=80';

/** Secondary hero if primary fails to load in the browser. */
export const HOME_HERO_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=1600&q=80';

export const DEFAULT_CATEGORY_COVER = CATEGORY_COVER_BY_SLUG.gyms;

/** Prefer verified slug covers over API `image` (DB may still hold removed Unsplash IDs). */
export function getCategoryCoverUrl(slug: string, image?: string | null): string {
  return CATEGORY_COVER_BY_SLUG[slug] ?? image ?? DEFAULT_CATEGORY_COVER;
}

export function categoryTileBackground(coverUrl: string): CSSProperties {
  return {
    backgroundImage: `linear-gradient(to top, rgb(0 0 0 / 0.55), rgb(0 0 0 / 0.15)), url(${coverUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}
