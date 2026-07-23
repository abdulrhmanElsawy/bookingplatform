import { cleanup, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { Header } from '../Header';
import { configurePublicEnv } from '../../../config/publicEnv';
import i18n from '../../../i18n';

function renderHeader() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

function mockWideViewport() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes('min-width'),
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

describe('Header notifications', () => {
  beforeEach(async () => {
    configurePublicEnv({ apiUrl: 'http://localhost:4000' });
    mockWideViewport();
    await i18n.changeLanguage('ar');
  });

  afterEach(() => {
    cleanup();
  });

  it('does not render a standalone notifications bell', () => {
    renderHeader();
    expect(screen.queryByTestId('header-notifications')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-notifications-badge')).not.toBeInTheDocument();
  });
});
