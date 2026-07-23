import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import i18n from '../../../../../i18n';
import { VerifyEmailPage } from '../VerifyEmailPage';

jest.mock('../../../api/authApi', () => ({
  postVerifyEmail: jest.fn(),
  postResendVerification: jest.fn(),
}));

jest.mock('../../../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { setSession: jest.Mock }) => unknown) =>
    selector({ setSession: jest.fn() }),
  mapApiUserToSession: jest.fn(() => null),
}));

jest.mock('../../../../../hooks/useLanguage', () => ({
  useLanguage: () => ({ switchLanguage: jest.fn() }),
}));

function renderPage(initialEntry = '/verify-email?email=test%40example.com') {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <VerifyEmailPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('VerifyEmailPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders with email from query string', () => {
    renderPage();
    expect(screen.getByTestId('verify-email-page')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('shows resend button on OTP step', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /resend code/i }));
    const { postResendVerification } = jest.requireMock('../../../api/authApi') as {
      postResendVerification: jest.Mock;
    };
    expect(postResendVerification).toHaveBeenCalledWith('test@example.com');
  });
});
