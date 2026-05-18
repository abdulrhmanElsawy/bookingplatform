import { render, screen } from '@testing-library/react';

import { StarRating } from '../StarRating';

describe('StarRating', () => {
  it('renders with size class', () => {
    render(<StarRating value={4} size="lg" data-testid="stars" />);
    expect(screen.getByTestId('stars').className).toMatch(/lg/);
  });

  it('exposes rating in aria-label', () => {
    render(<StarRating value={3.5} max={5} data-testid="stars" />);
    expect(screen.getByTestId('stars')).toHaveAttribute('aria-label', '3.5 / 5');
  });
});
