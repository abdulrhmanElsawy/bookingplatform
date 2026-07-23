import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import { configurePublicEnv } from '../../../../config/publicEnv';
import i18n from '../../../../i18n';
import { HomePage } from '../HomePage';

function jsonBody(body: object, ok = true, status = 200) {
  const text = JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => text,
  } as unknown as Response;
}

function mockHomeFetches() {
  (globalThis.fetch as jest.Mock).mockImplementation((input: RequestInfo) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('/api/categories')) {
      return Promise.resolve(jsonBody({ categories: [] }));
    }
    if (url.includes('/api/listings/featured')) {
      return Promise.resolve(jsonBody({ listings: [] }));
    }
    if (url.includes('/api/listings')) {
      return Promise.resolve(jsonBody({ listings: [], total: 0, page: 1, limit: 10 }));
    }
    return Promise.reject(new Error(`unexpected fetch: ${url}`));
  });
}

function renderHome() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
    globalThis.fetch = jest.fn();
    await i18n.changeLanguage('ar');
    document.documentElement.dir = 'rtl';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows hero search with Arabic placeholder in AR mode', async () => {
    mockHomeFetches();
    renderHome();
    expect(await screen.findByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByText('اكتشف أفضل الخدمات الرياضية')).toBeInTheDocument();
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByLabelText('المدينة')).toHaveAttribute(
      'placeholder',
      'المدينة أو المنطقة',
    );
  });

  it('shows last-minute deals slider with Arabic title and nav in AR mode', async () => {
    mockHomeFetches();
    renderHome();
    await screen.findByTestId('home-page');
    expect(screen.getByTestId('home-deals-section')).toBeInTheDocument();
    expect(screen.getByTestId('deals-slider')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'عروض اللحظة الأخيرة' })).toBeInTheDocument();
    expect(screen.getByTestId('deals-slider-prev')).toHaveAccessibleName('السابق');
    expect(screen.getByTestId('deals-slider-next')).toHaveAccessibleName('التالي');
  });

  it('marks non-live browse categories as coming soon without links', async () => {
    (globalThis.fetch as jest.Mock).mockImplementation((input: RequestInfo) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/categories')) {
        return Promise.resolve(
          jsonBody({
            categories: [
              {
                _id: '1',
                slug: 'gyms',
                name: { ar: 'أندية', en: 'Gyms' },
                isBookable: true,
              },
              {
                _id: '2',
                slug: 'padel',
                name: { ar: 'بادل', en: 'Padel' },
                isBookable: false,
              },
            ],
          }),
        );
      }
      if (url.includes('/api/listings/featured')) {
        return Promise.resolve(jsonBody({ listings: [] }));
      }
      if (url.includes('/api/listings')) {
        return Promise.resolve(jsonBody({ listings: [], total: 0, page: 1, limit: 10 }));
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    renderHome();
    await screen.findByTestId('home-page');
    expect(await screen.findByRole('link', { name: 'أندية' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'بادل' })).not.toBeInTheDocument();
    expect(screen.getAllByText('قريباً').length).toBeGreaterThan(0);
  });

  it('shows city names in Arabic when language is Arabic', async () => {
    mockHomeFetches();
    renderHome();
    await screen.findByTestId('home-cities');
    expect(screen.getByRole('link', { name: 'الرياض' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'جدة' })).toBeInTheDocument();
  });

  it('shows city names in English when language is English', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    mockHomeFetches();
    renderHome();
    await screen.findByTestId('home-cities');
    expect(screen.getByRole('link', { name: 'Riyadh' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jeddah' })).toBeInTheDocument();
  });
});
