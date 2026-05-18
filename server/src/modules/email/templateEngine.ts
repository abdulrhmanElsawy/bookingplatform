import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const PLACEHOLDER = /\{\{(\w+)\}\}/g;

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function resolveTemplatesDir(): string {
  const candidates = [
    path.join(process.cwd(), 'server', 'dist', 'modules', 'email', 'templates'),
    path.join(process.cwd(), 'server', 'src', 'modules', 'email', 'templates'),
    path.join(process.cwd(), 'dist', 'modules', 'email', 'templates'),
  ];
  for (const dir of candidates) {
    if (existsSync(path.join(dir, 'verification-code.ar.html'))) {
      return dir;
    }
  }
  throw new Error('Email templates directory not found');
}

export function renderTemplate(
  filename: string,
  vars: Record<string, string | number | undefined>,
): string {
  const dir = resolveTemplatesDir();
  const raw = readFileSync(path.join(dir, filename), 'utf8');
  return raw.replace(PLACEHOLDER, (_match, key: string) => {
    const value = vars[key];
    if (value === undefined || value === null) return '';
    const str = String(value);
    return escapeHtml(str);
  });
}
