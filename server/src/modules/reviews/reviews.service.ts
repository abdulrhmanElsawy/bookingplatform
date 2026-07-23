import type { Types } from 'mongoose';

import { Listing } from '../listings/listing.model.js';
import { createNotification } from '../notifications/notifications.service.js';
import { User } from '../users/user.model.js';
import {
  loadEmailUserById,
  sendNewReviewEmail,
} from '../email/email.service.js';
import type { AppLang } from '../../lib/i18n.types.js';
import { translate } from '../../lib/i18n.js';
import { isMongoObjectId } from '../../lib/objectId.js';
import { httpError } from '../../middleware/errorHandler.js';
import { meanReviewScore, roundedMeanScores } from './review.rating.js';
import { reviewsRequireModeration } from '../settings/settings.service.js';
import { Review } from './review.model.js';
import type { CreateReviewBody } from './reviews.schemas.js';

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  );
}

type ListingStatusRow = { _id: Types.ObjectId; status: string };

async function resolveListingRef(
  listingRef: string,
): Promise<ListingStatusRow | null> {
  if (isMongoObjectId(listingRef)) {
    const doc = await Listing.findById(listingRef).select('_id status').lean();
    return doc as ListingStatusRow | null;
  }
  const doc = await Listing.findOne({ slug: listingRef })
    .select('_id status')
    .lean();
  return doc as ListingStatusRow | null;
}

async function notifyListingOwnerNewReview(
  listingId: string,
  reviewerUserId: string,
  ratingOverall: number,
): Promise<void> {
  try {
    const row = await Listing.findById(listingId).select('owner name slug').lean();
    if (!row || Array.isArray(row)) return;
    const typed = row as unknown as {
      owner: Types.ObjectId;
      name: { ar: string; en: string };
      slug: string;
    };
    const ownerId = String(typed.owner);
    if (ownerId === reviewerUserId) return;
    const name = typed.name;
    const slug = String(typed.slug);
    await createNotification({
      userId: ownerId,
      type: 'new_review',
      title: {
        ar: `تقييم جديد على «${name.ar}»`,
        en: `New review on «${name.en}»`,
      },
      body: {
        ar: `ورِد تقييم جديد على منشأتك «${name.ar}».`,
        en: `Someone left a new review on your listing «${name.en}».`,
      },
      metadata: { listingSlug: slug },
    });
    const emailUser = await loadEmailUserById(ownerId);
    if (emailUser) {
      const reviewer = await User.findById(reviewerUserId)
        .select('firstName lastName')
        .lean();
      const reviewerName = reviewer
        ? `${reviewer.firstName} ${reviewer.lastName}`.trim()
        : '';
      const listingName =
        emailUser.preferences.language === 'ar' ? name.ar : name.en;
      await sendNewReviewEmail(
        emailUser,
        listingName,
        ratingOverall,
        reviewerName,
      );
    }
  } catch (err) {
    console.error('notifyListingOwnerNewReview failed', err);
  }
}

export async function recalculateListingRatings(listingId: string): Promise<void> {
  const reviews = await Review.find({
    listing: listingId,
    status: 'approved',
  })
    .select('rating')
    .lean();

  const emptyBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  if (reviews.length === 0) {
    await Listing.updateOne(
      { _id: listingId },
      {
        $set: {
          averageRating: 0,
          totalReviews: 0,
          ratingBreakdown: emptyBreakdown,
        },
      },
    );
    return;
  }

  const perReviewMeans: number[] = [];
  const breakdown = { ...emptyBreakdown };

  for (const r of reviews) {
    const m = meanReviewScore(r.rating);
    perReviewMeans.push(m);
    const bucket = Math.min(5, Math.max(1, Math.round(r.rating.overall)));
    breakdown[bucket as 1 | 2 | 3 | 4 | 5] += 1;
  }

  const averageRating = roundedMeanScores(perReviewMeans);

  await Listing.updateOne(
    { _id: listingId },
    {
      $set: {
        averageRating,
        totalReviews: reviews.length,
        ratingBreakdown: breakdown,
      },
    },
  );
}

