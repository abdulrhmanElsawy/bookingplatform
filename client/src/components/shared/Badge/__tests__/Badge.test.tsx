import { render, screen } from '@testing-library/react';

import { Badge } from '../Badge';

describe('Badge', () => {
  it.each([
    ['featured', 'Featured'],
    ['deal', 'Deal'],
    ['score', '8.9'],
  ] as const)('renders %s variant with expected class', (variant, label) => {
    render(<Badge variant={variant}>{label}</Badge>);
    const el = screen.getByText(label);
    expect(el.className).toMatch(new RegExp(variant === 'score' ? 'score' : variant));
  });
});
