import { z } from 'zod';

import { BilingualFieldSchema } from './common.js';

export const ListingCreateSchema = z.object({
  name: BilingualFieldSchema,
  description: BilingualFieldSchema,
  city: BilingualFieldSchema,
  district: BilingualFieldSchema.optional(),
  categoryId: z.string().trim().min(1, 'Category is required'),
  priceFrom: z.coerce.number().nonnegative().optional(),
  priceTo: z.coerce.number().nonnegative().optional(),
  amenities: z.array(z.string().trim().min(1)).max(50).optional(),
});

export const ListingUpdateSchema = ListingCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' },
);

export const ListingSearchQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  city: z.string().trim().max(120).optional(),
  categoryId: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z
    .enum(['recommended', 'price_asc', 'price_desc', 'rating'])
    .default('recommended'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
