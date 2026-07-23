import { z } from 'zod';

export const ContactSupportBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(0).optional(),
});

export type ContactSupportBody = z.infer<typeof ContactSupportBodySchema>;
