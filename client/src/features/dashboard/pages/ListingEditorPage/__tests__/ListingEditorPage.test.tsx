import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { configurePublicEnv } from '../../../../../config/publicEnv';
import i18n from '../../../../../i18n';
import { useAuthStore } from '../../../../../store/authStore';
import { ListingEditorPage } from '../ListingEditorPage';

function jsonBody(body: object, ok = true, status = 200) {
  const text = JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => text,
  } as unknown as Response;
}

function renderEditor() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/owner/listings/new']}>
          <Routes>
            <Route path="/owner/listings/new" element={<ListingEditorPage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('ListingEditorPage', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
    globalThis.fetch = jest.fn();
    useAuthStore.getState().setSession({
      id: '1',
      email: 'g@example.com',
      firstName: 'G',
      lastName: 'O',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    (globalThis.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : String((input as Request).url ?? input);
      if (url.includes('/api/categories')) {
        return Promise.resolve(
          jsonBody({
            categories: [
              {
                _id: '507f1f77bcf86cd799439011',
                slug: 'gyms',
                name: { ar: 'أندية', en: 'Gyms' },
                isActive: true,
              },
            ],
          }),
        );
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    await i18n.changeLanguage('ar');
    document.documentElement.dir = 'rtl';
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    act(() => {
      useAuthStore.getState().clearSession();
    });
  });

  it('shows Arabic labels for bilingual name fields on step 1', async () => {
    renderEditor();
    expect(await screen.findByLabelText('اسم المنشأة بالعربية')).toBeInTheDocument();
    expect(screen.getByLabelText('اسم المنشأة بالإنجليزية')).toBeInTheDocument();
  });

  it('shows English labels when UI language is English', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    renderEditor();
    expect(await screen.findByLabelText('Venue name (Arabic)')).toBeInTheDocument();
    expect(screen.getByLabelText('Venue name (English)')).toBeInTheDocument();
  });

  it('marks both name fields as required', async () => {
    renderEditor();
    expect(await screen.findByLabelText('اسم المنشأة بالعربية')).toBeRequired();
    expect(screen.getByLabelText('اسم المنشأة بالإنجليزية')).toBeRequired();
  });

  async function advanceToStep2(user: ReturnType<typeof userEvent.setup>) {
    const category = await screen.findByLabelText('الفئة');
    await waitFor(() => expect(category).not.toBeDisabled());
    await user.click(category);
    await user.click(screen.getByRole('option', { name: 'أندية / Gyms' }));
    await user.type(screen.getByLabelText('اسم المنشأة بالعربية'), 'نادي');
    await user.type(screen.getByLabelText('اسم المنشأة بالإنجليزية'), 'Gym');
    await user.type(screen.getByLabelText('وصف مختصر بالعربية'), 'وصف');
    await user.type(screen.getByLabelText('وصف مختصر بالإنجليزية'), 'Desc');
    await user.click(screen.getByRole('button', { name: 'التالي' }));
  }

  async function advanceToStep3(user: ReturnType<typeof userEvent.setup>) {
    await advanceToStep2(user);
    await user.type(screen.getByLabelText('العنوان بالعربية'), 'شارع');
    await user.type(screen.getByLabelText('العنوان بالإنجليزية'), 'Street');
    await user.type(screen.getByLabelText('الحي بالعربية'), 'حي');
    await user.type(screen.getByLabelText('الحي بالإنجليزية'), 'Dist');
    await user.type(
      screen.getByTestId('listing-editor-maps-url'),
      'https://www.google.com/maps/@24.7136,46.6753,17z',
    );
    await user.click(screen.getByRole('button', { name: 'التالي' }));
    await screen.findByTestId('listing-editor-step3');
  }

  async function advanceToStep4(user: ReturnType<typeof userEvent.setup>) {
    await advanceToStep3(user);
    await user.type(screen.getByLabelText('الوصف بالعربية'), 'وصف طويل');
    await user.type(screen.getByLabelText('الوصف بالإنجليزية'), 'Long desc');
    await user.click(screen.getByRole('button', { name: 'التالي' }));
    await screen.findByTestId('listing-editor-step4');
  }

  it('step 2 shows Google Maps URL field instead of latitude/longitude', async () => {
    const user = userEvent.setup();
    renderEditor();
    await advanceToStep2(user);
    expect(await screen.findByTestId('listing-editor-step2')).toBeInTheDocument();
    expect(screen.getByTestId('listing-editor-maps-url')).toBeInTheDocument();
    expect(screen.queryByLabelText('خط العرض')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('خط الطول')).not.toBeInTheDocument();
  });

  it('step 4 shows opening hours controls', async () => {
    const user = userEvent.setup();
    renderEditor();
    await advanceToStep4(user);
    expect(screen.getByTestId('listing-editor-24h')).toBeInTheDocument();
    expect(screen.getByTestId('listing-editor-hours-preset')).toBeInTheDocument();
    expect(screen.getByTestId('listing-editor-hours-sunday')).toBeInTheDocument();
  });

  it('step 4 weekday preset fills open days with times', async () => {
    const user = userEvent.setup();
    renderEditor();
    await advanceToStep4(user);
    await user.click(screen.getByTestId('listing-editor-hours-preset'));
    const sundayRow = screen.getByTestId('listing-editor-hours-sunday');
    const openInput = sundayRow.querySelector('input[type="time"]') as HTMLInputElement;
    expect(openInput.value).toBe('06:00');
    const closeInputs = sundayRow.querySelectorAll('input[type="time"]');
    expect((closeInputs[1] as HTMLInputElement).value).toBe('22:00');
  });

  it('step 2 detects coordinates from a full Google Maps link', async () => {
    const user = userEvent.setup();
    renderEditor();
    await advanceToStep2(user);
    const mapsInput = await screen.findByTestId('listing-editor-maps-url');
    await user.type(
      mapsInput,
      'https://www.google.com/maps/@24.7136,46.6753,17z',
    );
    await waitFor(() => {
      expect(screen.getByTestId('maps-url-detected')).toBeInTheDocument();
    });
  });
});
