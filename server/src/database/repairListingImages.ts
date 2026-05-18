import type { Types } from 'mongoose';

import { Category } from '../modules/categories/category.model.js';
import { Listing } from '../modules/listings/listing.model.js';
import { LISTING_SEEDS } from './seedDevData.js';
import {
  buildListingImages,
  resolveListingImageUrls,
  type BilingualLabel,
} from './seedMedia.js';

const FETCH_TIMEOUT_MS = 12_000;

const slugToSeedUrls: Record<string, readonly string[]> = Object.fromEntries(
  LISTING_SEEDS.map((s) => [s.slug, s.imageUrls]),
);

function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function isImageUrlReachable(url: string): Promise<boolean> {
  const trimmed = url.trim();
  if (!trimmed || !isHttpUrl(trimmed)) return false;

  const tryFetch = async (method: 'HEAD' | 'GET') => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(trimmed, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: { Accept: 'image/*,*/*;q=0.8' },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };

  if (await tryFetch('HEAD')) return true;
  return tryFetch('GET');
}

type ListingImageRow = {
  url?: string;
  alt?: BilingualLabel;
  isMain?: boolean;
  order?: number;
};

export type RepairListingImagesResult = {
  scanned: number;
  updated: number;
  skippedValid: number;
  dryRun: boolean;
  details: Array<{ slug: string; action: 'replaced' | 'kept' | 'would-replace'; reason: string }>;
};

type RepairListingRow = {
  _id: Types.ObjectId;
  slug: string;
  name: BilingualLabel;
  images?: ListingImageRow[];
  category?: { slug: string } | null;
};

export async function repairListingImages(options?: {
  dryRun?: boolean;
}): Promise<RepairListingImagesResult> {
  const dryRun = options?.dryRun ?? false;
  const listings = await Listing.find({})
    .select('slug name images category')
    .populate('category', 'slug')
    .lean<RepairListingRow[]>()
    .exec();

  const result: RepairListingImagesResult = {
    scanned: listings.length,
    updated: 0,
    skippedValid: 0,
    dryRun,
    details: [],
  };

  for (const row of listings) {
    const slug = String(row.slug);
    const name = row.name as BilingualLabel;
    const categorySlug =
      row.category && typeof row.category === 'object' && 'slug' in row.category
        ? String((row.category as { slug: string }).slug)
        : undefined;

    const existing = (row.images ?? []) as ListingImageRow[];
    const validUrls: string[] = [];
    for (const img of existing) {
      const url = typeof img.url === 'string' ? img.url.trim() : '';
      if (!url) continue;
      if (await isImageUrlReachable(url)) {
        validUrls.push(url);
      }
    }

    if (validUrls.length > 0) {
      const normalized = buildListingImages(validUrls, name);
      const urlsChanged =
        normalized.length !== existing.length ||
        normalized.some((img, i) => img.url !== (existing[i]?.url ?? ''));

      if (!urlsChanged && existing.every((img, i) => img.url === normalized[i]?.url)) {
        result.skippedValid += 1;
        result.details.push({ slug, action: 'kept', reason: `${validUrls.length} valid image(s)` });
        continue;
      }

      if (!dryRun) {
        await Listing.updateOne({ _id: row._id }, { $set: { images: normalized } }).exec();
      }
      result.updated += 1;
      result.details.push({
        slug,
        action: dryRun ? 'would-replace' : 'replaced',
        reason: `normalized ${validUrls.length} valid image(s)`,
      });
      continue;
    }

    const replacementUrls = resolveListingImageUrls(categorySlug, slugToSeedUrls, slug);
    const images = buildListingImages(replacementUrls, name);

    if (!dryRun) {
      await Listing.updateOne({ _id: row._id }, { $set: { images } }).exec();
    }
    result.updated += 1;
    result.details.push({
      slug,
      action: dryRun ? 'would-replace' : 'replaced',
      reason: `assigned ${replacementUrls.length} default image(s) for category ${categorySlug ?? 'unknown'}`,
    });
  }

  return result;
}

/** Verify all seed URLs still respond (dev maintenance). */
export async function verifySeedMediaUrls(): Promise<{ ok: string[]; failed: string[] }> {
  const urls = new Set<string>([
    ...Object.values(slugToSeedUrls).flat(),
    ...(await Category.find({}).select('image').lean()).map((c) => String((c as { image?: string }).image ?? '')),
  ]);
  const ok: string[] = [];
  const failed: string[] = [];
  for (const url of urls) {
    if (!url) continue;
    if (await isImageUrlReachable(url)) ok.push(url);
    else failed.push(url);
  }
  return { ok, failed };
}
