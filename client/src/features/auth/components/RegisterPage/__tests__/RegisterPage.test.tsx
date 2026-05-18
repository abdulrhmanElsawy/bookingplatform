import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { configurePublicEnv } from '../../../../../config/publicEnv';
import { RegisterPage } from '../RegisterPage';
import i18n from '../../../../../i18n';

function jsonResponse(body: object, ok: boolean, status: number) {
  const text = JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => text,
  } as unknown as Response;
}

function renderRegister() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('RegisterPage', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
    await i18n.changeLanguage('ar');
    document.documentElement.dir = 'rtl';
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows Arabic labels on step 1', async () => {
    renderRegister();
    expect(screen.getByText('إنشاء حساب جديد')).toBeInTheDocument();
    expect(screen.getByLabelText('الاسم الأول')).toBeInTheDocument();
    expect(screen.getByLabelText('البريد الإلكتروني')).toBeInTheDocument();
  });

  it('shows English labels when language is English', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.dir = 'ltr';
    renderRegister();
    expect(screen.getByText('Create a new account')).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toBeInTheDocument();
  });

  it('advances to step 2 after successful register', async () => {
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
            isEmailVerified: false,
          },
        },
        true,
        201,
      ),
    );

    renderRegister();

    await user.type(screen.getByLabelText('الاسم الأول'), 'Ahmad');
    await user.type(screen.getByLabelText('اسم العائلة'), 'Ali');
    await user.type(screen.getByLabelText('البريد الإلكتروني'), 'u@example.com');
    await user.type(screen.getByLabelText('كلمة المرور'), 'password12');
    await user.type(screen.getByLabelText('تأكيد كلمة المرور'), 'password12');
    await user.click(screen.getByRole('button', { name: 'التالي' }));

    await waitFor(() => {
      expect(screen.getByTestId('otp-input')).toBeInTheDocument();
    });
    expect(globalThis.fetch).toHaveBeenCalled();
  });
});
