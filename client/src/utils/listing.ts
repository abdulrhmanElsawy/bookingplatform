import type { AppLang, BilingualField } from '@growth-world/shared';
import { getLocalizedValue } from '@growth-world/shared';

export type ListingNameShape = { name: BilingualField };

export type ListingCityShape = { location: { city: BilingualField } };

export function getListingName(listing: ListingNameShape, lang: AppLang): string {
  return getLocalizedValue(listing.name, lang);
}

export function getListingCity(listing: ListingCityShape, lang: AppLang): string {
  return getLocalizedValue(listing.location.city, lang);
}
