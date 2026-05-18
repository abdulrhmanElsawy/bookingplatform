import type { Request } from 'express';
import type { Types } from 'mongoose';

import type { AppLang } from '../../lib/i18n.types.js';
import { translate } from '../../lib/i18n.js';
import { isMongoObjectId } from '../../lib/objectId.js';
import { httpError } from '../../middleware/errorHandler.js';
import { Category } from '../categories/category.model.js';
import { Listing } from '../listings/listing.model.js';
import {
  deleteListing,
  patchListingStatus,
} from '../listings/listings.service.js';
type Authed = NonNullable<Request['user']>;
import { SimulatedPayment } from '../payments/payment.model.js';
import { Review } from '../reviews/review.model.js';
import { recalculateListingRatings } from '../reviews/reviews.service.js';
import { VenueSubscription } from '../subscriptions/venueSubscription.model.js';
import { User } from '../users/user.model.js';
import { logAdminAudit } from './adminAudit.service.js';
import type {
  AdminCreateCategoryBody,
  AdminPatchCategoryBody,
  AdminPatchListingBody,
  AdminPatchReviewStatusBody,
  AdminPatchSubscriptionBody,
} from './admin.schemas.js';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export type AdminListingRow = {
  _id: string;
  slug: string;
  name: { ar: string; en: string };
  status: string;
  ownerEmail: string;
  categorySlug: string;
  isFeatured: boolean;
  isPremium: boolean;
  isVerified: boolean;
  createdAt: string;
};

export async function listListingsForAdmin(options: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  category?: string;
  isFeatured?: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
}): Promise<{
  listings: AdminListingRow[];
  total: number;
  page: number;
  limit: number;
}> {
  const filter: Record<string, unknown> = {};
  if (options.status?.trim()) filter.status = options.status.trim();
  if (options.isFeatured === true) filter.isFeatured = true;
  if (options.isFeatured === false) filter.isFeatured = false;
  if (options.isPremium === true) filter.isPremium = true;
  if (options.isPremium === false) filter.isPremium = false;
  if (options.isVerified === true) filter.isVerified = true;
  if (options.isVerified === false) filter.isVerified = false;

  const q = options.search?.trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ slug: rx }, { 'name.ar': rx }, { 'name.en': rx }];
  }

  if (options.category?.trim()) {
    const key = options.category.trim();
    if (isMongoObjectId(key)) {
      filter.category = key;
    } else {
      const cat = await Category.findOne({ slug: key.toLowerCase() }).select('_id').lean();
      if (!cat) {
        return { listings: [], total: 0, page: options.page, limit: options.limit };
      }
      filter.category = (cat as { _id: Types.ObjectId })._id;
    }
  }

  const skip = (options.page - 1) * options.limit;
  const [rows, total] = await Promise.all([
    Listing.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(options.limit)
      .populate('owner', 'email')
      .populate('category', 'slug')
      .select('slug name status isFeatured isPremium isVerified createdAt owner category')
      .lean(),
    Listing.countDocuments(filter),
  ]);

  const listings: AdminListingRow[] = rows.map((doc) => {
    const owner = doc.owner as unknown as { email?: string } | null;
    const cat = doc.category as unknown as { slug?: string } | null;
    return {
      _id: String(doc._id),
      slug: String(doc.slug),
      name: doc.name as { ar: string; en: string },
      status: String(doc.status),
      ownerEmail: owner?.email ?? '',
      categorySlug: cat?.slug ?? '',
      isFeatured: Boolean(doc.isFeatured),
      isPremium: Boolean(doc.isPremium),
      isVerified: Boolean(doc.isVerified),
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    };
  });

  return { listings, total, page: options.page, limit: options.limit };
}

