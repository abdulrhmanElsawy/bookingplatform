import { getListYourGymPath } from '../useListYourGymPath';

describe('getListYourGymPath', () => {
  it('returns register for guests', () => {
    expect(getListYourGymPath(false)).toBe('/register');
  });

  it('returns new listing path for authenticated users', () => {
    expect(getListYourGymPath(true)).toBe('/owner/listings/new');
  });
});
