import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { translate } from '../../lib/i18n.js';
import { httpError } from '../../middleware/errorHandler.js';
import { processListingWebp } from './imagePipeline.js';
import { saveListingWebp } from './localDiskStorage.js';
import {
  assertAllowedMime,
  assertImageMagicBytes,
  assertProcessedSizeWithinLimit,
} from './uploadValidation.js';

const AltFieldsSchema = z.object({
  altAr: z.string().min(1),
  altEn: z.string().min(1),
});

export function asyncUploadHandler(
  fn: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    void fn(req, res).catch(next);
  };
}

export const postListingImage = asyncUploadHandler(async (req, res) => {
  const lang = req.lang;

  if (!req.file?.buffer) {
    throw httpError(400, translate(lang, 'validationError'));
  }

  try {
    assertAllowedMime(req.file.mimetype);
    assertImageMagicBytes(req.file.buffer);
  } catch {
    throw httpError(400, translate(lang, 'validationError'));
  }

  const parsed = AltFieldsSchema.safeParse({
    altAr: req.body?.altAr,
    altEn: req.body?.altEn,
  });
  if (!parsed.success) {
    throw httpError(400, translate(lang, 'validationError'));
  }

  let webp: Buffer;
  try {
    webp = await processListingWebp(req.file.buffer);
    assertProcessedSizeWithinLimit(webp);
  } catch {
    throw httpError(400, translate(lang, 'validationError'));
  }

  let uploaded: { url: string; publicId: string };
  try {
    uploaded = await saveListingWebp(webp);
  } catch {
    throw httpError(500, translate(lang, 'serverError'));
  }

  res.status(201).json({
    image: {
      url: uploaded.url,
      publicId: uploaded.publicId,
      alt: { ar: parsed.data.altAr, en: parsed.data.altEn },
    },
  });
});
