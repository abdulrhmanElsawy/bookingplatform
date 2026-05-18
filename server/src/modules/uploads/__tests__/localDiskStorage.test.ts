import { access, readFile } from 'node:fs/promises';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { loadEnv, resetEnvCache } from '../../../config/env.js';
import {
  resolveUploadRoot,
  saveListingWebp,
} from '../localDiskStorage.js';

describe('localDiskStorage', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'gw-upload-'));
    resetEnvCache();
    loadEnv({
      UPLOAD_DIR: tempDir,
      PUBLIC_UPLOAD_BASE_URL: 'http://localhost:4000',
    });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    resetEnvCache();
  });

  it('writes webp under listings and returns public url', async () => {
    const buffer = Buffer.from('fake-webp-bytes');
    const result = await saveListingWebp(buffer);

    expect(result.publicId).toMatch(/^listings\/[0-9a-f-]{36}\.webp$/);
    expect(result.url).toBe(`http://localhost:4000/uploads/${result.publicId}`);

    const fullPath = join(resolveUploadRoot(), result.publicId);
    await access(fullPath);
    const onDisk = await readFile(fullPath);
    expect(onDisk.equals(buffer)).toBe(true);
  });

  it('returns relative url when PUBLIC_UPLOAD_BASE_URL is unset', async () => {
    resetEnvCache();
    loadEnv({ UPLOAD_DIR: tempDir, PUBLIC_UPLOAD_BASE_URL: '' });
    const result = await saveListingWebp(Buffer.from('x'));
    expect(result.url).toBe(`/uploads/${result.publicId}`);
  });
});
