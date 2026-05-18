/** MIME types accepted before Sharp (which decodes JPEG/PNG/WebP/GIF, etc.). */
export const ALLOWED_UPLOAD_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const MAX_PROCESSED_IMAGE_BYTES = 1_000_000;

export function sniffImageMime(
  buffer: Buffer,
): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (!buffer || buffer.length < 3) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

export function assertImageMagicBytes(buffer: Buffer): void {
  if (!sniffImageMime(buffer)) {
    throw Object.assign(new Error('INVALID_IMAGE_BYTES'), {
      code: 'INVALID_IMAGE_BYTES',
    });
  }
}

export function assertProcessedSizeWithinLimit(buffer: Buffer): void {
  if (buffer.length > MAX_PROCESSED_IMAGE_BYTES) {
    throw Object.assign(new Error('IMAGE_TOO_LARGE'), { code: 'IMAGE_TOO_LARGE' });
  }
}

export function assertAllowedMime(mimetype: string | undefined): void {
  if (!mimetype || !ALLOWED_UPLOAD_MIMES.has(mimetype)) {
    throw Object.assign(new Error('UNSUPPORTED_MIME'), { code: 'UNSUPPORTED_MIME' });
  }
}
