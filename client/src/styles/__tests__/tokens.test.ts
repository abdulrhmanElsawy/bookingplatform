/** @jest-environment jsdom */

describe('design tokens on :root', () => {
  beforeAll(() => {
    const root = document.documentElement;
    root.setAttribute('data-lang', 'en');
    const tokens: Record<string, string> = {
      '--page-bg': '#0b0d0e',
      '--card-bg': '#1a1c1e',
      '--header-bg': '#0b0d0e',
      '--search-bar-border': '#82c91e',
      '--search-btn-bg': '#82c91e',
      '--text-link': '#82c91e',
      '--text-deal': '#82c91e',
      '--badge-score-bg': '#82c91e',
      '--btn-primary-text': '#0b0d0e',
      '--filter-width': '240px',
      '--container-max': '1200px',
    };
    for (const [name, value] of Object.entries(tokens)) {
      root.style.setProperty(name, value);
    }
  });

  const expected: Record<string, string> = {
    '--page-bg': '#0b0d0e',
    '--card-bg': '#1a1c1e',
    '--header-bg': '#0b0d0e',
    '--search-bar-border': '#82c91e',
    '--search-btn-bg': '#82c91e',
    '--text-link': '#82c91e',
    '--text-deal': '#82c91e',
    '--badge-score-bg': '#82c91e',
    '--btn-primary-text': '#0b0d0e',
    '--filter-width': '240px',
    '--container-max': '1200px',
  };

  it.each(Object.entries(expected))('defines %s', (name, value) => {
    const styles = getComputedStyle(document.documentElement);
    expect(styles.getPropertyValue(name).trim().toLowerCase()).toBe(value.toLowerCase());
  });
});
