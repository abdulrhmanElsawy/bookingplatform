/** Stable Unsplash CDN URLs for dev seed (no API key). Verified against client verifyMediaUrls.mjs. */
export const SEED_IMAGES = {
  gym: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800&q=80',
  gymAlt: 'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=800&q=80',
  gymAlt2: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
  padel: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&q=80',
  padelAlt: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=800&q=80',
  boxing: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80',
  swimming: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80',
  activities: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
  restaurant: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  training: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  rehab: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
  offers: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80',
  cityRiyadh: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800&q=80',
  cityJeddah: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80',
  cityDammam: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=800&q=80',
  cityMakkah: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  cityMadinah: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80',
  cityKhobar: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
} as const;

export const CATEGORY_COVER_BY_SLUG: Record<string, string> = {
  gyms: SEED_IMAGES.gym,
  padel: SEED_IMAGES.padel,
  boxing: SEED_IMAGES.boxing,
  swimming: SEED_IMAGES.swimming,
  activities: SEED_IMAGES.activities,
  restaurants: SEED_IMAGES.restaurant,
  'personal-training': SEED_IMAGES.training,
  rehabilitation: SEED_IMAGES.rehab,
};

export type BilingualLabel = { ar: string; en: string };

export function buildListingImages(
  urls: string[],
  alt: BilingualLabel,
): Array<{ url: string; alt: BilingualLabel; isMain: boolean; order: number }> {
  return urls.map((url, index) => ({
    url,
    alt,
    isMain: index === 0,
    order: index,
  }));
}

/** Multi-image defaults per category when a listing has no valid photos. */
export const CATEGORY_DEFAULT_IMAGE_SETS: Record<string, readonly string[]> = {
  gyms: [SEED_IMAGES.gym, SEED_IMAGES.gymAlt, SEED_IMAGES.gymAlt2],
  padel: [SEED_IMAGES.padel, SEED_IMAGES.padelAlt],
  boxing: [SEED_IMAGES.boxing],
  swimming: [SEED_IMAGES.swimming],
  activities: [SEED_IMAGES.activities],
  restaurants: [SEED_IMAGES.restaurant],
  'personal-training': [SEED_IMAGES.training],
  rehabilitation: [SEED_IMAGES.rehab],
};

const FALLBACK_IMAGE_SET: readonly string[] = [SEED_IMAGES.gym, SEED_IMAGES.gymAlt];

export function resolveListingImageUrls(
  categorySlug: string | undefined,
  slugToSeedUrls: Readonly<Record<string, readonly string[]>>,
  listingSlug?: string,
): string[] {
  if (listingSlug && slugToSeedUrls[listingSlug]?.length) {
    return [...slugToSeedUrls[listingSlug]!];
  }
  if (categorySlug && CATEGORY_DEFAULT_IMAGE_SETS[categorySlug]?.length) {
    return [...CATEGORY_DEFAULT_IMAGE_SETS[categorySlug]!];
  }
  return [...FALLBACK_IMAGE_SET];
}