export async function patchListingAsAdmin(
  lang: AppLang,
  actorId: string,
  listingId: string,
  body: AdminPatchListingBody,
): Promise<unknown> {
  if (!isMongoObjectId(listingId)) {
    throw httpError(404, translate(lang, 'notFound'));
  }
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw httpError(404, translate(lang, 'notFound'));
  }

  let result: unknown = listing.toObject();

  if (body.status !== undefined) {
    result = await patchListingStatus(lang, listingId, {
      status: body.status,
      rejectionReason: body.rejectionReason,
    });
    await logAdminAudit({
      actorId,
      action: 'listing.status',
      targetType: 'listing',
      targetId: listingId,
      metadata: { status: body.status },
    });
  }

  const flagUpdates: Record<string, boolean> = {};
  if (body.isFeatured !== undefined) flagUpdates.isFeatured = body.isFeatured;
  if (body.isPremium !== undefined) flagUpdates.isPremium = body.isPremium;
  if (body.isVerified !== undefined) flagUpdates.isVerified = body.isVerified;

  if (Object.keys(flagUpdates).length > 0) {
    await Listing.updateOne({ _id: listingId }, { $set: flagUpdates });
    await logAdminAudit({
      actorId,
      action: 'listing.flags',
      targetType: 'listing',
      targetId: listingId,
      metadata: flagUpdates,
    });
    result = await Listing.findById(listingId)
      .populate('category', 'slug name')
      .lean();
  }

  return result;
}

export async function deleteListingAsAdmin(
  lang: AppLang,
  actor: Authed,
  actorId: string,
  listingId: string,
): Promise<void> {
  await deleteListing(lang, actor, listingId);
  await logAdminAudit({
    actorId,
    action: 'listing.delete',
    targetType: 'listing',
    targetId: listingId,
  });
}

export type AdminReviewRow = {
  _id: string;
  listingSlug: string;
  listingName: { ar: string; en: string };
  userEmail: string;
  title: string;
  status: string;
  createdAt: string;
};

export async function listReviewsForAdmin(options: {
  page: number;
  limit: number;
  status?: string;
}): Promise<{
  reviews: AdminReviewRow[];
  total: number;
  page: number;
  limit: number;
}> {
  const status = options.status?.trim() || 'pending';
  const filter = { status };
  const skip = (options.page - 1) * options.limit;
  const [rows, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(options.limit)
      .populate('listing', 'slug name')
      .populate('user', 'email')
      .select('title status createdAt listing user')
      .lean(),
    Review.countDocuments(filter),
  ]);

  const reviews: AdminReviewRow[] = rows.map((doc) => {
    const listing = doc.listing as unknown as {
      slug?: string;
      name?: { ar: string; en: string };
    } | null;
    const user = doc.user as unknown as { email?: string } | null;
    return {
      _id: String(doc._id),
      listingSlug: listing?.slug ?? '',
      listingName: listing?.name ?? { ar: '', en: '' },
      userEmail: user?.email ?? '',
      title: String(doc.title),
      status: String(doc.status),
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    };
  });

  return { reviews, total, page: options.page, limit: options.limit };
}

export async function patchReviewStatusAsAdmin(
  lang: AppLang,
  actorId: string,
  reviewId: string,
  body: AdminPatchReviewStatusBody,
): Promise<void> {
  if (!isMongoObjectId(reviewId)) {
    throw httpError(404, translate(lang, 'notFound'));
  }
  const review = await Review.findById(reviewId);
  if (!review) {
    throw httpError(404, translate(lang, 'notFound'));
  }

  review.status = body.status;
  if (body.status === 'rejected' && body.moderationNote) {
    review.rejectionReason = `${body.moderationNote.ar}\n---\n${body.moderationNote.en}`;
  }
  await review.save();
  await recalculateListingRatings(String(review.listing));
  await logAdminAudit({
    actorId,
    action: 'review.status',
    targetType: 'review',
    targetId: reviewId,
    metadata: { status: body.status },
  });
}

export type AdminCategoryRow = {
  _id: string;
  slug: string;
  name: { ar: string; en: string };
  image?: string;
  order: number;
  isActive: boolean;
  listingCount: number;
};

export async function listCategoriesForAdmin(): Promise<{ categories: AdminCategoryRow[] }> {
  const rows = await Category.find().sort({ order: 1, slug: 1 }).lean();
  return {
    categories: rows.map((c) => ({
      _id: String(c._id),
      slug: String(c.slug),
      name: c.name as { ar: string; en: string },
      image: c.image ? String(c.image) : undefined,
      order: Number(c.order ?? 0),
      isActive: c.isActive !== false,
      listingCount: Number(c.listingCount ?? 0),
    })),
  };
}

