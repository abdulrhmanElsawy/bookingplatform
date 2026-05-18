export type ParsedGoogleMapsUrl = {
  lat: number;
  lng: number;
  normalizedUrl: string;
};

const ALLOWED_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  'www.maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
  'maps.app.google.com',
]);

function isAllowedGoogleMapsHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (ALLOWED_HOSTS.has(host)) return true;
  return host.endsWith('.google.com') || host.endsWith('.goo.gl');
}

function parseCoordPair(a: string, b: string): { lat: number; lng: number } | null {
  const first = parseFloat(a);
  const second = parseFloat(b);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
  if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
    return { lat: first, lng: second };
  }
  if (Math.abs(second) <= 90 && Math.abs(first) > 90) {
    return { lat: second, lng: first };
  }
  return { lat: first, lng: second };
}

function extractCoordsFromString(haystack: string): { lat: number; lng: number } | null {
  const dMatch = haystack.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (dMatch) {
    const lat = parseFloat(dMatch[1]);
    const lng = parseFloat(dMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  const atMatch = haystack.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const pair = parseCoordPair(atMatch[1], atMatch[2]);
    if (pair) return pair;
  }

  const qMatch = haystack.match(/[?&](?:q|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (qMatch) {
    const pair = parseCoordPair(qMatch[1], qMatch[2]);
    if (pair) return pair;
  }

  return null;
}

export function isGoogleMapsUrlHost(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return isAllowedGoogleMapsHost(parsed.hostname);
  } catch {
    return false;
  }
}

/** Parse coordinates from a Google Maps URL string (not resolving short-link redirects). */
export function parseGoogleMapsUrl(input: string): ParsedGoogleMapsUrl | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (!isAllowedGoogleMapsHost(parsed.hostname)) return null;

  const coords =
    extractCoordsFromString(parsed.href) ??
    extractCoordsFromString(decodeURIComponent(parsed.href));

  if (!coords) return null;

  if (coords.lat < -90 || coords.lat > 90 || coords.lng < -180 || coords.lng > 180) {
    return null;
  }

  return {
    lat: coords.lat,
    lng: coords.lng,
    normalizedUrl: parsed.toString(),
  };
}

export function isWithinSaudiBounds(lat: number, lng: number): boolean {
  return lat >= 16 && lat <= 33 && lng >= 34 && lng <= 56;
}
