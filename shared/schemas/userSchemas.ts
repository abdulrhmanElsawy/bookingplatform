import { z } from 'zod';

import { LanguageSchema } from './common.js';

export const UserPreferencesSchema = z.object({
  language: LanguageSchema,
  currency: z.string().trim().length(3).optional(),
  notifications: z
    .object({
      email: z.boolean(),
      inApp: z.boolean(),
    })
    .partial()
    .optional(),
});

export const UserProfileUpdateSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s-]{8,20}$/, 'Invalid phone number')
      .optional(),
    avatarUrl: z.string().url().max(2048).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });
