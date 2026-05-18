import { z } from 'zod';

import { USER_ROLES } from '../users/user.model.js';

const roleTuple = USER_ROLES as unknown as [string, ...string[]];

export const AdminPatchUserBodySchema = z
  .object({
    isActive: z.boolean().optional(),
    role: z.enum(roleTuple).optional(),
  })
  .strict()
  .refine((v) => v.isActive !== undefined || v.role !== undefined, {
    message: 'At least one of isActive or role is required',
  });

export type AdminPatchUserBody = z.infer<typeof AdminPatchUserBodySchema>;

const bilingualBlock = z.object({
  ar: z.string().trim().min(1).max(200),
  en: z.string().trim().min(1).max(200),
});

const bilingualMessage = z.object({
  ar: z.string().trim().min(1).max(4000),
  en: z.string().trim().min(1).max(4000),
});

export const AdminBroadcastBodySchema = z
  .object({
    scope: z.enum(['all', 'role']),
    role: z.enum(roleTuple).optional(),
    title: bilingualBlock,
    body: bilingualMessage,
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.scope === 'role' && val.role === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['role'],
        message: 'role is required when scope is role',
      });
    }
  });

export type AdminBroadcastBody = z.infer<typeof AdminBroadcastBodySchema>;

const bilingualReq = z.object({
  ar: z.string().trim().min(1).max(200),
  en: z.string().trim().min(1).max(200),
});

const bilingualOpt = z.object({
  ar: z.string().trim().max(2000).optional(),
  en: z.string().trim().max(2000).optional(),
});

const listingStatusTuple = ['draft', 'pending', 'active', 'rejected', 'suspended'] as const;

export const AdminPatchListingBodySchema = z
  .object({
    status: z.enum(listingStatusTuple).optional(),
    rejectionReason: bilingualOpt.optional(),
    isFeatured: z.boolean().optional(),
    isPremium: z.boolean().optional(),
    isVerified: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.status !== undefined ||
      v.isFeatured !== undefined ||
      v.isPremium !== undefined ||
      v.isVerified !== undefined,
    { message: 'At least one field is required' },
  );

export type AdminPatchListingBody = z.infer<typeof AdminPatchListingBodySchema>;

export const AdminPatchReviewStatusBodySchema = z.object({
  status: z.enum(['approved', 'rejected']),
  moderationNote: bilingualOpt.optional(),
});

export type AdminPatchReviewStatusBody = z.infer<typeof AdminPatchReviewStatusBodySchema>;

const slugPattern = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const AdminCreateCategoryBodySchema = z
  .object({
    name: bilingualReq,
    slug: slugPattern,
    image: z.string().trim().max(2000).optional(),
    order: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    seoTitle: bilingualOpt.optional(),
    seoDescription: bilingualOpt.optional(),
  })
  .strict();

export type AdminCreateCategoryBody = z.infer<typeof AdminCreateCategoryBodySchema>;

export const AdminPatchCategoryBodySchema = z
  .object({
    name: bilingualReq.optional(),
    slug: slugPattern.optional(),
    image: z.string().trim().max(2000).optional().nullable(),
    order: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    seoTitle: bilingualOpt.optional(),
    seoDescription: bilingualOpt.optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' });

export type AdminPatchCategoryBody = z.infer<typeof AdminPatchCategoryBodySchema>;

export const AdminPatchSubscriptionBodySchema = z.object({
  status: z.enum(['active', 'cancelled']),
});

export type AdminPatchSubscriptionBody = z.infer<typeof AdminPatchSubscriptionBodySchema>;

export const AdminPatchSiteSettingsBodySchema = z
  .object({
    maintenanceMode: z.boolean().optional(),
    allowRegistration: z.boolean().optional(),
    reviewsRequireModeration: z.boolean().optional(),
    defaultLanguage: z.enum(['ar', 'en']).optional(),
    announcementBanner: bilingualOpt.nullable().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' });

export type AdminPatchSiteSettingsBody = z.infer<typeof AdminPatchSiteSettingsBodySchema>;