export async function createCategoryAsAdmin(
  actorId: string,
  body: AdminCreateCategoryBody,
): Promise<AdminCategoryRow> {
  const slug = body.slug.toLowerCase().trim();
  const existing = await Category.findOne({ slug }).lean();
  if (existing) {
    throw httpError(409, 'Category slug already exists');
  }
  const doc = await Category.create({
    name: body.name,
    slug,
    image: body.image,
    order: body.order ?? 0,
    isActive: body.isActive ?? true,
    seoTitle: body.seoTitle,
    seoDescription: body.seoDescription,
  });
  await logAdminAudit({
    actorId,
    action: 'category.create',
    targetType: 'category',
    targetId: String(doc._id),
  });
  return {
    _id: String(doc._id),
    slug: String(doc.slug),
    name: doc.name as { ar: string; en: string },
    image: doc.image ? String(doc.image) : undefined,
    order: Number(doc.order ?? 0),
    isActive: doc.isActive !== false,
    listingCount: 0,
  };
}

export async function patchCategoryAsAdmin(
  lang: AppLang,
  actorId: string,
  categoryId: string,
  body: AdminPatchCategoryBody,
): Promise<AdminCategoryRow> {
  if (!isMongoObjectId(categoryId)) {
    throw httpError(404, translate(lang, 'notFound'));
  }
  const doc = await Category.findById(categoryId);
  if (!doc) {
    throw httpError(404, translate(lang, 'notFound'));
  }
  if (body.slug !== undefined) {
    const slug = body.slug.toLowerCase().trim();
    const clash = await Category.findOne({ slug, _id: { $ne: categoryId } }).lean();
    if (clash) throw httpError(409, 'Category slug already exists');
    doc.slug = slug;
  }
  if (body.name !== undefined) doc.name = body.name;
  if (body.image !== undefined) doc.image = body.image;
  if (body.order !== undefined) doc.order = body.order;
  if (body.isActive !== undefined) doc.isActive = body.isActive;
  if (body.seoTitle !== undefined) doc.seoTitle = body.seoTitle;
  if (body.seoDescription !== undefined) doc.seoDescription = body.seoDescription;
  await doc.save();
  await logAdminAudit({
    actorId,
    action: 'category.patch',
    targetType: 'category',
    targetId: categoryId,
    metadata: body as Record<string, unknown>,
  });
  return {
    _id: String(doc._id),
    slug: String(doc.slug),
    name: doc.name as { ar: string; en: string },
    image: doc.image ? String(doc.image) : undefined,
    order: Number(doc.order ?? 0),
    isActive: doc.isActive !== false,
    listingCount: Number(doc.listingCount ?? 0),
  };
}

export async function deleteCategoryAsAdmin(
  lang: AppLang,
  actorId: string,
  categoryId: string,
): Promise<void> {
  if (!isMongoObjectId(categoryId)) {
    throw httpError(404, translate(lang, 'notFound'));
  }
  const doc = await Category.findById(categoryId).lean<{ listingCount?: number }>();
  if (!doc) {
    throw httpError(404, translate(lang, 'notFound'));
  }
  if (Number(doc.listingCount ?? 0) > 0) {
    throw httpError(400, 'Cannot delete category with listings');
  }
  await Category.deleteOne({ _id: categoryId });
  await logAdminAudit({
    actorId,
    action: 'category.delete',
    targetType: 'category',
    targetId: categoryId,
  });
}

export type AdminSubscriptionRow = {
  _id: string;
  accessCode: string;
  status: string;
  userEmail: string;
  listingSlug: string;
  listingName: { ar: string; en: string };
  validUntil: string;
  createdAt: string;
};

export async function listSubscriptionsForAdmin(options: {
  page: number;
  limit: number;
  search?: string;
}): Promise<{
  subscriptions: AdminSubscriptionRow[];
  total: number;
  page: number;
  limit: number;
}> {
  const filter: Record<string, unknown> = {};
  const q = options.search?.trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    const users = await User.find({
      isDeleted: { $ne: true },
      email: rx,
    })
      .select('_id')
      .lean();
    const userIds = users.map((u) => u._id);
    const or: Record<string, unknown>[] = [{ accessCode: rx }];
    if (userIds.length > 0) or.push({ user: { $in: userIds } });
    filter.$or = or;
  }

  const skip = (options.page - 1) * options.limit;
  const [rows, total] = await Promise.all([
    VenueSubscription.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(options.limit)
      .populate('user', 'email')
      .populate('listing', 'slug name')
      .lean(),
    VenueSubscription.countDocuments(filter),
  ]);

  const subscriptions: AdminSubscriptionRow[] = rows.map((doc) => {
    const user = doc.user as unknown as { email?: string } | null;
    const listing = doc.listing as unknown as {
      slug?: string;
      name?: { ar: string; en: string };
    } | null;
    return {
      _id: String(doc._id),
      accessCode: String(doc.accessCode),
      status: String(doc.status),
      userEmail: user?.email ?? '',
      listingSlug: listing?.slug ?? '',
      listingName: listing?.name ?? { ar: '', en: '' },
      validUntil:
        doc.validUntil instanceof Date
          ? doc.validUntil.toISOString()
          : String(doc.validUntil),
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    };
  });

  return { subscriptions, total, page: options.page, limit: options.limit };
}

