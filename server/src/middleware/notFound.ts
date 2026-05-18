import type { Request, Response } from 'express';

import { tRes } from '../lib/i18nHttp.js';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: tRes(res, 'notFound'),
    },
  });
}
