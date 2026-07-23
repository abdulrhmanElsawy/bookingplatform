import type { ContactSupportBody } from '@growth-world/shared';
import type { Request, Response } from 'express';

import { httpError } from '../../middleware/errorHandler.js';
import { sendSupportContactEmail } from './support.service.js';

export async function postContact(req: Request, res: Response): Promise<void> {
  const body = req.body as ContactSupportBody;
  if (body.website && body.website.length > 0) {
    throw httpError(400, 'Invalid submission', 'SPAM_REJECTED');
  }

  const lang = req.lang === 'en' ? 'en' : 'ar';
  await sendSupportContactEmail(body, lang);
  res.status(200).json({ ok: true });
}
