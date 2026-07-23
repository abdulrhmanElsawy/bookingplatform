import type { Request } from 'express';
import type { Types } from 'mongoose';

import type { AppLang } from '../../lib/i18n.types.js';
import { translate } from '../../lib/i18n.js';
import { isMongoObjectId } from '../../lib/objectId.js';
import { slugifyLatin } from '../../lib/slugify.js';
import { httpError } from '../../middleware/errorHandler.js';
import { getLiveCategoryIds, isCategoryLive } from '../../lib/liveCategories.js';
import { Category } from '../categories/category.model.js';
import { createNotification } from '../notifications/notifications.service.js';
import {
  loadEmailUserById,
  sendListingApprovedEmail,
  sendListingRejectedEmail,
} from '../email/email.service.js';
import type { UserRole } from '../users/user.model.js';
import { User } from '../users/user.model.js';

import { Listing } from './listing.model.js';
import {
  assertBranchesValid,
  normalizeListingBranches,
} from './listingBranches.js';
import { normalizeListingLocation } from './listingLocation.js';
import type {
  CreateListingBody,
  PatchListingStatusBody,
  UpdateListingBody,
} from './listings.schemas.js';

type Authed = NonNullable<Request['user']>;

type ListingNotifySlice = {
  _id: unknown;
  owner: Types.ObjectId;
  name: { ar: string; en: string };
  slug: string;
};

async function notifyListingApproved(listing: ListingNotifySlice): Promise<void> {
  try {
    await createNotification({
      userId: String(listing.owner),
      type: 'listing_approved',
      title: {
        ar: translate('ar', 'notifListingApprovedTitle'),
        en: translate('en', 'notifListingApprovedTitle'),
      },
      body: {
        ar: translate('ar', 'notifListingApprovedBody', { name: listing.name.ar }),
        en: translate('en', 'notifListingApprovedBody', { name: listing.name.en }),
      },
      metadata: { listingId: String(listing._id), slug: String(listing.slug) },
    });
    const emailUser = await loadEmailUserById(String(listing.owner));
    if (emailUser) {
      const listingName =
        emailUser.preferences.language === 'ar'
          ? listing.name.ar
          : listing.name.en;
      await sendListingApprovedEmail(emailUser, listingName);
    }
  } catch (err) {
    console.error('notifyListingApproved failed', err);
  }
}

async function notifyListingRejected(
  listing: ListingNotifySlice,
  reason: { ar: string; en: string },
): Promise<void> {
  try {
    await createNotification({
      userId: String(listing.owner),
      type: 'listing_rejected',
      title: {
        ar: translate('ar', 'notifListingRejectedTitle', { name: listing.name.ar }),
        en: translate('en', 'notifListingRejectedTitle', { name: listing.name.en }),
      },
      body: {
        ar: reason.ar.trim(),
        en: reason.en.trim(),
      },
      metadata: { listingId: String(listing._id), slug: String(listing.slug) },
    });
    const emailUser = await loadEmailUserById(String(listing.owner));
    if (emailUser) {
      const listingName =
        emailUser.preferences.language === 'ar'
          ? listing.name.ar
          : listing.name.en;
      const reasonText =
        emailUser.preferences.language === 'ar' ? reason.ar.trim() : reason.en.trim();
      await sendListingRejectedEmail(emailUser, listingName, reasonText);
    }
  } catch (err) {
    console.error('notifyListingRejected failed', err);
  }
}

export function canManageListing(user: Authed, ownerId: string): boolean {
  if (user.id === ownerId) return true;
  return user.role === 'admin' || user.role === 'super_admin';
}

function isElevatedRole(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}

async function ensureUniqueSlug(desired: string): Promise<string> {
  let slug = desired;
  let n = 0;
  // eslint-disable-next-line no-await-in-loop
  while (await Listing.exists({ slug })) {
    n += 1;
    slug = `${desired}-${n}`;
  }
  return slug;
}

function duplicateWrite(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export async function listListings(options: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  sort?: string;
  isPremium?: boolean;
}): Promise<{ listings: unknown[]; total: number; page: number; limit: number }> {
  const empty = {
    listings: [] as unknown[],
    total: 0,
    page: options.page,
    limit: options.limit,
  };

  const filter: Record<string, unknown> = { status: 'active' };
  if (options.isPremium === true) filter.isPremium = true;
  const search = options.search?.trim();
  const liveCategoryIds = await getLiveCategoryIds();

  if (options.category) {
    const key = options.category;
    if (isMongoObjectId(key)) {
      const cat = await Category.findById(key).select('slug').lean<{ slug: string }>();
      if (!cat || !isCategoryLive(cat.slug)) {
        return empty;
      }
      filter.category = key;
    } else {
      const slug = key.toLowerCase();
      if (!isCategoryLive(slug)) {
        return empty;
      }
      const cat = await Category.findOne({ slug }).select('_id').lean();
      if (!cat) {
        return empty;
      }
      filter.category = (cat as { _id: Types.ObjectId })._id;
    }
  } else if (liveCategoryIds.length > 0) {
    filter.category = { $in: liveCategoryIds };
  } else {
    return empty;
  }

  const textFilter =
    search && search.length > 0
      ? { ...filter, $text: { $search: search } }
      : filter;

  const total = await Listing.countDocuments(textFilter);

  let sort: Record<string, 1 | -1 | { $meta: string }> = { createdAt: -1 };
  if (search && options.sort === 'relevance') {
    sort = { score: { $meta: 'textScore' } };
  } else if (options.sort === 'rating') {
    sort = { averageRating: -1, createdAt: -1 };
  }

  let q = Listing.find(textFilter).populate('category', 'slug name');
  if (search && options.sort === 'relevance') {
    q = q.select({ score: { $meta: 'textScore' } });
  }

  const listings = await q
    .sort(sort as Record<string, 1 | -1>)
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)
    .lean();

  return { listings, total, page: options.page, limit: options.limit };
}

