import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
    firstName: z.string().trim().min(1, 'First name is required').max(80),
    lastName: z.string().trim().min(1, 'Last name is required').max(80),
    phone: z.string().trim().max(30).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
    if (data.phone && data.phone.length > 0) {
      if (!/^\+?[0-9\s-]{8,20}$/.test(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid phone number',
          path: ['phone'],
        });
      }
    }
  });

export const OtpVerifySchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  code: z
    .string()
    .trim()
    .regex(/^[0-9]{4,8}$/, 'Invalid verification code'),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const PasswordResetConfirmSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    code: z
      .string()
      .trim()
      .regex(/^[0-9]{4,8}$/, 'Invalid reset code'),
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

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
