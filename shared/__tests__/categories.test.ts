import { isCategoryLive, LIVE_CATEGORY_SLUGS } from '../types/categories.js';

describe('isCategoryLive', () => {
  it('returns true for gyms slug', () => {
    expect(isCategoryLive('gyms')).toBe(true);
    expect(isCategoryLive('Gyms')).toBe(true);
  });

  it('returns false for non-live slugs', () => {
    expect(isCategoryLive('padel')).toBe(false);
    expect(isCategoryLive('restaurants')).toBe(false);
  });

  it('exports gyms as the only live slug', () => {
    expect(LIVE_CATEGORY_SLUGS).toEqual(['gyms']);
  });
});
