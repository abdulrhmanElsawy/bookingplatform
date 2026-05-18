import type { Response } from 'express';

import type { AppLang } from './i18n.types.js';
import { translate } from './i18n.js';

export function langFromRes(res: Response): AppLang {
  return res.locals.lang ?? 'ar';
}

export function tRes(
  res: Response,
  key: string,
  vars?: Record<string, string | number>,
): string {
  return translate(langFromRes(res), key, vars);
}
