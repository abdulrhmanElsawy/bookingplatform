import sharp from 'sharp';

/**
 * Resize (max edge 1200px), rotate from EXIF, encode WebP quality 82.
 */
export async function processListingWebp(input: Buffer): Promise<Buffer> {
  if (!input || input.length === 0) {
    throw new Error('EMPTY_BUFFER');
  }
  return sharp(input)
    .rotate()
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}
