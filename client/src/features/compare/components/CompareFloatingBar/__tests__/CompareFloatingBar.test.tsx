import { cleanup, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import i18n from '../../../../../i18n';
import { useCompareStore, type CompareItem } from '../../../compareStore';
import { CompareFloatingBar } from '../CompareFloatingBar';

const sampleItem = {
  slug: 'test-gym',
  name: { ar: 'نادٍ', en: 'Test Gym' },
  location: { city: { ar: 'الرياض', en: 'Riyadh' } },
  amenities: ['wifi'],
  packages: [{ price: 199 }],
  totalReviews: 10,
  averageRating: 4.5,
} satisfies CompareItem;

function renderBar(pathname = '/') {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[pathname]}>
        <CompareFloatingBar />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('CompareFloatingBar', () => {
  afterEach(() => {
    cleanup();
    useCompareStore.getState().clear();
  });

  it('is hidden when compare list is empty', () => {
    renderBar();
    expect(screen.queryByTestId('compare-floating-bar')).not.toBeInTheDocument();
  });

  it('shows bar with CTA when items are selected', () => {
    useCompareStore.getState().addItem(sampleItem);

    renderBar();
    expect(screen.getByTestId('compare-floating-bar')).toBeInTheDocument();
    expect(screen.getByTestId('compare-floating-bar-cta')).toHaveAttribute('href', '/compare');
  });

  it('is hidden on the compare page', () => {
    useCompareStore.getState().addItem(sampleItem);

    renderBar('/compare');
    expect(screen.queryByTestId('compare-floating-bar')).not.toBeInTheDocument();
  });
});
