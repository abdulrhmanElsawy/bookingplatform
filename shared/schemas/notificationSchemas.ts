import { z } from 'zod';

export const NotificationTypeSchema = z.enum([
  'booking',
  'review',
  'listing_status',
  'payment',
  'system',
]);

export const NotificationCreateSchema = z.object({
  userId: z.string().trim().min(1),
  type: NotificationTypeSchema,
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(2000),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const NotificationMarkReadSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1).max(100),
});
