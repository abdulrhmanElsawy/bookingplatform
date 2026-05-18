import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

export const ResendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const AccountTypeBodySchema = z.object({
  role: z.enum(['user', 'gym_owner']),
});

export const ChangePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Confirm password is required'),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmNewPassword'],
      });
    }
  });

export const PatchProfileBodySchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    phone: z.string().trim().max(40).optional(),
  })
  .refine(
    (v) =>
      v.firstName !== undefined ||
      v.lastName !== undefined ||
      v.phone !== undefined,
    { message: 'At least one field is required' },
  );

export const PatchPreferencesBodySchema = z
  .object({
    language: z.enum(['ar', 'en']).optional(),
    currency: z.string().trim().min(1).max(10).optional(),
    notifications: z
      .object({
        email: z.boolean().optional(),
        inApp: z.boolean().optional(),
      })
      .optional(),
  })
  .refine(
    (v) =>
      v.language !== undefined ||
      v.currency !== undefined ||
      (v.notifications !== undefined &&
        (v.notifications.email !== undefined ||
          v.notifications.inApp !== undefined)),
    { message: 'At least one preference field is required' },
  );
