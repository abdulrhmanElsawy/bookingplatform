import type { AppLang } from '../../lib/i18n.types.js';
import { translate } from '../../lib/i18n.js';
import { httpError } from '../../middleware/errorHandler.js';
import { isWithinSaudiBounds, parseGoogleMapsUrl } from '../../lib/parseGoogleMapsUrl.js';
import { resolveGoogleMapsUrl } from '../../lib/resolveGoogleMapsUrl.js';

export type ListingLocationInput = {
  address: { ar: string; en: string };
  city: { ar: string; en: string };
  district: { ar: string; en: string };
  googleMapsUrl: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number];
  };
};

export type NormalizedListingLocation = ListingLocationInput & {
  coordinates: {
    type: 'Point';
    coordinates: [number, number];
  };
};

export async function normalizeListingLocation(
  lang: AppLang,
  location: ListingLocationInput,
): Promise<NormalizedListingLocation> {
  const url = location.googleMapsUrl?.trim();
  if (!url) {
    throw httpError(400, translate(lang, 'validationError'));
  }

  let parsed = parseGoogleMapsUrl(url);
  if (!parsed) {
    parsed = await resolveGoogleMapsUrl(url);
  }
  if (!parsed) {
    throw httpError(400, translate(lang, 'validationError'));
  }

  if (!isWithinSaudiBounds(parsed.lat, parsed.lng)) {
    throw httpError(400, translate(lang, 'validationError'));
  }

  return {
    address: location.address,
    city: location.city,
    district: location.district,
    googleMapsUrl: parsed.normalizedUrl,
    coordinates: {
      type: 'Point',
      coordinates: [parsed.lng, parsed.lat],
    },
  };
}
