import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConsentBanner from '../ConsentBanner';
import { BrowserRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ConsentBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ConsentBanner />
      </BrowserRouter>
    );
  };

  it('renders disabled confirm button initially', () => {
    renderComponent();
    expect(screen.getByText('Accept terms to continue')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Accept terms to continue/i });
    expect(btn).toBeDisabled();
  });

  it('enables the button when checkbox is toggled', () => {
    renderComponent();
    const checkboxBtn = screen.getByRole('button', { name: /I acknowledge and agree/i });
    
    fireEvent.click(checkboxBtn);
    
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Start Recording/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  it('navigates to /session on confirm', () => {
    renderComponent();
    const checkboxBtn = screen.getByRole('button', { name: /I acknowledge and agree/i });
    fireEvent.click(checkboxBtn);
    
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Start Recording/i });
    fireEvent.click(confirmBtn);
    
    expect(mockNavigate).toHaveBeenCalledWith('/session');
  });
});
