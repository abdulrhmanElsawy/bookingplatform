/** URL-safe slug from Latin text (e.g. English name). */
export function slugifyLatin(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? base : 'listing';
}
