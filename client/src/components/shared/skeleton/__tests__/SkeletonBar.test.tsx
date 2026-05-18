import { cleanup, render, screen } from '@testing-library/react';

import { SkeletonBar } from '../SkeletonBar';

describe('SkeletonBar', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders full-width bar by default', () => {
    render(<SkeletonBar data-testid="sk-bar" />);
    const el = screen.getByTestId('sk-bar');
    expect(el.className).toMatch(/bar/);
    expect(el.className).not.toMatch(/barShort/);
    expect(el.className).not.toMatch(/barMedium/);
  });

  it('applies short and medium width variants', () => {
    const { rerender } = render(<SkeletonBar variant="short" data-testid="sk-bar" />);
    expect(screen.getByTestId('sk-bar').className).toMatch(/barShort/);
    rerender(<SkeletonBar variant="medium" data-testid="sk-bar" />);
    expect(screen.getByTestId('sk-bar').className).toMatch(/barMedium/);
  });
});
