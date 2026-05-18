import {
  assertImageMagicBytes,
  assertProcessedSizeWithinLimit,
  MAX_PROCESSED_IMAGE_BYTES,
  sniffImageMime,
} from '../uploadValidation.js';

describe('uploadValidation magic bytes', () => {
  it('detects PNG', () => {
    const buf = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    expect(sniffImageMime(buf)).toBe('image/png');
    expect(() => assertImageMagicBytes(buf)).not.toThrow();
  });

  it('rejects script content', () => {
    const buf = Buffer.from('#!/bin/bash');
    expect(() => assertImageMagicBytes(buf)).toThrow();
  });

  it('enforces processed size cap', () => {
    const big = Buffer.alloc(MAX_PROCESSED_IMAGE_BYTES + 1);
    expect(() => assertProcessedSizeWithinLimit(big)).toThrow();
  });
});