export async function listFeatured(
  limit: number,
): Promise<{ listings: unknown[] }> {
  const liveCategoryIds = await getLiveCategoryIds();
  if (liveCategoryIds.length === 0) {
    return { listings: [] };
  }
  const listings = await Listing.find({
    status: 'active',
    isFeatured: true,
    category: { $in: liveCategoryIds },
  })
    .populate('category', 'slug name')
    .sort({ averageRating: -1, createdAt: -1 })
    .limit(limit)
    .lean();
  return { listings };
}

export async function listNearby(options: {
  lng: number;
  lat: number;
  limit: number;
  maxKm: number;
}): Promise<{ listings: unknown[] }> {
  const liveCategoryIds = await getLiveCategoryIds();
  if (liveCategoryIds.length === 0) {
    return { listings: [] };
  }
  const maxMeters = Math.max(1, options.maxKm) * 1000;
  const listings = await Listing.find({
    status: 'active',
    category: { $in: liveCategoryIds },
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [options.lng, options.lat],
        },
        $maxDistance: maxMeters,
      },
    },
  })
    .populate('category', 'slug name')
    .limit(options.limit)
    .lean();
  return { listings };
}

export async function getListingBySlugOrId(
  lang: AppLang,
  param: string,
  user: Authed | undefined,
): Promise<unknown> {
  const cond = isMongoObjectId(param)
    ? ({ _id: param } as const)
    : ({ slug: param.toLowerCase() } as const);

  const listing = await Listing.findOne(cond).populate('category', 'slug name').lean();
  if (!listing) {
    throw httpError(404, translate(lang, 'notFound'));
  }

  const row = listing as unknown as {
    owner: Types.ObjectId;
    status: string;
  };
  const ownerId = String(row.owner);
  const status = row.status;
  const privileged =
    user &&
    (canManageListing(user, ownerId) ||
      user.role === 'admin' ||
      user.role === 'super_admin');

  if (status !== 'active' && !privileged) {
    throw httpError(404, translate(lang, 'notFound'));
  }

  return listing;
}

export async function createListing(
  lang: AppLang,
  user: Authed,
  body: CreateListingBody,
): Promise<unknown> {
  const category = await Category.findById(body.category).select('_id').lean();
  if (!category) {
    throw httpError(400, translate(lang, 'validationError'));
  }

  const baseSlug = body.slug ?? slugifyLatin(body.name.en);
  const slug = await ensureUniqueSlug(baseSlug);

  if (user.role === 'user') {
    await User.updateOne(
      { _id: user.id, isDeleted: false, isActive: true },
      { role: 'gym_owner' },
    );
    user.role = 'gym_owner';
  }

  const elevated = isElevatedRole(user.role);
  let status = body.status ?? 'draft';
  if (!elevated) {
    if (!['draft', 'pending'].includes(status)) {
      status = 'draft';
    }
  }

  const normalizedLocation = await normalizeListingLocation(lang, body.location);

  let normalizedBranches: Awaited<ReturnType<typeof normalizeListingBranches>> = [];
  if (body.branches?.length) {
    assertBranchesValid(lang, body.branches);
    normalizedBranches = await normalizeListingBranches(lang, body.branches);
  }

  const doc = {
    ...body,
    location: normalizedLocation,
    branches: normalizedBranches,
    owner: user.id,
    slug,
    status,
    publishedAt: status === 'active' ? new Date() : undefined,
  };

  try {
    const created = await Listing.create(doc);
    return created.toObject();
  } catch (err) {
    if (duplicateWrite(err)) {
      throw httpError(409, translate(lang, 'validationError'));
    }
    throw err;
  }
}

