import {
  resolveListingImageUrls,
  SEED_IMAGES,
  buildListingImages,
} from '../seedMedia.js';
import { isImageUrlReachable } from '../repairListingImages.js';

describe('repairListingImages helpers', () => {
  it('resolveListingImageUrls prefers demo slug map', () => {
    const urls = resolveListingImageUrls(
      'gyms',
      { 'demo-gym': ['https://example.com/a.jpg'] },
      'demo-gym',
    );
    expect(urls).toEqual(['https://example.com/a.jpg']);
  });

  it('resolveListingImageUrls falls back to category set', () => {
    const urls = resolveListingImageUrls('padel', {}, 'custom-listing');
    expect(urls.length).toBeGreaterThan(0);
    expect(urls[0]).toBe(SEED_IMAGES.padel);
  });

  it('buildListingImages marks first as main', () => {
    const images = buildListingImages(
      [SEED_IMAGES.gym, SEED_IMAGES.gymAlt],
      { ar: 'صالة', en: 'Gym' },
    );
    expect(images[0]?.isMain).toBe(true);
    expect(images[1]?.isMain).toBe(false);
  });

  it('isImageUrlReachable rejects non-http URLs', async () => {
    await expect(isImageUrlReachable('not-a-url')).resolves.toBe(false);
    await expect(isImageUrlReachable('')).resolves.toBe(false);
  });
});
