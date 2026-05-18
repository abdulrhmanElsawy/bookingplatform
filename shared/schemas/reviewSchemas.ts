import { z } from 'zod';

export const ReviewCreateSchema = z.object({
  listingId: z.string().trim().min(1, 'Listing is required'),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(10, 'Review must be at least 10 characters').max(4000),
});

export const ReviewReplySchema = z.object({
  reviewId: z.string().trim().min(1, 'Review is required'),
  body: z.string().trim().min(1, 'Reply is required').max(2000),
});
