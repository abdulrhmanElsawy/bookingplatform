import sharp from 'sharp';

import { processListingWebp } from '../imagePipeline.js';
import { assertAllowedMime } from '../uploadValidation.js';

describe('processListingWebp', () => {
  it('compresses to WebP with max edge 1200px', async () => {
    const wide = await sharp({
      create: { width: 2000, height: 800, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer();

    const out = await processListingWebp(wide);
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBeLessThanOrEqual(1200);
    expect(meta.height).toBeLessThanOrEqual(1200);
  });

  it('does not upscale small images', async () => {
    const small = await sharp({
      create: { width: 400, height: 300, channels: 3, background: 'blue' },
    })
      .jpeg()
      .toBuffer();

    const out = await processListingWebp(small);
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBeLessThanOrEqual(400);
    expect(meta.height).toBeLessThanOrEqual(300);
  });

  it('rejects empty buffer', async () => {
    await expect(processListingWebp(Buffer.alloc(0))).rejects.toThrow();
  });

  it('rejects invalid image bytes', async () => {
    await expect(processListingWebp(Buffer.from('not-a-real-image'))).rejects.toThrow();
  });
});

describe('assertAllowedMime', () => {
  it('accepts common image MIME types', () => {
    expect(() => assertAllowedMime('image/jpeg')).not.toThrow();
    expect(() => assertAllowedMime('image/png')).not.toThrow();
    expect(() => assertAllowedMime('image/webp')).not.toThrow();
  });

  it('rejects unsupported MIME types', () => {
    expect(() => assertAllowedMime('application/pdf')).toThrow();
    expect(() => assertAllowedMime(undefined)).toThrow();
  });
});
