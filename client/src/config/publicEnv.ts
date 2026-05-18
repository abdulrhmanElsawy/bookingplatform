export type PublicAppLang = 'ar' | 'en';

let apiUrl = '';
let siteUrl = '';
let socketUrl = '';
let googleMapsKey = '';
let cloudinaryUploadPreset = '';
let defaultLanguage: PublicAppLang = 'ar';
let supportedLanguages: PublicAppLang[] = ['ar', 'en'];

/** Strips trailing `/api` so `VITE_API_URL` may be origin-only or .../api per deploy docs. */
export function normalizeApiBase(url: string): string {
  const t = url.trim().replace(/\/$/, '');
  if (t.toLowerCase().endsWith('/api')) {
    return t.slice(0, -4).replace(/\/$/, '');
  }
  return t;
}

function parseDefaultLanguage(raw: string | undefined): PublicAppLang {
  return raw?.trim().toLowerCase() === 'en' ? 'en' : 'ar';
}

function parseSupportedLanguages(raw: string | undefined): PublicAppLang[] {
  const source = raw?.trim() || 'ar,en';
  const out: PublicAppLang[] = [];
  for (const part of source.split(',')) {
    const p = part.trim().toLowerCase();
    if (p === 'ar' || p === 'en') out.push(p);
  }
  const unique = [...new Set(out)];
  return unique.length > 0 ? unique : ['ar', 'en'];
}

export function configurePublicEnv(config: {
  apiUrl: string;
  siteUrl?: string;
  socketUrl?: string;
  googleMapsKey?: string;
  cloudinaryUploadPreset?: string;
  defaultLanguage?: string;
  supportedLanguages?: string;
}): void {
  apiUrl = normalizeApiBase(config.apiUrl);
  siteUrl = config.siteUrl?.replace(/\/$/, '') ?? '';
  socketUrl = config.socketUrl?.trim().replace(/\/$/, '') ?? '';
  googleMapsKey = config.googleMapsKey?.trim() ?? '';
  cloudinaryUploadPreset = config.cloudinaryUploadPreset?.trim() ?? '';
  defaultLanguage = parseDefaultLanguage(config.defaultLanguage);
  supportedLanguages = parseSupportedLanguages(config.supportedLanguages);
  if (!supportedLanguages.includes(defaultLanguage)) {
    defaultLanguage = supportedLanguages[0] ?? 'ar';
  }
}

export function getApiUrl(): string {
  return apiUrl;
}

/** Public site origin for canonical URLs, hreflang, JSON-LD (no trailing slash). */
export function getSiteUrl(): string {
  return siteUrl;
}

/** Socket.IO origin; empty means same-origin / Vite proxy (see `useNotificationsSocket`). */
export function getSocketUrl(): string {
  return socketUrl;
}

export function getGoogleMapsKey(): string {
  return googleMapsKey;
}

export function getCloudinaryUploadPreset(): string {
  return cloudinaryUploadPreset;
}

export function getDefaultAppLanguage(): PublicAppLang {
  return defaultLanguage;
}

export function getSupportedAppLanguages(): PublicAppLang[] {
  return supportedLanguages.length > 0 ? supportedLanguages : ['ar', 'en'];
}
