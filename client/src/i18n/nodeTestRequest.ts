import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Custom i18next-http-backend `request` for Jest (Node): load JSON from `src/i18n/locales`
 * without relying on `fetch` / XHR in jsdom.
 */
export function resolveLocalesRootForTests(): string {
  const fromPkg = join(process.cwd(), 'src/i18n/locales');
  if (existsSync(fromPkg)) return fromPkg;
  const fromWs = join(process.cwd(), 'client/src/i18n/locales');
  if (existsSync(fromWs)) return fromWs;
  return fromPkg;
}

export function i18nextNodeRequest(
  _options: object,
  url: string,
  _payload: unknown,
  callback: (err: unknown, res?: { status: number; data: string }) => void,
): void {
  const m = String(url).match(/\/(ar|en)\/([\w-]+)\.json(?:\?|$)/);
  if (!m) {
    callback(null, { status: 404, data: '' });
    return;
  }
  const [, lng, ns] = m;
  const filePath = join(resolveLocalesRootForTests(), lng, `${ns}.json`);
  try {
    const data = readFileSync(filePath, 'utf8');
    callback(null, { status: 200, data });
  } catch {
    callback(null, { status: 404, data: '' });
  }
}
