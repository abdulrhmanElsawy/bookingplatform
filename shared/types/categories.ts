export const LIVE_CATEGORY_SLUGS = ['gyms'] as const;

export type LiveCategorySlug = (typeof LIVE_CATEGORY_SLUGS)[number];

export function isCategoryLive(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  return (LIVE_CATEGORY_SLUGS as readonly string[]).includes(normalized);
}
