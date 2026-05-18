import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import i18n from '../../../../../i18n';
import { VenueCheckoutPage } from '../VenueCheckoutPage';

jest.mock('../../../../listings/api/listingsApi', () => ({
  fetchListingBySlug: jest.fn().mockResolvedValue({
    _id: 'listing1',
    slug: 'demo-gym',
    name: { ar: 'نادي', en: 'Demo Gym' },
    description: { ar: 'وصف', en: 'Desc' },
    shortDescription: { ar: 'قصير', en: 'Short' },
    location: {
      address: { ar: 'ع', en: 'a' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      district: { ar: 'حي', en: 'Dist' },
    },
    amenities: [],
    packages: [
      {
        _id: 'pkg1',
        name: { ar: 'شهري', en: 'Monthly' },
        description: { ar: 'وصف', en: 'Desc' },
        price: 99,
        duration: 'month',
        isActive: true,
      },
    ],
  }),
}));

jest.mock('../../../api/subscriptionsApi', () => ({
  postSimulateVenueSubscription: jest.fn().mockResolvedValue({
    id: 'sub1',
    accessCode: 'GW-TEST1234',
    status: 'active',
    amount: 99,
    currency: 'SAR',
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    packageSnapshot: {
      name: { ar: 'شهري', en: 'Monthly' },
      price: 99,
      currency: 'SAR',
      duration: 'month',
    },
    listing: { id: 'listing1', slug: 'demo-gym', name: { ar: 'نادي', en: 'Demo Gym' } },
    createdAt: new Date().toISOString(),
  }),
}));

function renderCheckout() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/listings/demo-gym/checkout?package=pkg1']}>
          <Routes>
            <Route path="/listings/:slug/checkout" element={<VenueCheckoutPage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('VenueCheckoutPage', () => {
  it('shows access code after simulated payment', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await waitFor(() => {
      expect(screen.getByTestId('checkout-card')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('checkout-card'), '4111');
    await user.type(screen.getByTestId('checkout-expiry'), '12/30');
    await user.type(screen.getByTestId('checkout-cvv'), '123');
    await user.click(screen.getByTestId('checkout-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('subscription-access-code')).toHaveTextContent('GW-TEST1234');
    });
  });
});
