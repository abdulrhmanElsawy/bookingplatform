import { z } from 'zod';

export const BilingualFieldSchema = z.object({
  ar: z.string().min(1, 'Arabic text required'),
  en: z.string().min(1, 'English text required'),
});

export const LanguageSchema = z.enum(['ar', 'en']);

export const PaginationCursorSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
