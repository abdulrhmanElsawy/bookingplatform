import { formatDashboardInteger, formatDashboardRating } from '../formatDashboardNumber';

describe('formatDashboardInteger', () => {
  it('formats 120 with Arabic-Indic digits for Arabic', () => {
    expect(formatDashboardInteger(120, 'ar')).toMatch(/١٢٠/);
  });

  it('formats with Western digits for English', () => {
    expect(formatDashboardInteger(120, 'en')).toBe('120');
  });
});

describe('formatDashboardRating', () => {
  it('uses Arabic digits for rating in Arabic', () => {
    const s = formatDashboardRating(4.2, 'ar');
    expect(s).toMatch(/٤/);
    expect(s).toMatch(/٢/);
  });
});
