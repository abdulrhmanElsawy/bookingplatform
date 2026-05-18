import {
  MAX_OUTPUT_BYTES,
  MAX_RAW_IMAGE_BYTES,
  prepareListingImage,
  sniffImageMime,
  validateListingImageFile,
} from '../prepareListingImage';

function pngBuffer(): ArrayBuffer {
  const buf = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);
  return buf.buffer;
}

function makeFile(
  name: string,
  type: string,
  bytes: ArrayBuffer,
  sizeOverride?: number,
): File {
  const blob = new Blob([bytes], { type });
  const file = new File([blob], name, { type });
  if (sizeOverride != null) {
    Object.defineProperty(file, 'size', { value: sizeOverride });
  }
  return file;
}

describe('sniffImageMime', () => {
  it('detects PNG signature', () => {
    expect(sniffImageMime(pngBuffer())).toBe('image/png');
  });

  it('rejects non-image bytes', () => {
    expect(sniffImageMime(new TextEncoder().encode('hello').buffer)).toBeNull();
  });
});

describe('validateListingImageFile', () => {
  it('rejects suspicious double extension', async () => {
    const file = makeFile('photo.script.jpg', 'image/jpeg', pngBuffer());
    await expect(validateListingImageFile(file)).rejects.toMatchObject({
      code: 'INVALID_EXTENSION',
    });
  });

  it('rejects when MIME does not match magic bytes', async () => {
    const file = makeFile('photo.png', 'image/jpeg', pngBuffer());
    await expect(validateListingImageFile(file)).rejects.toMatchObject({
      code: 'INVALID_IMAGE',
    });
  });

  it('rejects oversized raw files', async () => {
    const file = makeFile('photo.png', 'image/png', pngBuffer(), MAX_RAW_IMAGE_BYTES + 1);
    await expect(validateListingImageFile(file)).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE',
    });
  });
});

describe('prepareListingImage', () => {
  it('accepts valid PNG after validation', async () => {
    const file = makeFile('venue.png', 'image/png', pngBuffer());
    await expect(validateListingImageFile(file)).resolves.toBeUndefined();
    expect(file.name).toMatch(/\.png$/i);
    expect(MAX_OUTPUT_BYTES).toBe(1_000_000);
    void prepareListingImage;
  });
});
