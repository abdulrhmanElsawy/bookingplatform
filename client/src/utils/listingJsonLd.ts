import { getLocalizedValue } from '@growth-world/shared';

import type { ListingDetailDto } from '../features/listings/api/listingsApi';

export function buildListingJsonLd(input: {
  listing: ListingDetailDto;
  canonicalUrl: string;
  /** Visible name in the active UI language */
  name: string;
  /** Short or full description in the active UI language */
  description: string;
}): Record<string, unknown> {
  const { listing, canonicalUrl, name, description } = input;
  const sorted = [...(listing.images ?? [])].sort(
    (a, b) => Number(b.isMain) - Number(a.isMain),
  );
  const main = sorted[0];

  const streetAr = getLocalizedValue(listing.location.address, 'ar');
  const streetEn = getLocalizedValue(listing.location.address, 'en');
  const cityAr = getLocalizedValue(listing.location.city, 'ar');
  const cityEn = getLocalizedValue(listing.location.city, 'en');
  const nameAr = getLocalizedValue(listing.name, 'ar');
  const nameEn = getLocalizedValue(listing.name, 'en');

  const payload: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name,
    description,
    url: canonicalUrl,
    image: main?.url ? [main.url] : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: streetAr || streetEn,
      addressLocality: cityAr || cityEn,
    },
    inLanguage: ['ar', 'en'],
  };

  if (nameAr && nameEn && nameAr !== nameEn) {
    payload.alternateName = [nameAr, nameEn];
  }

  return payload;
}
