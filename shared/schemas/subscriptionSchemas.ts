import { z } from 'zod';

export const SimulateVenueSubscriptionSchema = z.object({
  listingSlug: z.string().trim().min(1, 'Listing slug is required'),
  packageId: z.string().trim().min(1, 'Package is required'),
});

export const VerifyAccessCodeSchema = z.object({
  accessCode: z.string().trim().min(1, 'Access code is required'),
  listingId: z.string().trim().min(1).optional(),
});
