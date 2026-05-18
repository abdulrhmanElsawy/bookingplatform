import type { NextFunction, Request, Response } from 'express';

import type { AppLang } from '../lib/i18n.types.js';

function resolveLang(header: string | undefined): AppLang {
  if (!header || typeof header !== 'string') return 'ar';
  const first = header.split(',')[0]?.trim().toLowerCase() ?? '';
  return first.startsWith('en') ? 'en' : 'ar';
}

export function languageMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const lang = resolveLang(req.headers['accept-language']);
  req.lang = lang;
  res.locals.lang = lang;
  next();
}
