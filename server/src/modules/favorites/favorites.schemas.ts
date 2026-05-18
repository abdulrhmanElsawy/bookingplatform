import { z } from 'zod';

export const FavoriteListingBodySchema = z.object({
  listing: z.string().min(1),
});

export type FavoriteListingBody = z.infer<typeof FavoriteListingBodySchema>;
