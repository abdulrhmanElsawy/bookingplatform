import type { Types } from 'mongoose';

import { Listing } from '../listings/listing.model.js';
import { isMongoObjectId } from '../../lib/objectId.js';
import { httpError } from '../../middleware/errorHandler.js';
import { Favorite } from './favorite.model.js';

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  );
}

type ListingIdRow = { _id: Types.ObjectId; status: string };

async function resolveListingId(listingRef: string): Promise<string | null> {
  if (isMongoObjectId(listingRef)) {
    const doc = await Listing.findById(listingRef).select('_id status').lean();
    const row = doc as ListingIdRow | null;
    return row && row.status === 'active' ? String(row._id) : null;
  }
  const doc = await Listing.findOne({ slug: listingRef })
    .select('_id status')
    .lean();
  const row = doc as ListingIdRow | null;
  return row && row.status === 'active' ? String(row._id) : null;
}

export async function getFavoriteStatus(
  userId: string | undefined,
  listingRef: string,
): Promise<{ favorited: boolean }> {
  if (!userId) {
    return { favorited: false };
  }
  const listingId = await resolveListingId(listingRef);
  if (!listingId) {
    return { favorited: false };
  }
  const exists = await Favorite.exists({ user: userId, listing: listingId });
  return { favorited: Boolean(exists) };
}

export async function addFavorite(
  userId: string,
  listingRef: string,
): Promise<{ favoriteId: string; listingId: string }> {
  const listingId = await resolveListingId(listingRef);
  if (!listingId) {
    throw httpError(404, 'Listing not found');
  }
  try {
    const doc = await Favorite.create({ user: userId, listing: listingId });
    return { favoriteId: String(doc._id), listingId };
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw httpError(409, 'Already in favorites');
    }
    throw err;
  }
}

export async function removeFavorite(
  userId: string,
  listingRef: string,
): Promise<void> {
  const listingId = await resolveListingId(listingRef);
  if (!listingId) {
    return;
  }
  await Favorite.deleteOne({ user: userId, listing: listingId });
}

export async function listUserFavorites(options: {
  userId: string;
  page: number;
  limit: number;
}): Promise<{
  favorites: { _id: string; listing: unknown }[];
  total: number;
  page: number;
  limit: number;
}> {
  const filter = { user: options.userId };
  const total = await Favorite.countDocuments(filter);
  const rows = await Favorite.find(filter)
    .sort({ createdAt: -1 })
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)
    .populate({
      path: 'listing',
      select:
        'slug name location amenities packages totalReviews averageRating images isVerified isFeatured status',
    })
    .lean();

  const favorites = rows
    .map((row) => ({
      _id: String(row._id),
      listing: row.listing ?? null,
    }))
    .filter((row) => {
      const l = row.listing as { status?: string } | null;
      return l != null && l.status === 'active';
    });

  return {
    favorites,
    total,
    page: options.page,
    limit: options.limit,
  };
}
