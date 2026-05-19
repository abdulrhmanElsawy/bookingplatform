import type { AppLang } from '../../lib/i18n.types.js';
import { translate } from '../../lib/i18n.js';
import { httpError } from '../../middleware/errorHandler.js';

import {
  normalizeListingLocation,
  type ListingLocationInput,
} from './listingLocation.js';
import type { CreateListingBody } from './listings.schemas.js';

export type ListingBranchInput = {
  name: { ar: string; en: string };
  address: { ar: string; en: string };
  city: { ar: string; en: string };
  district: { ar: string; en: string };
  googleMapsUrl: string;
  coordinates?: ListingLocationInput['coordinates'];
  phone?: string;
  whatsapp?: string;
  images?: NonNullable<CreateListingBody['images']>;
  operatingHours?: CreateListingBody['operatingHours'];
  is24Hours?: boolean;
  isMain?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export type NormalizedListingBranch = {
  name: { ar: string; en: string };
  address: { ar: string; en: string };
  city: { ar: string; en: string };
  district: { ar: string; en: string };
  googleMapsUrl: string;
  coordinates: {
    type: 'Point';
    coordinates: [number, number];
  };
  phone?: string;
  whatsapp?: string;
  images?: NonNullable<CreateListingBody['images']>;
  operatingHours?: CreateListingBody['operatingHours'];
  is24Hours: boolean;
  isMain: boolean;
  isActive: boolean;
  sortOrder: number;
};

export async function normalizeListingBranches(
  lang: AppLang,
  branches: ListingBranchInput[],
): Promise<NormalizedListingBranch[]> {
  if (!branches.length) return [];

  const normalized = await Promise.all(
    branches.map(async (branch, index) => {
      const loc = await normalizeListingLocation(lang, {
        address: branch.address,
        city: branch.city,
        district: branch.district,
        googleMapsUrl: branch.googleMapsUrl,
        coordinates: branch.coordinates,
      });

      return {
        name: branch.name,
        address: loc.address,
        city: loc.city,
        district: loc.district,
        googleMapsUrl: loc.googleMapsUrl,
        coordinates: loc.coordinates,
        ...(branch.phone?.trim() ? { phone: branch.phone.trim() } : {}),
        ...(branch.whatsapp?.trim() ? { whatsapp: branch.whatsapp.trim() } : {}),
        ...(branch.images?.length ? { images: branch.images } : {}),
        ...(branch.operatingHours ? { operatingHours: branch.operatingHours } : {}),
        is24Hours: branch.is24Hours ?? false,
        isMain: branch.isMain ?? false,
        isActive: branch.isActive ?? true,
        sortOrder: branch.sortOrder ?? index,
      };
    }),
  );

  const mainCount = normalized.filter((b) => b.isMain).length;
  if (mainCount === 0) {
    normalized[0]!.isMain = true;
  } else if (mainCount > 1) {
    let seenMain = false;
    for (const branch of normalized) {
      if (branch.isMain) {
        if (seenMain) branch.isMain = false;
        else seenMain = true;
      }
    }
  }

  return normalized;
}

export function assertBranchesValid(lang: AppLang, branches: ListingBranchInput[]): void {
  const active = branches.filter((b) => b.isActive !== false);
  if (active.length === 0 && branches.length > 0) {
    throw httpError(400, translate(lang, 'validationError'));
  }
}
