import { cpSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientRoot = join(__dirname, '..');
const srcLocales = join(clientRoot, 'src/i18n/locales');
const destRoot = join(clientRoot, 'public/locales');

for (const lang of readdirSync(srcLocales)) {
  const langPath = join(srcLocales, lang);
  if (!statSync(langPath).isDirectory()) continue;
  const destLang = join(destRoot, lang);
  mkdirSync(destLang, { recursive: true });
  cpSync(langPath, destLang, { recursive: true });
}

console.info('Synced src/i18n/locales → public/locales');
