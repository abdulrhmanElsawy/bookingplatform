import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import { configurePublicEnv } from '../../../../../config/publicEnv';
import i18n from '../../../../../i18n';
import { useAuthStore } from '../../../../../store/authStore';
import { LoginPage } from '../LoginPage';

function jsonResponse(body: object, ok: boolean, status: number) {
  const text = JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => text,
  } as unknown as Response;
}

describe('LoginPage', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
    await i18n.changeLanguage('ar');
    document.documentElement.dir = 'rtl';
    useAuthStore.getState().clearSession();
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('switches app language to English when user preference is en', async () => {
    const user = userEvent.setup();
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(
        {
          message: 'ok',
          user: {
            id: '1',
            email: 'u@example.com',
            firstName: 'A',
            lastName: 'B',
            role: 'user',
            isEmailVerified: true,
            preferences: {
              language: 'en',
              currency: 'SAR',
              notifications: { email: true, inApp: true },
            },
          },
        },
        true,
        200,
      ),
    );

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div data-testid="post-login-home">ok</div>} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );

    await user.type(screen.getByLabelText('البريد الإلكتروني'), 'u@example.com');
    await user.type(screen.getByLabelText('كلمة المرور'), 'password12');
    await user.click(screen.getByRole('button', { name: 'دخول' }));

    await waitFor(() => {
      expect(i18n.language.startsWith('en')).toBe(true);
    });
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
