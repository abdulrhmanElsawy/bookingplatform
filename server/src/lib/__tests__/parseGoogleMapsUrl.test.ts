import {
  isGoogleMapsUrlHost,
  isWithinSaudiBounds,
  parseGoogleMapsUrl,
} from '../parseGoogleMapsUrl.js';
import { resolveGoogleMapsUrl } from '../resolveGoogleMapsUrl.js';

describe('parseGoogleMapsUrl', () => {
  it('parses @lat,lng from google maps place URL', () => {
    const result = parseGoogleMapsUrl(
      'https://www.google.com/maps/place/Test/@24.7136,46.6753,17z',
    );
    expect(result).not.toBeNull();
    expect(result?.lat).toBeCloseTo(24.7136, 4);
    expect(result?.lng).toBeCloseTo(46.6753, 4);
  });

  it('parses q=lat,lng query', () => {
    const result = parseGoogleMapsUrl('https://maps.google.com/?q=24.7136,46.6753');
    expect(result?.lat).toBeCloseTo(24.7136, 4);
    expect(result?.lng).toBeCloseTo(46.6753, 4);
  });

  it('parses !3d!4d format', () => {
    const result = parseGoogleMapsUrl(
      'https://www.google.com/maps/place/x/@24.0,46.0,15z/data=!3d24.5!4d46.5',
    );
    expect(result?.lat).toBeCloseTo(24.5, 4);
    expect(result?.lng).toBeCloseTo(46.5, 4);
  });

  it('rejects non-google hosts', () => {
    expect(parseGoogleMapsUrl('https://example.com/@24.7,46.6')).toBeNull();
  });

  it('detects allowed google maps hosts', () => {
    expect(isGoogleMapsUrlHost('https://maps.app.goo.gl/abc')).toBe(true);
    expect(isGoogleMapsUrlHost('https://evil.com/maps')).toBe(false);
  });
});

describe('isWithinSaudiBounds', () => {
  it('returns true for Riyadh coords', () => {
    expect(isWithinSaudiBounds(24.7136, 46.6753)).toBe(true);
  });
});

describe('resolveGoogleMapsUrl', () => {
  it('follows short link redirect and parses final URL', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      url: 'https://www.google.com/maps/place/Test/@24.7136,46.6753,17z',
    });
    const result = await resolveGoogleMapsUrl(
      'https://maps.app.goo.gl/short123',
      fetchMock as unknown as typeof fetch,
    );
    expect(fetchMock).toHaveBeenCalled();
    expect(result?.lat).toBeCloseTo(24.7136, 4);
    expect(result?.lng).toBeCloseTo(46.6753, 4);
  });
});
