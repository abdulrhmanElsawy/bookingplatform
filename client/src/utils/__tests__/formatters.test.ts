import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelativeTime,
} from '../formatters';

describe('formatters', () => {
  const sampleDate = new Date(Date.UTC(2026, 4, 12, 12, 0, 0));

  it('formatNumber uses locale-appropriate digits', () => {
    const ar = formatNumber(1234, 'ar');
    const en = formatNumber(1234, 'en');
    expect(ar).not.toBe(en);
    expect(en).toMatch(/1,?234/);
  });

  it('formatCurrency marks SAR for ar and en', () => {
    const ar = formatCurrency(99, 'ar');
    const en = formatCurrency(99, 'en');
    expect(ar).toMatch(/ر\.س/);
    expect(en).toContain('SAR');
  });

  it('formatDate differs by language for the same instant', () => {
    const ar = formatDate(sampleDate, 'ar');
    const en = formatDate(sampleDate, 'en');
    expect(ar.length).toBeGreaterThan(0);
    expect(en.length).toBeGreaterThan(0);
    expect(ar).not.toBe(en);
  });

  it('formatRelativeTime returns a string for both langs', () => {
    const past = new Date(Date.now() - 3600_000);
    const ar = formatRelativeTime(past, 'ar');
    const en = formatRelativeTime(past, 'en');
    expect(ar.length).toBeGreaterThan(0);
    expect(en.length).toBeGreaterThan(0);
  });
});
