import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import { configurePublicEnv } from '../../../../../config/publicEnv';
import i18n from '../../../../../i18n';
import { SearchPage } from '../SearchPage';

function jsonBody(body: object, ok = true, status = 200) {
  const text = JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => text,
  } as unknown as Response;
}

function mockFetchListings(listings: object[]) {
  (globalThis.fetch as jest.Mock).mockImplementation((input: RequestInfo) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('/api/categories')) {
      return Promise.resolve(
        jsonBody({
          categories: [
            {
              _id: '1',
              slug: 'gyms',
              name: { ar: 'الأندية', en: 'Gyms' },
            },
          ],
        }),
      );
    }
    if (url.includes('/api/listings')) {
      return Promise.resolve(
        jsonBody({
          listings,
          total: listings.length,
          page: 1,
          limit: 12,
        }),
      );
    }
    return Promise.reject(new Error(`unexpected fetch: ${url}`));
  });
}

function mockViewport(desktop: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: desktop && query.includes('900px'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

function renderSearchPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/listings']}>
          <SearchPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('SearchPage', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
    globalThis.fetch = jest.fn();
    mockViewport(false);
    await i18n.changeLanguage('ar');
    document.documentElement.dir = 'rtl';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens mobile filter sheet from toolbar button', async () => {
    mockFetchListings([]);
    const user = userEvent.setup();
    renderSearchPage();
    await screen.findByTestId('search-page');
    const toggle = screen.getByTestId('search-filters-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('search-filters-sheet').className).toMatch(/filterSheetOpen/);
    expect(screen.getByTestId('search-filters-backdrop').className).toMatch(
      /filterSheetBackdropVisible/,
    );
  });

  it('shows Arabic filter labels', async () => {
    mockFetchListings([]);
    renderSearchPage();
    await screen.findByTestId('search-page');
    expect(screen.getByText('نطاق السعر')).toBeInTheDocument();
    expect(screen.getAllByText('الفئة').length).toBeGreaterThan(0);
    expect(screen.getByText('فلاتر شائعة')).toBeInTheDocument();
  });

  it('shows English filter labels', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    mockFetchListings([]);
    renderSearchPage();
    await screen.findByTestId('search-page');
    expect(screen.getByText('Price range')).toBeInTheDocument();
    expect(screen.getAllByText('Category').length).toBeGreaterThan(0);
    expect(screen.getByText('Popular filters')).toBeInTheDocument();
  });

  it('renders listing name in Arabic when language is Arabic', async () => {
    await i18n.changeLanguage('ar');
    mockFetchListings([
      {
        _id: 'x1',
        slug: 'test-gym',
        name: { ar: 'نادي الاختبار الخاص', en: 'Test Gym Club' },
        location: { city: { ar: 'الرياض', en: 'Riyadh' } },
        amenities: ['wifi'],
        packages: [{ price: 100 }],
        totalReviews: 3,
        averageRating: 4,
      },
    ]);
    renderSearchPage();
    await screen.findByTestId('search-results');
    expect(screen.getByText('نادي الاختبار الخاص')).toBeInTheDocument();
  });

  it('renders listing name in English when language is English', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    mockFetchListings([
      {
        _id: 'x1',
        slug: 'test-gym',
        name: { ar: 'نادي الاختبار الخاص', en: 'Test Gym Club' },
        location: { city: { ar: 'الرياض', en: 'Riyadh' } },
        amenities: ['wifi'],
        packages: [{ price: 100 }],
        totalReviews: 3,
        averageRating: 4,
      },
    ]);
    renderSearchPage();
    await screen.findByTestId('search-results');
    expect(screen.getByText('Test Gym Club')).toBeInTheDocument();
  });

  it('exposes translated sort options in Arabic', async () => {
    mockFetchListings([]);
    const user = userEvent.setup();
    renderSearchPage();
    await screen.findByTestId('search-page');
    const sort = screen.getByLabelText('ترتيب حسب');
    expect(sort).toBeInTheDocument();
    await user.click(sort);
    expect(screen.getByRole('option', { name: 'الأكثر صلة' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'الأعلى تقييماً' })).toBeInTheDocument();
  });

  it('exposes translated sort options in English', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    mockFetchListings([]);
    const user = userEvent.setup();
    renderSearchPage();
    await screen.findByTestId('search-page');
    const sort = screen.getByLabelText('Sort by');
    await user.click(sort);
    expect(screen.getByRole('option', { name: 'Most relevant' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Top rated' })).toBeInTheDocument();
  });
});
