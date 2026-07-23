import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import i18n from '../../../../../i18n';
import { HelpPage } from '../HelpPage';
import * as supportApi from '../../../api/supportApi';

function renderHelpPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <HelpPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('HelpPage', () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    jest.restoreAllMocks();
  });

  it('renders FAQ accordion and contact form', async () => {
    renderHelpPage();
    expect(screen.getByTestId('help-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Help & support/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Frequently asked questions/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Contact us/i })).toBeInTheDocument();
    expect(screen.getByTestId('help-field-name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /How do I book a gym/i })).toBeInTheDocument();
  });

  it('shows success state after submit', async () => {
    jest.spyOn(supportApi, 'postSupportContact').mockResolvedValue();
    const user = userEvent.setup();
    renderHelpPage();

    await user.type(screen.getByTestId('help-field-name'), 'Jane Doe');
    await user.type(screen.getByTestId('help-field-email'), 'jane@example.com');
    await user.type(screen.getByTestId('help-field-subject'), 'Booking question');
    await user.type(
      screen.getByTestId('help-field-message'),
      'I need help completing my gym subscription checkout.',
    );
    await user.click(screen.getByTestId('help-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('help-contact-success')).toBeInTheDocument();
    });
    expect(supportApi.postSupportContact).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Jane Doe',
        email: 'jane@example.com',
        subject: 'Booking question',
      }),
    );
  });
});
