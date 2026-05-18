/**
 * Verifies Unsplash URLs used in the client return HTTP 2xx.
 * Run: npm run verify:media -w client
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'src');

const files = [
  join(srcRoot, 'features/home/data/categoryCoverImages.ts'),
  join(srcRoot, 'features/auth/data/authMedia.ts'),
  join(srcRoot, 'features/home/data/homeCities.ts'),
];

const urlPattern = /https:\/\/images\.unsplash\.com\/[^\s'"`]+/g;

function collectUrls() {
  const urls = new Set();
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(urlPattern)) {
      urls.add(match[0]);
    }
  }
  return [...urls];
}

async function checkUrl(url) {
  const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  if (!res.ok) {
    const getRes = await fetch(url, { method: 'GET', redirect: 'follow' });
    if (!getRes.ok) {
      throw new Error(`${getRes.status} ${getRes.statusText}`);
    }
  }
}

const urls = collectUrls();
let failed = 0;

for (const url of urls) {
  try {
    await checkUrl(url);
    console.log(`OK  ${url}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${url} — ${err.message}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} of ${urls.length} media URL(s) failed verification.`);
  process.exit(1);
}

console.log(`\nAll ${urls.length} media URL(s) OK.`);
