import { z } from 'zod';

export const PaymentSimulatedStatusSchema = z.enum(['simulated', 'completed', 'failed']);

export const PaymentCheckoutSchema = z.object({
  listingId: z.string().trim().min(1, 'Listing is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().trim().length(3).default('SAR'),
  description: z.string().trim().max(500).optional(),
});

export const PaymentRefundSchema = z.object({
  transactionId: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional(),
});
