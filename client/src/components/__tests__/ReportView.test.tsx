import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportView from '../ReportView';
import { MemoryRouter } from 'react-router-dom';
import * as api from '../../services/api';
import * as pdfService from '../../services/reportPDF';
import { act } from '@testing-library/react';

const mockNavigate = vi.fn();
let mockLocationState: any = {};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
  };
});

vi.mock('../../services/api', () => ({
  reportToCommunityDB: vi.fn(),
}));

vi.mock('../../services/reportPDF', () => ({
  generatePDFReport: vi.fn(),
}));

describe('ReportView', () => {
  const mockReport = {
    callerNumber: '1234567890',
    peakRiskScore: 85,
    scamType: 'Tech Support Scam',
    summary: 'The caller asked for anydesk.',
    redFlags: ['Asked for anydesk', 'Urgency'],
    formalComplaintText: 'FIR TEXT',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (report: any) => {
    mockLocationState = { report };
    return render(
      <MemoryRouter>
        <ReportView />
      </MemoryRouter>
    );
  };

  it('navigates to / if no report is found', () => {
    vi.useFakeTimers();
    renderComponent(undefined);
    expect(screen.getByText('No report data found. Returning home...')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
    vi.useRealTimers();
  });

  it('renders report details', () => {
    renderComponent(mockReport);
    expect(screen.getByText('Incident Report')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Tech Support Scam')).toBeInTheDocument();
    expect(screen.getByText('The caller asked for anydesk.')).toBeInTheDocument();
    expect(screen.getByText('Asked for anydesk')).toBeInTheDocument();
    expect(screen.getByText('FIR TEXT')).toBeInTheDocument();
  });

  it('copies FIR text to clipboard', async () => {
    renderComponent(mockReport);
    const clipboardMock = { writeText: vi.fn() };
    Object.assign(navigator, { clipboard: clipboardMock });
    
    const copyBtn = screen.getByTitle('Copy to clipboard');
    fireEvent.click(copyBtn);
    
    expect(clipboardMock.writeText).toHaveBeenCalledWith('FIR TEXT');
  });

  it('downloads PDF and reports to DB', async () => {
    vi.useFakeTimers();
    renderComponent(mockReport);
    const downloadBtn = screen.getByRole('button', { name: /Download PDF Report/i });
    
    await act(async () => {
      fireEvent.click(downloadBtn);
    });
    
    expect(api.reportToCommunityDB).toHaveBeenCalledWith('1234567890', 85);
    expect(pdfService.generatePDFReport).toHaveBeenCalledWith(mockReport);
    
    expect(screen.getByText('Saved & Flagged in Community DB!')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    vi.useRealTimers();
  });

  it('opens portal on external link click', async () => {
    renderComponent(mockReport);
    const portalBtn = screen.getByRole('button', { name: /Report to Sanchar Saathi/i });
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    
    vi.useFakeTimers();
    fireEvent.click(portalBtn);
    
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(windowOpenSpy).toHaveBeenCalledWith('https://sancharsaathi.gov.in/sfc/Home/sfc-complaint.jsp', '_blank');
    vi.useRealTimers();
  });
});
