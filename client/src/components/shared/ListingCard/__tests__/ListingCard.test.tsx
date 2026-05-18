import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import i18n from '../../../../i18n';
import { ListingCard } from '../ListingCard';
import type { ListingCardData } from '../ListingCard';

const baseListing: ListingCardData = {
  slug: 'hero-gym',
  name: { ar: 'صالة الأبطال', en: 'Hero Gym' },
  location: { city: { ar: 'الرياض', en: 'Riyadh' } },
  amenities: ['wifi', 'parking', 'pool'],
  packages: [{ price: 299 }],
  totalReviews: 12,
  averageRating: 4.5,
  images: [
    {
      url: 'https://example.com/gym.webp',
      alt: { ar: 'الواجهة', en: 'Front desk' },
      isMain: true,
    },
  ],
  isVerified: true,
};

async function renderCard(listing: ListingCardData, lang: 'ar' | 'en') {
  await i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <ListingCard listing={listing} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('ListingCard', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ar');
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  });

  it('renders Arabic name and city in AR mode', async () => {
    await renderCard(baseListing, 'ar');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('صالة الأبطال');
    expect(screen.getByTestId('listing-card-location')).toHaveTextContent('الرياض');
  });

  it('renders English name and city in EN mode', async () => {
    await i18n.changeLanguage('en');
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <ListingCard listing={baseListing} />
        </MemoryRouter>
      </I18nextProvider>,
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Hero Gym');
    expect(screen.getByTestId('listing-card-location')).toHaveTextContent('Riyadh');
    expect(screen.getByTestId('listing-card')).toHaveAttribute('dir', 'ltr');
  });

  it('sets dir rtl on the card root when language is Arabic', async () => {
    document.documentElement.dir = 'rtl';
    const { container } = await renderCard(baseListing, 'ar');
    const card = container.querySelector('[data-testid="listing-card"]');
    expect(card).toHaveAttribute('dir', 'rtl');
  });

  it('renders skeleton variant without listing data', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <ListingCard skeleton />
        </MemoryRouter>
      </I18nextProvider>,
    );
    const card = screen.getByTestId('listing-card');
    expect(card).toHaveAttribute('data-variant', 'skeleton');
    expect(card.className).toMatch(/skeleton/);
  });
});
