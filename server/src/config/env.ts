import { z } from 'zod';

function emptyToUndefined(value: unknown): unknown {
  if (value === '' || value === undefined) return undefined;
  return value;
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CLIENT_ORIGIN: z
    .string()
    .min(1, 'CLIENT_ORIGIN is required (comma-separated allowed)'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().min(3).optional(),
  SUPPORT_EMAIL: z
    .string()
    .email()
    .default('support@growth-world.local'),
  UPLOAD_DIR: z.string().min(1).default('./uploads'),
  /** Empty = relative `/uploads/...` (use Vite proxy in local dev). */
  PUBLIC_UPLOAD_BASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().optional(),
  ),
  CLOUDINARY_CLOUD_NAME: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  CLOUDINARY_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  CLOUDINARY_API_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  CLOUDINARY_UPLOAD_FOLDER: z
    .preprocess(emptyToUndefined, z.string().min(1).optional())
    .default('growth-world'),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function loadEnv(overrides: Record<string, string | undefined> = {}): Env {
  const merged = { ...process.env, ...overrides };
  cached = EnvSchema.parse(merged);
  process.env.NODE_ENV = cached.NODE_ENV;
  return cached;
}

export function getEnv(): Env {
  if (!cached) {
    cached = EnvSchema.parse(process.env);
  }
  return cached;
}

export function resetEnvCache(): void {
  cached = null;
}