export async function updateListing(
  lang: AppLang,
  user: Authed,
  listingId: string,
  body: UpdateListingBody,
): Promise<unknown> {
  if (!isMongoObjectId(listingId)) {
    throw httpError(404, translate(lang, 'notFound'));
  }
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw httpError(404, translate(lang, 'notFound'));
  }
  if (!canManageListing(user, String(listing.owner))) {
    throw httpError(403, translate(lang, 'forbidden'));
  }

  const elevated = isElevatedRole(user.role);
  const patch = stripUndefined(body as Record<string, unknown>) as UpdateListingBody;
  let ownerSubmitForReview = false;
  if (!elevated) {
    if (patch.status === 'pending') {
      ownerSubmitForReview = true;
    }
    delete (patch as { status?: unknown }).status;
  }

  if (patch.category) {
    const cat = await Category.findById(patch.category).select('_id').lean();
    if (!cat) {
      throw httpError(400, translate(lang, 'validationError'));
    }
  }

  if (patch.slug) {
    const taken = await Listing.findOne({
      slug: patch.slug,
      _id: { $ne: listing._id },
    })
      .select('_id')
      .lean();
    if (taken) {
      throw httpError(409, translate(lang, 'validationError'));
    }
  }

  const previousStatus = listing.status;
  if (
    !elevated &&
    (previousStatus === 'active' || previousStatus === 'rejected')
  ) {
    listing.status = 'pending';
    if (previousStatus === 'rejected') {
      listing.rejectionReason = undefined;
    }
  }

  if (patch.location) {
    patch.location = await normalizeListingLocation(lang, patch.location);
  }

  if (patch.branches) {
    assertBranchesValid(lang, patch.branches);
    patch.branches = await normalizeListingBranches(lang, patch.branches);
  }

  Object.assign(listing, patch);

  if (
    !elevated &&
    ownerSubmitForReview &&
    (previousStatus === 'draft' || previousStatus === 'pending')
  ) {
    listing.status = 'pending';
  }

  if (listing.isModified('status') && listing.status === 'active' && !listing.publishedAt) {
    listing.publishedAt = new Date();
  }

  try {
    await listing.save();
  } catch (err) {
    if (duplicateWrite(err)) {
      throw httpError(409, translate(lang, 'validationError'));
    }
    throw err;
  }

  return (await Listing.findById(listing._id)
    .populate('category', 'slug name')
    .lean()) as unknown;
}

export async function deleteListing(
  lang: AppLang,
  user: Authed,
  listingId: string,
): Promise<void> {
  if (!isMongoObjectId(listingId)) {
    throw httpError(404, translate(lang, 'notFound'));
  }
  const listing = await Listing.findById(listingId).select('owner').lean();
  if (!listing) {
    throw httpError(404, translate(lang, 'notFound'));
  }
  if (
    !canManageListing(
      user,
      String((listing as unknown as { owner: Types.ObjectId }).owner),
    )
  ) {
    throw httpError(403, translate(lang, 'forbidden'));
  }
  await Listing.deleteOne({ _id: listingId });
}

export async function patchListingStatus(
  lang: AppLang,
  listingId: string,
  body: PatchListingStatusBody,
): Promise<unknown> {
  if (!isMongoObjectId(listingId)) {
    throw httpError(404, translate(lang, 'notFound'));
  }

  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw httpError(404, translate(lang, 'notFound'));
  }

  const previousStatus = listing.status;

  listing.status = body.status;
  if (body.status === 'rejected') {
    listing.rejectionReason = {
      ar: body.rejectionReason?.ar ?? '',
      en: body.rejectionReason?.en ?? '',
    };
  } else {
    listing.rejectionReason = undefined;
  }
  if (body.status === 'active') {
    listing.publishedAt = listing.publishedAt ?? new Date();
  }

  await listing.save();

  if (previousStatus !== body.status) {
    const slice: ListingNotifySlice = {
      _id: listing._id,
      owner: listing.owner as Types.ObjectId,
      name: listing.name as { ar: string; en: string },
      slug: String(listing.slug),
    };
    if (body.status === 'active') {
      await notifyListingApproved(slice);
    }
    if (body.status === 'rejected' && body.rejectionReason) {
      await notifyListingRejected(slice, {
        ar: body.rejectionReason.ar ?? '',
        en: body.rejectionReason.en ?? '',
      });
    }
  }
  return (await Listing.findById(listing._id)
    .populate('category', 'slug name')
    .lean()) as unknown;
}

export async function getListingAnalytics(
  lang: AppLang,
  user: Authed,
  listingId: string,
): Promise<{ views: number; clicks: number; contactClicks: number }> {
  if (!isMongoObjectId(listingId)) {
    throw httpError(404, translate(lang, 'notFound'));
  }

  const listing = await Listing.findById(listingId)
    .select('owner views clicks contactClicks')
    .lean();
  if (!listing) {
    throw httpError(404, translate(lang, 'notFound'));
  }

  if (
    !canManageListing(
      user,
      String((listing as unknown as { owner: Types.ObjectId }).owner),
    )
  ) {
    throw httpError(403, translate(lang, 'forbidden'));
  }

  const row = listing as {
    views?: number;
    clicks?: number;
    contactClicks?: number;
  };
  return {
    views: row.views ?? 0,
    clicks: row.clicks ?? 0,
    contactClicks: row.contactClicks ?? 0,
  };
}
