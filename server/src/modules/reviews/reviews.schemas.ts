import { z } from 'zod';

import { REVIEW_VISIT_TYPES } from './review.model.js';

const visitTuple = REVIEW_VISIT_TYPES as unknown as [string, ...string[]];

const ratingSchema = z.object({
  overall: z.number().min(1).max(5),
  staff: z.number().min(1).max(5),
  cleanliness: z.number().min(1).max(5),
  facilities: z.number().min(1).max(5),
  value: z.number().min(1).max(5),
});

const reviewImageSchema = z.object({
  url: z.string().min(1),
  publicId: z.string().optional(),
});

export const CreateReviewBodySchema = z.object({
  listing: z.string().min(1),
  rating: ratingSchema,
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(8000),
  visitDate: z.coerce.date(),
  visitType: z.enum(visitTuple),
  images: z.array(reviewImageSchema).max(10).optional(),
});

export type CreateReviewBody = z.infer<typeof CreateReviewBodySchema>;

export const OwnerReplyBodySchema = z.object({
  content: z.string().min(1).max(8000),
});

export type OwnerReplyBody = z.infer<typeof OwnerReplyBodySchema>;
