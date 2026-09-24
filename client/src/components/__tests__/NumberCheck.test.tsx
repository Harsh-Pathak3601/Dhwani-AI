import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NumberCheck from '../NumberCheck';
import { BrowserRouter } from 'react-router-dom';
import * as api from '../../services/api';
import { useSessionStore } from '../../store/useSessionStore';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../store/useSessionStore', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  checkCommunityDB: vi.fn(),
}));

describe('NumberCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (callerNumber = '', setCallerNumber = vi.fn()) => {
    (useSessionStore as any).mockReturnValue({
      callerNumber,
      setCallerNumber,
    });
    return render(
      <BrowserRouter>
        <NumberCheck />
      </BrowserRouter>
    );
  };

  it('renders input field and disabled button initially', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('+91 98765 43210')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('enables the button when a valid number is entered', () => {
    renderComponent('9876543210');
    expect(screen.getByRole('button', { name: /Check & Protect/i })).not.toBeDisabled();
  });

  it('formats the phone number correctly as the user types', () => {
    const setCallerNumberMock = vi.fn();
    renderComponent('', setCallerNumberMock);
    const input = screen.getByPlaceholderText('+91 98765 43210');
    
    // Standard 10-digit
    fireEvent.change(input, { target: { value: '9876543210' } });
    expect(setCallerNumberMock).toHaveBeenCalledWith('98765 43210');
    
    // +91 Country Code
    fireEvent.change(input, { target: { value: '+919876543210' } });
    expect(setCallerNumberMock).toHaveBeenCalledWith('+91 98765 43210');
  });

  it('navigates to /consent if number is safe', async () => {
    (api.checkCommunityDB as any).mockResolvedValue({ flagged: false, reportsCount: 0 });
    renderComponent('9876543210');
    
    fireEvent.click(screen.getByRole('button', { name: /Check & Protect/i }));
    
    await waitFor(() => {
      expect(api.checkCommunityDB).toHaveBeenCalledWith('9876543210');
      expect(mockNavigate).toHaveBeenCalledWith('/consent');
    });
  });

  it('displays warning if number is flagged', async () => {
    (api.checkCommunityDB as any).mockResolvedValue({ flagged: true, reportsCount: 5 });
    renderComponent('9876543210');
    
    fireEvent.click(screen.getByRole('button', { name: /Check & Protect/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Community Warning')).toBeInTheDocument();
      expect(screen.getByText('This number has been reported 5 times for suspicious activity.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Check & Protect/i })).not.toBeInTheDocument();
    });
    
    const proceedBtn = screen.getByRole('button', { name: /Proceed with Protection/i });
    expect(proceedBtn).toBeInTheDocument();
    fireEvent.click(proceedBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/consent');
  });
});
