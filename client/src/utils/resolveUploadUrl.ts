import { getApiUrl } from '../config/publicEnv';

/**
 * Serves listing images from the Vite origin in dev when the API returns
 * absolute `http://localhost:4000/uploads/...` URLs.
 */
export function resolveUploadUrl(url: string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;

  const api = getApiUrl().replace(/\/$/, '');
  if (api) {
    const prefix = `${api}/uploads/`;
    if (trimmed.startsWith(prefix)) {
      return `/uploads/${trimmed.slice(prefix.length)}`;
    }
    try {
      const parsed = new URL(trimmed);
      const apiOrigin = new URL(api).origin;
      if (parsed.origin === apiOrigin && parsed.pathname.startsWith('/uploads/')) {
        return parsed.pathname;
      }
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}
