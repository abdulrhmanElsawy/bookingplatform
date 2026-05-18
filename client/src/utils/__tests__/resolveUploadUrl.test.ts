import { configurePublicEnv } from '../../config/publicEnv';
import { resolveUploadUrl } from '../resolveUploadUrl';

describe('resolveUploadUrl', () => {
  beforeEach(() => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
  });

  it('returns relative path for API-origin upload urls', () => {
    expect(
      resolveUploadUrl(
        'http://localhost:4000/uploads/listings/a87d072f-1e93-476a-840e-8fb645c78b7d.webp',
      ),
    ).toBe('/uploads/listings/a87d072f-1e93-476a-840e-8fb645c78b7d.webp');
  });

  it('passes through already-relative urls', () => {
    expect(resolveUploadUrl('/uploads/listings/x.webp')).toBe('/uploads/listings/x.webp');
  });

  it('passes through blob urls', () => {
    expect(resolveUploadUrl('blob:http://localhost:5173/abc')).toBe(
      'blob:http://localhost:5173/abc',
    );
  });
});
