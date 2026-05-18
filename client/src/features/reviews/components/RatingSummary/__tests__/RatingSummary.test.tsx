import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import i18n from '../../../../../i18n';
import { RatingSummary } from '../RatingSummary';

describe('RatingSummary', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ar');
    document.documentElement.dir = 'rtl';
  });

  it('uses translated breakdown labels', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <RatingSummary
          averageRating={4.2}
          totalReviews={3}
          breakdown={{ '5': 1, '4': 1, '3': 1, '2': 0, '1': 0 }}
        />
      </I18nextProvider>,
    );
    expect(screen.getByTestId('rating-summary')).toBeInTheDocument();
    expect(screen.getAllByText(/ممتاز/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/جيد جداً/).length).toBeGreaterThan(0);
  });
});
