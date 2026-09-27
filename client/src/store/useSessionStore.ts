import { create } from 'zustand';

export interface RiskData {
  risk: number;
  signal: string;
  phase?: 'intro' | 'allegation' | 'intimidation' | 'demand';
  coaching: string;
  peakRiskScore: number;
}

export interface VoiceStage1Data {
  vas: number; // 0-100 Voice Authenticity Score
  confidence: 'sufficient' | 'insufficient';
  artifacts: string[];
  model: 'heuristic' | 'aasist' | 'wav2vec2_xlsr';
  processingTimeMs: number;
  details?: {
    pitchJitter: number;
    spectralSmoothness: number;
    mfccSmoothness: number;
    pauseUniformity: number;
    breathIndex: number;
  };
}

export interface VoiceStage2Data {
  speakerDeviation: number | null;
  profileStatus: 'consistent' | 'deviated' | 'no_profile';
  similarity: number | null;
  impersonationRisk: number;
  urgencyFlag: boolean;
  transactionKeywords: string[];
  signal: string;
  recommendedVerification: string;
}

export type VoicePolicyState = 'Insufficient Evidence' | 'Low' | 'Suspicious' | 'High' | 'Critical';

export interface VoiceRiskState {
  state: VoicePolicyState;
  index: number;
  explanation: string[];
  recommendedAction: string;
  isConsequential: boolean;
  requiresHold: boolean;
}

export interface ActiveHoldData {
  transactionRef: string;
  reason: string;
  heldAmount: string;
  oobId: string;
  targetDevice?: string;
  status: 'held' | 'prevented' | 'cleared';
  timestamp?: string | Date;
}

export interface LivenessChallengeData {
  challengeId: string;
  type: 'phonetic' | 'semantic' | 'temporal';
  prompt: string;
  expectedToken: string;
  timeLimitSec: number;
}

export interface LivenessResultData {
  passed: boolean;
  score: number;
  latencyMs: number;
  notes: string;
}

export interface ReportResult {
  safe?: boolean;
  report?: {
    callerNumber: string;
    peakRiskScore: number;
    finalRiskScore?: number;
    livenessScore?: number | null;
    scamType: string;
    summary: string;
    redFlags: string[];
    formalComplaintText: string;
    createdAt?: number | string | Date;
  };
}

interface SessionState {
  callerNumber: string;
  setCallerNumber: (number: string) => void;
  sessionActive: boolean;
  setSessionActive: (active: boolean) => void;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  transcript: string;
  setTranscript: (text: string) => void;
  riskData: RiskData;
  setRiskData: (data: RiskData) => void;
  reportResult: ReportResult | null;
  setReportResult: (result: ReportResult | null) => void;

  // VoiceShield 3-Stage State
  voiceStage1: VoiceStage1Data;
  setVoiceStage1: (data: VoiceStage1Data) => void;
  voiceStage2: VoiceStage2Data;
  setVoiceStage2: (data: VoiceStage2Data) => void;
  voiceRiskState: VoiceRiskState;
  setVoiceRiskState: (data: VoiceRiskState) => void;
  activeHold: ActiveHoldData | null;
  setActiveHold: (hold: ActiveHoldData | null) => void;
  activeChallenge: LivenessChallengeData | null;
  setActiveChallenge: (challenge: LivenessChallengeData | null) => void;
  livenessResult: LivenessResultData | null;
  setLivenessResult: (result: LivenessResultData | null) => void;
  evidenceAnchor: { recordId: string; evidenceHash: string; ledgerAnchorBlock: number } | null;
  setEvidenceAnchor: (anchor: { recordId: string; evidenceHash: string; ledgerAnchorBlock: number } | null) => void;
  isDemoAttackRunning: boolean;
  setIsDemoAttackRunning: (running: boolean) => void;
  speechLanguage: string;
  setSpeechLanguage: (lang: string) => void;
}

const getSavedCallerNumber = (): string => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('guardcall_caller_number') || '';
    } catch {
      return '';
    }
  }
  return '';
};

export const useSessionStore = create<SessionState>((set) => ({
  callerNumber: getSavedCallerNumber(),
  setCallerNumber: (number) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('guardcall_caller_number', number);
      } catch {
        // Ignore localStorage quota/security errors
      }
    }
    set({ callerNumber: number });
  },
  sessionActive: false,
  setSessionActive: (active) => set({ sessionActive: active }),
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),
  transcript: '',
  setTranscript: (text) => set({ transcript: text }),
  riskData: { risk: 0, signal: '', phase: 'intro', coaching: '', peakRiskScore: 0 },
  setRiskData: (data) => set({ riskData: data }),
  reportResult: null,
  setReportResult: (result) => set({ reportResult: result }),

  // VoiceShield Default State
  voiceStage1: {
    vas: 0,
    confidence: 'insufficient',
    artifacts: [],
    model: 'heuristic',
    processingTimeMs: 0
  },
  setVoiceStage1: (data) => set({ voiceStage1: data }),

  voiceStage2: {
    speakerDeviation: null,
    profileStatus: 'no_profile',
    similarity: null,
    impersonationRisk: 0,
    urgencyFlag: false,
    transactionKeywords: [],
    signal: 'Awaiting incoming voice stream',
    recommendedVerification: 'Monitoring'
  },
  setVoiceStage2: (data) => set({ voiceStage2: data }),

  voiceRiskState: {
    state: 'Low',
    index: 0,
    explanation: ['Call monitoring in standby. Awaiting voice input.'],
    recommendedAction: 'Start call to begin real-time acoustic analysis.',
    isConsequential: false,
    requiresHold: false
  },
  setVoiceRiskState: (data) => set({ voiceRiskState: data }),

  activeHold: null,
  setActiveHold: (hold) => set({ activeHold: hold }),

  activeChallenge: null,
  setActiveChallenge: (challenge) => set({ activeChallenge: challenge }),

  livenessResult: null,
  setLivenessResult: (result) => set({ livenessResult: result }),

  evidenceAnchor: null,
  setEvidenceAnchor: (anchor) => set({ evidenceAnchor: anchor }),

  isDemoAttackRunning: false,
  setIsDemoAttackRunning: (running) => set({ isDemoAttackRunning: running }),
  speechLanguage: typeof window !== 'undefined' ? (localStorage.getItem('guardcall_language') || 'hi-IN') : 'hi-IN',
  setSpeechLanguage: (lang) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('guardcall_language', lang);
      } catch {}
    }
    set({ speechLanguage: lang });
  }
}));
