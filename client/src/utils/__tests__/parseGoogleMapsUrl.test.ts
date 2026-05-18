import { isGoogleMapsUrlHost, parseGoogleMapsUrl } from '../parseGoogleMapsUrl';

describe('parseGoogleMapsUrl', () => {
  it('parses @lat,lng from place URL', () => {
    const result = parseGoogleMapsUrl(
      'https://www.google.com/maps/place/Gym/@24.7136,46.6753,17z',
    );
    expect(result?.lat).toBeCloseTo(24.7136, 4);
    expect(result?.lng).toBeCloseTo(46.6753, 4);
  });

  it('accepts short link host without coords', () => {
    expect(isGoogleMapsUrlHost('https://maps.app.goo.gl/abc123')).toBe(true);
    expect(parseGoogleMapsUrl('https://maps.app.goo.gl/abc123')).toBeNull();
  });
});
