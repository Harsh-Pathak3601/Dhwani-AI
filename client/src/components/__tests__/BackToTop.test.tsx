import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import BackToTop from '../BackToTop';

describe('BackToTop Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollY = 0;
    window.scrollTo = vi.fn();
  });

  it('is hidden initially when scrollY is 0', () => {
    render(<BackToTop threshold={200} />);
    expect(screen.queryByRole('button', { name: /back to top/i })).not.toBeInTheDocument();
  });

  it('becomes visible when scrolled past threshold', () => {
    render(<BackToTop threshold={200} />);

    act(() => {
      window.scrollY = 350;
      window.dispatchEvent(new Event('scroll'));
    });

    const button = screen.getByRole('button', { name: /back to top/i });
    expect(button).toBeInTheDocument();
  });

  it('scrolls smoothly to top when clicked', () => {
    render(<BackToTop threshold={200} />);

    act(() => {
      window.scrollY = 500;
      window.dispatchEvent(new Event('scroll'));
    });

    const button = screen.getByRole('button', { name: /back to top/i });
    fireEvent.click(button);

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });
  });
});
