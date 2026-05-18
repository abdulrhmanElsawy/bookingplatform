import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import i18n from '../../../../../i18n';
import { AdminLayout } from '../AdminLayout';

function mockAdminViewport(desktop: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: desktop && query.includes('960px'),
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

describe('AdminLayout', () => {
  beforeEach(() => {
    mockAdminViewport(true);
  });

  it('renders sidebar nav and outlet on desktop', async () => {
    await i18n.changeLanguage('en');
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<p>Child page</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );
    expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Admin navigation/i })).toBeInTheDocument();
    expect(screen.getByText('Child page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Listings/i })).toHaveAttribute('href', '/admin/listings');
    expect(screen.queryByTestId('admin-menu-toggle')).not.toBeInTheDocument();
  });

  it('opens mobile drawer from menu toggle', async () => {
    mockAdminViewport(false);
    await i18n.changeLanguage('en');
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/admin/listings']}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="listings" element={<p>Listings page</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );

    const toggle = screen.getByTestId('admin-menu-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Listings')).toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const drawer = screen.getByTestId('admin-mobile-drawer');
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByTestId('admin-drawer-backdrop')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Listings/i }).length).toBeGreaterThan(0);
  });

  it('shows drawer panel in RTL when open (not only backdrop)', async () => {
    mockAdminViewport(false);
    document.documentElement.setAttribute('dir', 'rtl');
    await i18n.changeLanguage('ar');
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<p>صفحة</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );

    await user.click(screen.getByTestId('admin-menu-toggle'));

    const drawer = screen.getByTestId('admin-mobile-drawer');
    expect(drawer.className).toMatch(/drawerOpen/);
    expect(screen.getByRole('link', { name: /الإعلانات/i })).toBeVisible();

    document.documentElement.setAttribute('dir', 'ltr');
    await i18n.changeLanguage('en');
  });
});
