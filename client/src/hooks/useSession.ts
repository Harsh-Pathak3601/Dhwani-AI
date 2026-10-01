import { useCallback, useEffect } from 'react';
import { useSocket } from './useSocket';
import { 
  useSessionStore, 
  RiskData, 
  ReportResult, 
  VoiceStage1Data, 
  VoiceStage2Data, 
  VoiceRiskState, 
  ActiveHoldData, 
  LivenessChallengeData, 
  LivenessResultData 
} from '../store/useSessionStore';
import { useAudioCapture } from './useAudioCapture';

export type { RiskData, ReportResult };

export const useSession = () => {
  const { socket, isConnected } = useSocket();
  const {
    callerNumber,
    sessionActive,
    setSessionActive,
    sessionId,
    setSessionId,
    transcript,
    setTranscript,
    riskData,
    setRiskData,
    reportResult,
    setReportResult,

    // VoiceShield 3-Stage bindings
    voiceStage1,
    setVoiceStage1,
    voiceStage2,
    setVoiceStage2,
    voiceRiskState,
    setVoiceRiskState,
    activeHold,
    setActiveHold,
    activeChallenge,
    setActiveChallenge,
    livenessResult,
    setLivenessResult,
    evidenceAnchor,
    setEvidenceAnchor,
    isDemoAttackRunning,
    setIsDemoAttackRunning,
    speechLanguage
  } = useSessionStore();

  const { 
    startRecording, 
    stopRecording, 
    startFileAnalysis,
    injectSimulatedAcoustics,
    isRecording, 
    permissionError 
  } = useAudioCapture(socket, setTranscript, speechLanguage);

  useEffect(() => {
    if (!socket) return;

    socket.on('transcript:update', (text: string) => {
      setTranscript(text);
    });

    socket.on('risk:update', (data: RiskData) => {
      const currentVoiceRisk = useSessionStore.getState().voiceRiskState?.index || 0;
      setRiskData({
        ...data,
        risk: Math.max(data.risk, currentVoiceRisk),
        peakRiskScore: Math.max(data.peakRiskScore, currentVoiceRisk, useSessionStore.getState().riskData.peakRiskScore)
      });
    });

    socket.on('report:ready', (data: ReportResult) => {
      setReportResult(data);
    });

    socket.on('session:safe', () => {
      const current = useSessionStore.getState().reportResult;
      if (!current || !current.report) {
        setReportResult({ safe: true });
      }
    });

    // VoiceShield 3-Stage socket listeners
    socket.on('voice:stage1', (data: VoiceStage1Data) => {
      setVoiceStage1(data);
    });

    socket.on('voice:stage2', (data: VoiceStage2Data) => {
      setVoiceStage2(data);
    });

    socket.on('risk:state', (data: VoiceRiskState) => {
      setVoiceRiskState(data);
      // Synchronize overall riskData.risk with Security Risk Index
      setRiskData({
        ...useSessionStore.getState().riskData,
        risk: data.index,
        peakRiskScore: Math.max(useSessionStore.getState().riskData.peakRiskScore, data.index)
      });
    });

    socket.on('action:hold', (holdData: ActiveHoldData) => {
      setActiveHold({
        ...holdData,
        status: holdData.status || 'held'
      });
    });

    socket.on('liveness:challenge', (challenge: LivenessChallengeData) => {
      setActiveChallenge(challenge);
    });

    socket.on('liveness:result', (result: LivenessResultData) => {
      setLivenessResult(result);
    });

    socket.on('oob:status', (updatedRequest: any) => {
      if (useSessionStore.getState().activeHold) {
        setActiveHold({
          ...useSessionStore.getState().activeHold!,
          status: updatedRequest.status === 'denied' ? 'prevented' : 'cleared'
        });
      }
    });

    socket.on('evidence:anchored', (anchor: { recordId: string; evidenceHash: string; ledgerAnchorBlock: number }) => {
      setEvidenceAnchor(anchor);
    });

    return () => {
      socket.off('transcript:update');
      socket.off('risk:update');
      socket.off('report:ready');
      socket.off('session:safe');
      socket.off('voice:stage1');
      socket.off('voice:stage2');
      socket.off('risk:state');
      socket.off('action:hold');
      socket.off('liveness:challenge');
      socket.off('liveness:result');
      socket.off('oob:status');
      socket.off('evidence:anchored');
    };
  }, [
    socket,
    setTranscript,
    setRiskData,
    setReportResult,
    setVoiceStage1,
    setVoiceStage2,
    setVoiceRiskState,
    setActiveHold,
    setActiveChallenge,
    setLivenessResult,
    setEvidenceAnchor
  ]);

  const startSession = useCallback(async () => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setReportResult(null);
    setTranscript('');
    setRiskData({ risk: 0, signal: '', phase: 'intro', coaching: '', peakRiskScore: 0 });
    setActiveHold(null);
    setActiveChallenge(null);
    setLivenessResult(null);
    setEvidenceAnchor(null);
    setIsDemoAttackRunning(false);
    setVoiceStage1({
      vas: 0,
      confidence: 'insufficient',
      artifacts: [],
      model: 'heuristic',
      processingTimeMs: 0
    });
    setVoiceStage2({
      speakerDeviation: null,
      profileStatus: 'no_profile',
      similarity: null,
      impersonationRisk: 0,
      urgencyFlag: false,
      transactionKeywords: [],
      signal: 'Awaiting incoming voice stream',
      recommendedVerification: 'Monitoring'
    });
    setVoiceRiskState({
      state: 'Low',
      index: 0,
      explanation: ['Parallel acoustic monitoring tap engaged. Listening for voice input.'],
      recommendedAction: 'Speak into microphone or play audio to analyze vocal authenticity.',
      isConsequential: false,
      requiresHold: false
    });
    
    const storedUser = localStorage.getItem('guardcall_user');
    const userId = storedUser ? JSON.parse(storedUser)?._id || 'anonymous' : 'anonymous';
    const effectiveCaller = (callerNumber && callerNumber.trim()) 
      ? callerNumber.trim() 
      : (typeof window !== 'undefined' ? localStorage.getItem('guardcall_caller_number') || '' : '') || 'Unknown Caller';
    
    if (socket) {
      socket.emit('session:start', { callerNumber: effectiveCaller, sessionId: newSessionId, userId });
    }
    await startRecording();
    setSessionActive(true);
  }, [
    socket, 
    callerNumber, 
    setSessionId, 
    setSessionActive, 
    startRecording, 
    setReportResult, 
    setTranscript, 
    setRiskData,
    setVoiceStage1,
    setVoiceStage2,
    setVoiceRiskState,
    setActiveHold,
    setActiveChallenge,
    setLivenessResult,
    setEvidenceAnchor,
    setIsDemoAttackRunning
  ]);

  const endSession = useCallback(() => {
    stopRecording();
    const currentPeak = Math.max(
      useSessionStore.getState().riskData.peakRiskScore || 0,
      useSessionStore.getState().voiceRiskState?.index || 0
    );
    if (socket) {
      socket.emit('session:end', { peakRiskScore: currentPeak });
    }
    setSessionActive(false);
    setIsDemoAttackRunning(false);

    if (currentPeak >= 40) {
      const latchedState = currentPeak >= 85 ? 'Critical' : currentPeak >= 70 ? 'High' : 'Suspicious';
      const currentVAS = useSessionStore.getState().voiceStage1?.vas || 0;
      setVoiceStage1({
        vas: Math.max(currentVAS, currentPeak >= 60 ? currentPeak : currentVAS),
        confidence: 'sufficient',
        artifacts: useSessionStore.getState().voiceStage1?.artifacts || ['vocoder_spectral_discontinuity'],
        model: useSessionStore.getState().voiceStage1?.model || 'aasist',
        processingTimeMs: 0
      });
      setVoiceRiskState({
        state: latchedState,
        index: currentPeak,
        explanation: [`Session concluded. Latched forensic evidence: Peak Risk reached ${currentPeak}/100.`],
        recommendedAction: 'Review incident report. Spliced synthetic audio anomalies detected.',
        isConsequential: false,
        requiresHold: false
      });
    } else {
      setVoiceStage1({
        vas: 0,
        confidence: 'insufficient',
        artifacts: [],
        model: 'heuristic',
        processingTimeMs: 0
      });
      setVoiceStage2({
        speakerDeviation: null,
        profileStatus: 'no_profile',
        similarity: null,
        impersonationRisk: 0,
        urgencyFlag: false,
        transactionKeywords: [],
        signal: 'Call session ended',
        recommendedVerification: 'Monitoring'
      });
      setVoiceRiskState({
        state: 'Low',
        index: 0,
        explanation: ['Session concluded.'],
        recommendedAction: '',
        isConsequential: false,
        requiresHold: false
      });
    }
  }, [socket, stopRecording, setSessionActive, setIsDemoAttackRunning, setVoiceStage1, setVoiceStage2, setVoiceRiskState]);

  const startFileSession = useCallback(async (file: File) => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setReportResult(null);
    setTranscript('');
    setRiskData({
      risk: 0,
      peakRiskScore: 0,
      phase: 'intro',
      coaching: '',
      signal: 'Voice file stream initialized'
    });
    setActiveHold(null);
    setActiveChallenge(null);
    setLivenessResult(null);
    setEvidenceAnchor(null);
    setIsDemoAttackRunning(false);
    setVoiceStage1({
      vas: 0,
      confidence: 'insufficient',
      artifacts: [],
      model: 'aasist',
      processingTimeMs: 0
    });
    setVoiceStage2({
      speakerDeviation: null,
      profileStatus: 'no_profile',
      similarity: null,
      impersonationRisk: 0,
      urgencyFlag: false,
      transactionKeywords: [],
      signal: 'Analyzing audio track...',
      recommendedVerification: 'Monitoring'
    });
    setVoiceRiskState({
      state: 'Low',
      index: 0,
      explanation: ['Acoustic analysis initialized. Decoding audio track...'],
      recommendedAction: 'Analyzing voice track...',
      isConsequential: false,
      requiresHold: false
    });

    const storedUser = localStorage.getItem('guardcall_user');
    const userId = storedUser ? JSON.parse(storedUser)?._id || 'anonymous' : 'anonymous';
    const effectiveCaller = file.name || 'Voice File';

    if (socket) {
      socket.emit('session:start', { callerNumber: effectiveCaller, sessionId: newSessionId, userId });
    }

    await startFileAnalysis(file, () => {
      // Audio playback completed: keep session active and telemetry visible so user can review peak scores and waveform
      const currentPeak = Math.max(
        useSessionStore.getState().riskData.peakRiskScore || 0,
        useSessionStore.getState().voiceRiskState?.index || 0
      );
      setRiskData({
        ...useSessionStore.getState().riskData,
        signal: `Playback complete • Peak Risk ${currentPeak}/100. Click 'End Call' to generate forensic incident report.`
      });
    });
    setSessionActive(true);
  }, [
    socket,
    setSessionId,
    setSessionActive,
    startFileAnalysis,
    endSession,
    setReportResult,
    setTranscript,
    setRiskData,
    setActiveHold,
    setActiveChallenge,
    setLivenessResult,
    setEvidenceAnchor,
    setIsDemoAttackRunning,
    setVoiceStage1,
    setVoiceStage2,
    setVoiceRiskState
  ]);

  const respondToLiveness = useCallback((spokenText: string, latencyMs: number = 1800) => {
    if (socket && activeChallenge) {
      socket.emit('liveness:respond', {
        challengeId: activeChallenge.challengeId,
        spokenText,
        latencyMs
      });
      setActiveChallenge(null);
    }
  }, [socket, activeChallenge, setActiveChallenge]);

  const resolveOOBAction = useCallback((decision: 'approved' | 'denied') => {
    if (socket && activeHold) {
      socket.emit('oob:resolve', {
        oobId: activeHold.oobId,
        decision,
        reviewer: 'Enterprise MDM Authorization'
      });
    }
  }, [socket, activeHold]);

  const dismissHold = useCallback(() => {
    setActiveHold(null);
  }, [setActiveHold]);

  /**
   * SIH 2026 Demo Scenario: CFO ₹50 Lakh Emergency Transfer Voice Clone Attack
   * Injects the full end-to-end scenario outlined in voice-cloning.md:
   * 1. Injects synthetic acoustic physical fingerprints (F0 regular, MFCC smooth, no breath)
   * 2. Injects transcript with CFO impersonation + ₹50 Lakh urgent transfer
   * 3. Triggers Stage 1 (74% VAS), Stage 2 (81 Impersonation Risk), Stage 3 Critical (Index 88)
   * 4. Triggers full-screen transaction hold and OOB push prompt!
   */
  const runDemoAttack = useCallback(() => {
    if (!socket) return;
    setIsDemoAttackRunning(true);

    // Step 1: Inject synthetic physical acoustic fingerprints
    injectSimulatedAcoustics('synthetic_attack');

    // Step 2: Inject CFO Impersonation transcript after 1 second
    setTimeout(() => {
      const demoTranscript = "Good afternoon, this is Rajiv Verma, CFO of the firm. We have an urgent offshore regulatory deadline. I need you to authorize an emergency transfer of ₹50 lakh immediately. Do not delay, execute the transfer right now.";
      setTranscript(demoTranscript);
      socket.emit('transcript:update', demoTranscript);
      injectSimulatedAcoustics('synthetic_attack');
    }, 1200);
  }, [socket, injectSimulatedAcoustics, setTranscript, setIsDemoAttackRunning]);

  return {
    startSession,
    startFileSession,
    endSession,
    respondToLiveness,
    resolveOOBAction,
    dismissHold,
    runDemoAttack,
    isRecording,
    sessionActive,
    transcript,
    riskData,
    reportResult,
    permissionError,
    isConnected,
    sessionId,

    // VoiceShield 3-Stage State
    voiceStage1,
    voiceStage2,
    voiceRiskState,
    activeHold,
    activeChallenge,
    livenessResult,
    evidenceAnchor,
    isDemoAttackRunning
  };
};
