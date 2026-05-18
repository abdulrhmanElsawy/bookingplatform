import { Listing } from '../modules/listings/listing.model.js';
import { Review } from '../modules/reviews/review.model.js';

const GYM_REVIEWS: Array<{
  title: string;
  content: string;
  visitType: 'individual' | 'group' | 'family';
  rating: { overall: number; staff: number; cleanliness: number; facilities: number; value: number };
}> = [
  {
    title: 'صالة ممتازة ونظيفة',
    content: 'أجهزة حديثة وطاقم محترف. أنصح بها لمن يبحث عن تدريب جاد في العليا.',
    visitType: 'individual',
    rating: { overall: 5, staff: 5, cleanliness: 5, facilities: 5, value: 4 },
  },
  {
    title: 'Great gym, busy evenings',
    content: 'Well maintained equipment and friendly staff. Gets crowded after 6pm but worth it.',
    visitType: 'individual',
    rating: { overall: 4, staff: 4, cleanliness: 5, facilities: 4, value: 4 },
  },
  {
    title: 'مناسبة للعائلة',
    content: 'جربنا الدرس التجريبي مع الأطفال وكان ممتازاً. مواقف سيارات واسعة.',
    visitType: 'family',
    rating: { overall: 5, staff: 5, cleanliness: 4, facilities: 5, value: 5 },
  },
];

/**
 * Seeds approved demo reviews for the flagship gym listing.
 */
export async function seedDevReviews(reviewerIds: string[]): Promise<void> {
  const listing = await Listing.findOne({ slug: 'demo-iron-fitness-olaya' }).exec();
  if (!listing?._id) {
    return;
  }

  const visitDate = new Date('2025-11-01');

  for (let i = 0; i < GYM_REVIEWS.length && i < reviewerIds.length; i += 1) {
    const review = GYM_REVIEWS[i]!;
    const userId = reviewerIds[i]!;
    await Review.findOneAndUpdate(
      { listing: listing._id, user: userId },
      {
        $set: {
          listing: listing._id,
          user: userId,
          rating: review.rating,
          title: review.title,
          content: review.content,
          visitDate,
          visitType: review.visitType,
          isVerified: true,
          status: 'approved',
        },
      },
      { upsert: true, new: true },
    ).exec();
  }
}
