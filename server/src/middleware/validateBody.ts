import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

import { tRes } from '../lib/i18nHttp.js';
import { httpError } from './errorHandler.js';

export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(httpError(400, tRes(res, 'validationError'), 'VALIDATION_ERROR'));
      return;
    }
    req.body = parsed.data as Request['body'];
    next();
  };
}
