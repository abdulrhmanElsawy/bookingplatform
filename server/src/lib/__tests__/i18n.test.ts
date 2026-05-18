import { interpolate, translate } from '../i18n';

describe('server i18n', () => {
  it('interpolates template variables', () => {
    const s = interpolate('Hello {{name}}', { name: 'Growth' });
    expect(s).toBe('Hello Growth');
  });

  it('translates accountLocked with minutes in Arabic', () => {
    const s = translate('ar', 'accountLocked', { minutes: 5 });
    expect(s).toContain('5');
    expect(s.length).toBeGreaterThan(5);
  });
});