export async function patchSubscriptionAsAdmin(
  lang: AppLang,
  actorId: string,
  subscriptionId: string,
  body: AdminPatchSubscriptionBody,
): Promise<void> {
  if (!isMongoObjectId(subscriptionId)) {
    throw httpError(404, translate(lang, 'notFound'));
  }
  const doc = await VenueSubscription.findById(subscriptionId);
  if (!doc) {
    throw httpError(404, translate(lang, 'notFound'));
  }
  doc.status = body.status;
  await doc.save();
  await logAdminAudit({
    actorId,
    action: 'subscription.status',
    targetType: 'subscription',
    targetId: subscriptionId,
    metadata: { status: body.status },
  });
}

export async function getPaymentsSummary(): Promise<{
  totalTransactions: number;
  totalAmount: number;
  byPlan: Record<string, { count: number; amount: number }>;
}> {
  const rows = await SimulatedPayment.find().select('planKey amount').lean();
  let totalAmount = 0;
  const byPlan: Record<string, { count: number; amount: number }> = {};
  for (const row of rows) {
    const key = String(row.planKey);
    const amount = Number(row.amount ?? 0);
    totalAmount += amount;
    if (!byPlan[key]) byPlan[key] = { count: 0, amount: 0 };
    byPlan[key].count += 1;
    byPlan[key].amount += amount;
  }
  return {
    totalTransactions: rows.length,
    totalAmount,
    byPlan,
  };
}

export type AdminPaymentRow = {
  _id: string;
  userEmail: string;
  planKey: string;
  amount: number;
  currency: string;
  createdAt: string;
};

export async function listPaymentTransactionsForAdmin(options: {
  page: number;
  limit: number;
}): Promise<{
  transactions: AdminPaymentRow[];
  total: number;
  page: number;
  limit: number;
}> {
  const skip = (options.page - 1) * options.limit;
  const [rows, total] = await Promise.all([
    SimulatedPayment.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(options.limit)
      .populate('user', 'email')
      .lean(),
    SimulatedPayment.countDocuments(),
  ]);

  const transactions: AdminPaymentRow[] = rows.map((doc) => {
    const user = doc.user as unknown as { email?: string } | null;
    return {
      _id: String(doc._id),
      userEmail: user?.email ?? '',
      planKey: String(doc.planKey),
      amount: Number(doc.amount),
      currency: String(doc.currency ?? 'SAR'),
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    };
  });

  return { transactions, total, page: options.page, limit: options.limit };
}

export async function getHomeContentPreview(): Promise<{
  featured: { _id: string; slug: string; name: { ar: string; en: string } }[];
  premium: { _id: string; slug: string; name: { ar: string; en: string } }[];
}> {
  type HomeListingLean = { _id: unknown; slug: string; name: { ar: string; en: string } };

  const [featured, premium] = await Promise.all([
    Listing.find({ status: 'active', isFeatured: true })
      .select('slug name')
      .sort({ averageRating: -1 })
      .limit(20)
      .lean<HomeListingLean[]>(),
    Listing.find({ status: 'active', isPremium: true })
      .select('slug name')
      .sort({ averageRating: -1 })
      .limit(20)
      .lean<HomeListingLean[]>(),
  ]);
  const mapRow = (doc: HomeListingLean) => ({
    _id: String(doc._id),
    slug: String(doc.slug),
    name: doc.name as { ar: string; en: string },
  });
  return {
    featured: featured.map(mapRow),
    premium: premium.map(mapRow),
  };
}
