import mongoose from 'mongoose';

import type { ListingStatus } from '../listings/listing.model.js';
import { Listing } from '../listings/listing.model.js';
import { Review } from '../reviews/review.model.js';

export type OwnerListingRowDto = {
  _id: string;
  slug: string;
  name: { ar: string; en: string };
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: { ar: string; en: string };
  category: { slug: string; name: { ar: string; en: string } } | null;
  thumbnailUrl?: string;
};

export type OwnerOverviewDto = {
  totalViews: number;
  totalContactClicks: number;
  activeListings: number;
  totalListings: number;
  avgRating: number;
  pendingReviews: number;
  /** Reserved for monthly analytics when view events exist; currently mirrors totalViews. */
  viewsThisMonth: number;
  /** Month-over-month change for views; null when not computed. */
  viewsChangePercent: number | null;
};

export async function getOwnerOverview(ownerId: string): Promise<OwnerOverviewDto> {
  const ownerOid = new mongoose.Types.ObjectId(ownerId);

  const [agg] = await Listing.aggregate<{
    totalViews: number;
    totalContactClicks: number;
    activeListings: number;
    totalListings: number;
    weightedRatingSum: number;
    totalReviewCount: number;
  }>([
    { $match: { owner: ownerOid } },
    {
      $group: {
        _id: null,
        totalViews: { $sum: { $ifNull: ['$views', 0] } },
        totalContactClicks: { $sum: { $ifNull: ['$contactClicks', 0] } },
        activeListings: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        totalListings: { $sum: 1 },
        weightedRatingSum: {
          $sum: {
            $multiply: [
              { $ifNull: ['$averageRating', 0] },
              { $ifNull: ['$totalReviews', 0] },
            ],
          },
        },
        totalReviewCount: { $sum: { $ifNull: ['$totalReviews', 0] } },
      },
    },
  ]);

  if (!agg) {
    return {
      totalViews: 0,
      totalContactClicks: 0,
      activeListings: 0,
      totalListings: 0,
      avgRating: 0,
      pendingReviews: 0,
      viewsThisMonth: 0,
      viewsChangePercent: null,
    };
  }

  const listingIds = await Listing.find({ owner: ownerOid }).distinct('_id');
  let pendingReviews = 0;
  if (listingIds.length > 0) {
    pendingReviews = await Review.countDocuments({
      listing: { $in: listingIds },
      status: 'approved',
      ownerReply: { $exists: false },
    });
  }

  const avgRating =
    agg.totalReviewCount > 0
      ? Math.round((agg.weightedRatingSum / agg.totalReviewCount) * 10) / 10
      : 0;

  const totalViews = agg.totalViews ?? 0;

  return {
    totalViews,
    totalContactClicks: agg.totalContactClicks ?? 0,
    activeListings: agg.activeListings ?? 0,
    totalListings: agg.totalListings ?? 0,
    avgRating,
    pendingReviews,
    viewsThisMonth: totalViews,
    viewsChangePercent: null,
  };
}

export async function getOwnerListings(ownerId: string): Promise<OwnerListingRowDto[]> {
  const ownerOid = new mongoose.Types.ObjectId(ownerId);
  const rows = await Listing.find({ owner: ownerOid })
    .sort({ updatedAt: -1 })
    .populate('category', 'slug name')
    .select('slug name status createdAt updatedAt rejectionReason images category')
    .lean();

  return rows.map((doc) => {
    const cat = doc.category as
      | { slug: string; name: { ar: string; en: string } }
      | null
      | undefined;
    const images = doc.images as { url: string; isMain?: boolean; order?: number }[] | undefined;
    const thumb =
      images?.find((img) => img.isMain)?.url ??
      images?.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]?.url;

    return {
      _id: String(doc._id),
      slug: String(doc.slug),
      name: doc.name as { ar: string; en: string },
      status: doc.status as ListingStatus,
      createdAt: new Date(doc.createdAt as Date).toISOString(),
      updatedAt: new Date(doc.updatedAt as Date).toISOString(),
      ...(doc.rejectionReason
        ? {
            rejectionReason: doc.rejectionReason as { ar: string; en: string },
          }
        : {}),
      category: cat
        ? { slug: cat.slug, name: cat.name }
        : null,
      ...(thumb ? { thumbnailUrl: thumb } : {}),
    };
  });
}