export async function listReviewsForListing(options: {
  listingRef: string;
  page: number;
  limit: number;
}): Promise<{
  reviews: unknown[];
  total: number;
  page: number;
  limit: number;
}> {
  const listing = await resolveListingRef(options.listingRef);
  if (!listing) {
    throw httpError(404, 'Listing not found');
  }

  const listingId = String(listing._id);
  const filter = { listing: listingId, status: 'approved' as const };
  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .sort({ createdAt: -1 })
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)
    .populate('user', 'firstName lastName avatar')
    .lean();

  return {
    reviews,
    total,
    page: options.page,
    limit: options.limit,
  };
}

export async function createReview(
  userId: string,
  body: CreateReviewBody,
): Promise<unknown> {
  const listing = await resolveListingRef(body.listing);
  if (!listing || listing.status !== 'active') {
    throw httpError(404, 'Listing not found');
  }

  const listingId = String(listing._id);
  const needsModeration = await reviewsRequireModeration();
  const initialStatus = needsModeration ? 'pending' : 'approved';

  try {
    const review = await Review.create({
      listing: listingId,
      user: userId,
      rating: body.rating,
      title: body.title,
      content: body.content,
      visitDate: body.visitDate,
      visitType: body.visitType,
      images: body.images ?? [],
      status: initialStatus,
    });
    if (initialStatus === 'approved') {
      await recalculateListingRatings(listingId);
    }
    await notifyListingOwnerNewReview(listingId, userId, body.rating.overall);
    const populated = await Review.findById(review._id)
      .populate('user', 'firstName lastName avatar')
      .lean();
    return populated;
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw httpError(409, 'You have already reviewed this listing');
    }
    throw err;
  }
}

export async function listReviewsForOwner(options: {
  ownerId: string;
  page: number;
  limit: number;
}): Promise<{
  reviews: unknown[];
  total: number;
  page: number;
  limit: number;
}> {
  const listings = await Listing.find({ owner: options.ownerId })
    .select('_id name slug')
    .lean();
  const ids = listings.map((l) => String(l._id));
  if (ids.length === 0) {
    return {
      reviews: [],
      total: 0,
      page: options.page,
      limit: options.limit,
    };
  }

  const listingMap = new Map(
    listings.map((l) => [
      String(l._id),
      { _id: String(l._id), slug: String(l.slug), name: l.name as { ar: string; en: string } },
    ]),
  );

  const filter = { listing: { $in: ids }, status: 'approved' as const };
  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .sort({ createdAt: -1 })
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)
    .populate('user', 'firstName lastName avatar')
    .lean();

  const enriched = reviews.map((r) => {
    const lid = String(r.listing);
    return {
      ...r,
      listingInfo: listingMap.get(lid) ?? { _id: lid, slug: '', name: { ar: '', en: '' } },
    };
  });

  return {
    reviews: enriched,
    total,
    page: options.page,
    limit: options.limit,
  };
}

export async function replyToReviewAsOwner(
  lang: AppLang,
  ownerId: string,
  reviewId: string,
  content: string,
): Promise<unknown> {
  if (!isMongoObjectId(reviewId)) {
    throw httpError(404, translate(lang, 'notFound'));
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw httpError(404, translate(lang, 'notFound'));
  }

  const listingRaw = await Listing.findById(review.listing).select('owner').lean();
  if (!listingRaw || Array.isArray(listingRaw)) {
    throw httpError(404, translate(lang, 'notFound'));
  }
  const listingDoc = listingRaw as unknown as { owner: Types.ObjectId };

  if (String(listingDoc.owner) !== ownerId) {
    throw httpError(403, translate(lang, 'forbidden'));
  }

  if (review.ownerReply) {
    throw httpError(409, translate(lang, 'validationError'));
  }

  review.ownerReply = {
    content: content.trim(),
    repliedAt: new Date(),
  };
  await review.save();

  const populated = await Review.findById(review._id)
    .populate('user', 'firstName lastName avatar')
    .lean();

  const listingRowRaw = await Listing.findById(review.listing).select('_id name slug').lean();
  const lid = String(review.listing);
  const listingInfo =
    listingRowRaw && !Array.isArray(listingRowRaw)
      ? (() => {
          const row = listingRowRaw as unknown as {
            slug: string;
            name: { ar: string; en: string };
          };
          return {
            _id: lid,
            slug: String(row.slug),
            name: row.name,
          };
        })()
      : { _id: lid, slug: '', name: { ar: '', en: '' } };

  return { ...(populated as object), listingInfo };
}
