import { parseGoogleMapsUrl, type ParsedGoogleMapsUrl } from './parseGoogleMapsUrl.js';

const SHORT_LINK_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl', 'maps.app.google.com']);

function needsRedirect(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return SHORT_LINK_HOSTS.has(host) || host.endsWith('.goo.gl');
}

/**
 * Resolve short Google Maps links via redirects, then parse lat/lng from the final URL.
 */
export async function resolveGoogleMapsUrl(
  input: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ParsedGoogleMapsUrl | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  let targetUrl = parsed.toString();

  if (needsRedirect(parsed.hostname)) {
    try {
      const res = await fetchImpl(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'GrowthWorld/1.0' },
      });
      targetUrl = res.url || targetUrl;
    } catch {
      return null;
    }
  }

  return parseGoogleMapsUrl(targetUrl);
}
