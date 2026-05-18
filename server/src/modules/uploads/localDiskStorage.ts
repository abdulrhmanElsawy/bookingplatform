import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';

import { getEnv } from '../../config/env.js';

export function resolveUploadRoot(): string {
  const dir = getEnv().UPLOAD_DIR;
  return isAbsolute(dir) ? dir : resolve(process.cwd(), dir);
}

export function resolveListingsUploadDir(): string {
  return join(resolveUploadRoot(), 'listings');
}

export function getPublicUploadBaseUrl(): string | undefined {
  const raw = getEnv().PUBLIC_UPLOAD_BASE_URL;
  return raw?.replace(/\/$/, '');
}

export function buildPublicUploadUrl(publicId: string): string {
  const base = getPublicUploadBaseUrl();
  return base ? `${base}/uploads/${publicId}` : `/uploads/${publicId}`;
}

export async function ensureUploadDirs(): Promise<void> {
  await mkdir(resolveListingsUploadDir(), { recursive: true });
}

export async function saveListingWebp(
  buffer: Buffer,
): Promise<{ url: string; publicId: string }> {
  await ensureUploadDirs();
  const id = randomUUID();
  const publicId = `listings/${id}.webp`;
  const fullPath = join(resolveUploadRoot(), publicId);
  await writeFile(fullPath, buffer);
  const url = buildPublicUploadUrl(publicId);
  return { url, publicId };
}
