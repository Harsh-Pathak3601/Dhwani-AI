import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CallSession from '../CallSession';
import { BrowserRouter } from 'react-router-dom';
import * as useSessionHook from '../../hooks/useSession';
import { act } from '@testing-library/react';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../TranscriptFeed', () => ({
  default: () => <div data-testid="transcript-feed" />
}));
vi.mock('../RiskIndicator', () => ({
  default: () => <div data-testid="risk-indicator" />
}));
vi.mock('../CoachingCard', () => ({
  default: ({ onDismiss, coaching }: any) => (
    <div data-testid="coaching-card">
      {coaching}
      <button data-testid="dismiss-coaching" onClick={onDismiss}>Dismiss</button>
    </div>
  )
}));
vi.mock('../VolumeMonitor', () => ({
  default: () => <div data-testid="volume-monitor" />
}));

describe('CallSession', () => {
  const mockStartSession = vi.fn();
  const mockEndSession = vi.fn();

  const defaultSessionState: ReturnType<typeof useSessionHook.useSession> = {
    startSession: mockStartSession,
    endSession: mockEndSession,
    isRecording: false,
    sessionActive: true,
    transcript: '',
    riskData: { risk: 0, signal: '', coaching: '', peakRiskScore: 0, phase: 'demand' },
    reportResult: null,
    permissionError: null,
    isConnected: true,
    sessionId: 'test-session-id',
    livenessResult: null,
    voiceStage1: {
      vas: 8,
      confidence: 'insufficient',
      artifacts: [],
      model: 'heuristic',
      processingTimeMs: 0,
    },
    voiceStage2: {
      speakerDeviation: null,
      profileStatus: 'no_profile',
      similarity: null,
      impersonationRisk: 10,
      urgencyFlag: false,
      transactionKeywords: [],
      signal: 'Listening for voiceprint & conversational cues',
      recommendedVerification: 'Monitoring',
    },
    voiceRiskState: {
      state: 'Low',
      index: 8,
      explanation: ['Call monitoring initialized. Signal within expected baseline.'],
      recommendedAction: '',
      isConsequential: false,
      requiresHold: false,
    },
    activeHold: null,
    activeChallenge: null,
    respondToLiveness: vi.fn(),
    resolveOOBAction: vi.fn(),
    dismissHold: vi.fn(),
    runDemoAttack: vi.fn(),
    isDemoAttackRunning: false,
    evidenceAnchor: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useSessionHook, 'useSession').mockReturnValue(defaultSessionState);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderComponent = () => render(
    <BrowserRouter>
      <CallSession />
    </BrowserRouter>
  );

  it('starts session when start call button is clicked', () => {
    vi.spyOn(useSessionHook, 'useSession').mockReturnValue({
      ...defaultSessionState,
      sessionActive: false,
    });
    renderComponent();
    const startButton = screen.getByRole('button', { name: /Start call/i });
    fireEvent.click(startButton);
    expect(mockStartSession).toHaveBeenCalled();
  });

  it('renders permission error if present', () => {
    vi.spyOn(useSessionHook, 'useSession').mockReturnValue({
      ...defaultSessionState,
      permissionError: 'Microphone access denied',
    });
    renderComponent();
    expect(screen.getByText('Microphone Required')).toBeInTheDocument();
    expect(screen.getByText(/Microphone access denied/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: /Go Back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders main components during call', () => {
    renderComponent();
    expect(screen.getByText('Monitoring Call')).toBeInTheDocument();
    expect(screen.getByTestId('transcript-feed')).toBeInTheDocument();
    expect(screen.getByTestId('risk-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('volume-monitor')).toBeInTheDocument();
  });

  it('updates timer when recording', () => {
    vi.spyOn(useSessionHook, 'useSession').mockReturnValue({
      ...defaultSessionState,
      isRecording: true,
    });
    renderComponent();
    
    expect(screen.getByText('00:00')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(screen.getByText('00:02')).toBeInTheDocument();
  });

  it('shows coaching card when risk >= 40', () => {
    vi.spyOn(useSessionHook, 'useSession').mockReturnValue({
      ...defaultSessionState,
      riskData: { risk: 50, signal: 'urgent_payment', coaching: 'Do not pay', peakRiskScore: 50 },
    });
    renderComponent();
    
    expect(screen.getByTestId('coaching-card')).toBeInTheDocument();
    expect(screen.getByText('Do not pay')).toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId('dismiss-coaching'));
    expect(screen.queryByTestId('coaching-card')).not.toBeInTheDocument();
  });

  it('navigates to home when safe report result is returned', () => {
    vi.spyOn(useSessionHook, 'useSession').mockReturnValue({
      ...defaultSessionState,
      reportResult: { safe: true, report: null as any },
    });
    renderComponent();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to report view when unsafe report result is returned', () => {
    const mockReport = { summary: 'scam' };
    vi.spyOn(useSessionHook, 'useSession').mockReturnValue({
      ...defaultSessionState,
      reportResult: { safe: false, report: mockReport as any },
    });
    renderComponent();
    expect(mockNavigate).toHaveBeenCalledWith('/report', { state: { report: mockReport } });
  });

  it('calls endSession when end button is clicked', () => {
    renderComponent();
    const endButton = screen.getByRole('button', { name: /End call/i });
    fireEvent.click(endButton);
    expect(mockEndSession).toHaveBeenCalled();
  });
});
