import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { AppLang } from './i18n.types.js';

export type { AppLang } from './i18n.types.js';

function resolveI18nDir(): string {
  const candidates = [
    path.join(process.cwd(), 'server', 'src', 'i18n'),
    path.join(process.cwd(), 'src', 'i18n'),
    path.join(process.cwd(), 'server', 'dist', 'i18n'),
    path.join(process.cwd(), 'dist', 'i18n'),
  ];
  for (const dir of candidates) {
    if (existsSync(path.join(dir, 'ar.json'))) {
      return dir;
    }
  }
  throw new Error('Cannot resolve server i18n directory (ar.json not found)');
}

const i18nDir = resolveI18nDir();

function loadJson(file: string): Record<string, string> {
  const full = path.join(i18nDir, file);
  return JSON.parse(readFileSync(full, 'utf8')) as Record<string, string>;
}

const messages: Record<AppLang, Record<string, string>> = {
  ar: loadJson('ar.json'),
  en: loadJson('en.json'),
};

export function interpolate(
  template: string,
  vars: Record<string, string | number> = {},
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : '',
  );
}

export function translate(
  lang: AppLang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const table = messages[lang] ?? messages.ar;
  const raw = table[key] ?? messages.ar[key] ?? key;
  return vars ? interpolate(raw, vars) : raw;
}
