import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Phone, Wifi, WifiOff, Loader2, Languages, FileAudio } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { useSessionStore } from '../store/useSessionStore';
import type { ReportData } from '../services/reportPDF';
import TranscriptFeed from './TranscriptFeed';
import CoachingCard from './CoachingCard';
import VolumeMonitor from './VolumeMonitor';
import { VoiceIntegrityPanel } from './VoiceIntegrityPanel';
import { PreTransactionWarningModal } from './PreTransactionWarningModal';
import { OOBVerificationModal } from './OOBVerificationModal';

const calculateSimilarity = (str1: string, str2: string) => {
  const getWords = (s: string) => new Set(s.toLowerCase().match(/\b\w+\b/g) || []);
  const set1 = getWords(str1);
  const set2 = getWords(str2);
  if (set1.size === 0 && set2.size === 0) return 1;

  let intersection = 0;
  set1.forEach(word => {
    if (set2.has(word)) intersection++;
  });

  const union = set1.size + set2.size - intersection;
  return intersection / union;
};

const CallSession = () => {
  const navigate = useNavigate();
  const session = useSession();
  const {
    startSession,
    startFileSession,
    endSession,
    isRecording,
    sessionActive,
    transcript,
    riskData,
    reportResult,
    permissionError,
    isConnected,
  } = session;

  const voiceStage1 = session.voiceStage1 ?? { vas: 0, confidence: 0, primaryArtifact: 'None' as const, artifacts: [], modelVotes: { aasist: 0, heuristic: 0 } };
  const voiceStage2 = session.voiceStage2 ?? { isImpersonating: false, enrolledSpeaker: 'None', confidence: 0 };
  const voiceRiskState = session.voiceRiskState ?? { state: 'Low' as const, index: 0, level: 'safe', recommendedAction: '' };
  const activeHold = session.activeHold ?? null;
  const activeChallenge = session.activeChallenge ?? null;
  const respondToLiveness = session.respondToLiveness ?? (() => { });
  const resolveOOBAction = session.resolveOOBAction ?? (() => { });
  const dismissHold = session.dismissHold ?? (() => { });
  const runDemoAttack = session.runDemoAttack ?? (() => { });
  const isDemoAttackRunning = session.isDemoAttackRunning ?? false;
  const evidenceAnchor = session.evidenceAnchor ?? null;

  const setReportResult = useSessionStore((state) => state.setReportResult);
  const callerNumber = useSessionStore((state) => state.callerNumber);
  const speechLanguage = useSessionStore((state) => state.speechLanguage);
  const setSpeechLanguage = useSessionStore((state) => state.setSpeechLanguage);
  const resetSessionState = useSessionStore((state) => state.resetSessionState);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [cardDismissedId, setCardDismissedId] = useState<string | null>(null);
  const [dismissedPhases, setDismissedPhases] = useState<Set<string>>(new Set());
  const [seconds, setSeconds] = useState(0);
  const [isOOBModalOpen, setIsOOBModalOpen] = useState(false);

  type PhaseType = 'intro' | 'allegation' | 'intimidation' | 'demand';
  const [displayCardData, setDisplayCardData] = useState<{ risk: number, signal: string, phase: PhaseType, coaching: string } | null>(null);
  const displayCardDataRef = useRef(displayCardData);
  displayCardDataRef.current = displayCardData;
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear previous session artifacts and ensure fresh state on initial mount
  useEffect(() => {
    if (!sessionActive) {
      setDisplayCardData(null);
      setCardDismissedId(null);
      setDismissedPhases(new Set());
      resetSessionState();
    }
  }, []);

  const isCallActive = sessionStarted || sessionActive;

  useEffect(() => {
    // Never display threat coaching card if call is not active
    if (!isCallActive) {
      if (displayCardDataRef.current) {
        setDisplayCardData(null);
      }
      return;
    }

    const currentCard = displayCardDataRef.current;

    // Trigger coaching card either from behavioral scam risk (>=40) OR VoiceShield elevated state (Suspicious/High/Critical)
    const isVoiceElevated = ['Suspicious', 'High', 'Critical'].includes(voiceRiskState.state);
    const effectiveRisk = Math.max(riskData.risk, voiceRiskState.index);

    if (effectiveRisk >= 40 || isVoiceElevated) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      let isSameContext = false;
      if (currentCard) {
        const similarity = calculateSimilarity(currentCard.coaching, riskData.coaching || voiceRiskState.recommendedAction);
        isSameContext = (currentCard.phase === riskData.phase) || (similarity > 0.80);
      }

      if (!currentCard || !isSameContext) {
        setDisplayCardData({
          risk: effectiveRisk,
          signal: voiceRiskState.state !== 'Low'
            ? `Dhwani AI: ${voiceRiskState.state} (${voiceStage1.vas}% Synthetic VAS)`
            : riskData.signal,
          phase: riskData.phase ?? 'demand',
          coaching: voiceRiskState.recommendedAction || riskData.coaching
        });
      } else if (currentCard.risk !== effectiveRisk) {
        setDisplayCardData(prev => prev ? { ...prev, risk: effectiveRisk } : null);
      }
    } else {
      if (!closeTimerRef.current && currentCard) {
        closeTimerRef.current = setTimeout(() => {
          setDisplayCardData(null);
          closeTimerRef.current = null;
        }, 5000);
      }
    }

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [isCallActive, riskData.risk, riskData.signal, riskData.phase, riskData.coaching, voiceRiskState, voiceStage1.vas]);

  const callbacksRef = useRef({ startSession, startFileSession, endSession });
  useEffect(() => {
    callbacksRef.current = { startSession, startFileSession, endSession };
  }, [startSession, startFileSession, endSession]);

  const handleStartCall = useCallback(async () => {
    setDisplayCardData(null);
    setCardDismissedId(null);
    setDismissedPhases(new Set());
    resetSessionState();
    setSeconds(0);
    setSessionStarted(true);
    try {
      await callbacksRef.current.startSession();
    } catch (e) {
      console.error('Error starting session:', e);
    }
  }, [resetSessionState]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDisplayCardData(null);
    setCardDismissedId(null);
    setDismissedPhases(new Set());
    resetSessionState();
    setSeconds(0);
    setSessionStarted(true);
    try {
      await callbacksRef.current.startFileSession(file);
    } catch (err) {
      console.error('Error starting file session:', err);
    }
  }, [resetSessionState]);

  const handleEndCall = useCallback(() => {
    setIsEndingCall(true);
    callbacksRef.current.endSession();
    setSessionStarted(false);
    setSeconds(0);
  }, []);

  useEffect(() => {
    return () => {
      callbacksRef.current.endSession();
    };
  }, []);

  const createFallbackReport = useCallback((): ReportData => {
    const store = useSessionStore.getState();
    const peak = Math.min(98, Math.max(
      store.riskData.peakRiskScore || 0,
      store.voiceRiskState?.index || 0,
      store.voiceStage1?.vas || 0
    ));
    const isThreat = peak >= 40;
    const livenessScore = store.livenessResult?.score ?? null;

    return {
      callerNumber: store.callerNumber || 'Live Audio Stream',
      peakRiskScore: peak,
      finalRiskScore: peak,
      livenessScore: livenessScore,
      scamType: peak >= 70
        ? 'AI Voice Cloning / High Risk Manipulation'
        : peak >= 40
          ? 'Suspicious Activity Flagged'
          : 'Clean / Verified Safe Call',
      summary: isThreat
        ? `Session evaluated with peak risk index of ${peak}/100. Potential voice or conversational anomalies flagged during live analysis.`
        : livenessScore !== null && livenessScore >= 70
          ? `Call verified authentic. Active voice liveness challenge successfully passed (${livenessScore}/100). No fraudulent patterns detected.`
          : 'Call completed safely. Acoustic voice tap and conversational monitoring confirmed no synthetic cloning or scam indicators.',
      redFlags: store.riskData.coaching ? [store.riskData.coaching] : (store.voiceStage1?.artifacts || []),
      formalComplaintText: isThreat
        ? `Incident report for call with ${store.callerNumber || 'Unknown'}. Peak threat risk score reached ${peak}/100.`
        : 'No formal complaint required. This session was verified authentic with normal speech patterns.',
      createdAt: new Date()
    };
  }, []);

  useEffect(() => {
    if (reportResult) {
      setIsEndingCall(false);
      if (reportResult.report) {
        navigate('/report', { state: { report: reportResult.report } });
      } else {
        // Safe or summary session: build clean report and navigate to /report
        const report = createFallbackReport();
        navigate('/report', { state: { report } });
      }
    }
  }, [reportResult, navigate, createFallbackReport]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isEndingCall && !reportResult) {
      timeout = setTimeout(() => {
        setIsEndingCall(false);
        // Fallback safety: ALWAYS deliver report, never kick to home!
        const report = createFallbackReport();
        navigate('/report', { state: { report } });
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [isEndingCall, reportResult, navigate, createFallbackReport]);

  useEffect(() => {
    return () => {
      setReportResult(null);
    };
  }, [setReportResult]);

  useEffect(() => {
    if (isCallActive) {
      const interval = setInterval(() => setSeconds(s => s + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [isCallActive]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleDismissCard = useCallback(() => {
    if (displayCardData) {
      setCardDismissedId(displayCardData.signal);
      setDismissedPhases(prev => {
        const next = new Set(prev);
        next.add(displayCardData.phase);
        return next;
      });
    }
  }, [displayCardData]);

  if (permissionError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="glass-card-strong p-8 max-w-sm w-full">
          <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhoneOff className="w-8 h-8 text-danger" />
          </div>
          <h2 className="text-xl font-bold mb-2">Microphone Required</h2>
          <p className="text-white/60 text-sm mb-6 leading-relaxed">
            Dhwani AI requires microphone input to analyze acoustic physical features in parallel. {permissionError}
          </p>
          <button
            onClick={() => navigate('/app')}
            className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const showCard = displayCardData !== null &&
    displayCardData.signal !== cardDismissedId &&
    !dismissedPhases.has(displayCardData.phase);

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col relative w-full pb-24 overflow-x-hidden">
      {voiceRiskState.state === 'Critical' && (
        <div className="absolute top-0 left-0 w-full h-full bg-danger/10 animate-pulse pointer-events-none z-0" />
      )}

      {/* Main Cockpit Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6 flex-1 flex flex-col">
        {/* Command Bar Header */}
        <div className="glass-card flex flex-col md:flex-row items-center justify-between p-3.5 sm:p-4 mb-4 border-white/10 gap-3 rounded-2xl w-full">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden p-1 shadow-sm shrink-0">
              <img
                src="/Dhwani_AI_transparent_512x512.png"
                alt="Dhwani AI"
                className="w-full h-full object-contain drop-shadow-[0_1px_4px_rgba(255,109,0,0.5)]"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-brand text-xs uppercase tracking-wider text-white font-black" style={{ fontFamily: "'Outfit', sans-serif" }}>Dhwani AI Cockpit</span>
                <span className="text-[10px] text-white/30">•</span>
                <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  {isCallActive ? 'Monitoring Call' : 'Call Standby'}
                </p>
              </div>
              <span className="font-mono text-base sm:text-lg font-bold text-white tracking-wide truncate block">{callerNumber || 'Unknown Caller'}</span>
            </div>
          </div>

          {/* Language Selector & Status */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
            <div className="flex items-center gap-0.5 sm:gap-1 bg-white/5 border border-white/10 rounded-xl p-0.5 sm:p-1 text-xs max-w-full overflow-x-auto scrollbar-none">
              <button
                onClick={() => setSpeechLanguage('hi-IN')}
                className={`px-2 sm:px-3 py-1 rounded-lg transition-all font-semibold cursor-pointer text-[11px] sm:text-xs ${speechLanguage === 'hi-IN'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-black shadow-sm'
                    : 'text-white/60 hover:text-white'
                  }`}
                title="Hindi & Hinglish conversational detection"
              >
                हिंदी / Hinglish
              </button>
              <button
                onClick={() => setSpeechLanguage('en-IN')}
                className={`px-2 sm:px-3 py-1 rounded-lg transition-all font-semibold cursor-pointer text-[11px] sm:text-xs ${speechLanguage === 'en-IN'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-black shadow-sm'
                    : 'text-white/60 hover:text-white'
                  }`}
                title="Indian English detection"
              >
                English (IN)
              </button>
              <button
                onClick={() => setSpeechLanguage('en-US')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all font-semibold cursor-pointer text-[11px] sm:text-xs ${speechLanguage === 'en-US'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-black shadow-sm'
                    : 'text-white/60 hover:text-white'
                  }`}
                title="Global English detection"
              >
                EN (US)
              </button>
            </div>

            <div className="text-right flex flex-col items-end shrink-0 pl-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="relative flex h-2 w-2">
                  {isCallActive ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white/40"></span>
                  )}
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-widest ${isCallActive ? 'text-primary' : 'text-white/50'}`}>
                  {isCallActive ? 'LIVE TAP' : 'STANDBY'}
                </span>
              </div>
              <span className="font-mono text-xs text-white/70 font-semibold">{formatTime(seconds)}</span>
            </div>
          </div>
        </div>

        {/* Top First-View Quick-Test Bar (Always Visible inside the Card) */}
        <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-orange-950/40 via-[#0B1523]/95 to-amber-950/40 border border-amber-500/30 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_20px_rgba(255,109,0,0.18)] flex flex-col md:flex-row items-center justify-between gap-4">
          {!isCallActive ? (
            <>
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white tracking-tight">Voice Clone &amp; Scam Detection Engine</span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 tracking-wider">READY TO TEST</span>
                </div>
                <p className="text-xs text-white/60">
                  Select an input source to test real-time AI voice clone and acoustic threat detection:
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={handleStartCall}
                  aria-label="Start live mic test"
                  data-testid="start-call-button"
                  className="flex-1 md:flex-initial px-6 h-11 rounded-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 hover:opacity-95 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(255,109,0,0.45)] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Phone className="w-4 h-4 fill-current" />
                  <span className="font-semibold tracking-wide">Live Mic</span>
                </motion.button>

                <label
                  className="flex-1 md:flex-initial px-5 h-11 rounded-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-amber-500/30 text-white font-medium text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
                  title="Select an audio or video file (e.g., MP4, MP3, WAV) to test voice authenticity"
                >
                  <FileAudio className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold">Test File</span>
                  <input
                    type="file"
                    accept="audio/*,video/*,.mp4,.mp3,.wav,.webm,.m4a"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white tracking-tight">Active Call Monitoring</span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    LIVE TAP ACTIVE
                  </span>
                </div>
                <p className="text-xs text-white/60">
                  Real-time DSP acoustic feature tap &amp; semantic scam detection stream active.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
                <div className="w-20 px-1">
                  <VolumeMonitor isRecording={isRecording && isCallActive} />
                </div>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={handleEndCall}
                  aria-label="End call"
                  data-testid="end-call-button"
                  className={`px-5 h-11 rounded-full flex items-center justify-center gap-2 text-white font-bold text-xs sm:text-sm shadow-lg transition-all cursor-pointer whitespace-nowrap ${
                    voiceRiskState.state === 'Critical'
                      ? 'bg-danger shadow-[0_0_20px_rgba(226,75,74,0.6)] animate-pulse'
                      : 'bg-red-600/90 hover:bg-red-500 border border-red-500/50 shadow-md shadow-red-500/20'
                  }`}
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </motion.button>
              </div>
            </>
          )}
        </div>

        {/* Desktop 2-Column Cockpit Layout: Left 7 cols (Acoustic HUD), Right 5 cols (Coaching & Transcript) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          {/* Left Column: Voice Integrity Acoustic HUD */}
          <div className="lg:col-span-7 space-y-4">
            <div data-testid="risk-indicator">
              <VoiceIntegrityPanel
                stage1={voiceStage1}
                stage2={voiceStage2}
                riskState={voiceRiskState}
                peakRiskScore={riskData.peakRiskScore}
                evidenceAnchor={evidenceAnchor}
                livenessScore={session.livenessResult?.score ?? null}
                onRunDemoAttack={runDemoAttack}
                isDemoRunning={isDemoAttackRunning}
                isCallActive={isCallActive}
              />
            </div>
          </div>

          {/* Right Column: Coaching Alert Cards + Live Speech-to-Text Transcript Feed */}
          <div className="lg:col-span-5 flex flex-col gap-4 h-full min-h-[500px]">
            {/* 5-State Voice Integrity Alert / Coaching Card */}
            <AnimatePresence>
              {showCard && displayCardData && (
                <CoachingCard
                  key={displayCardData.signal}
                  risk={displayCardData.risk}
                  signal={displayCardData.signal}
                  coaching={displayCardData.coaching}
                  voiceState={voiceRiskState.state}
                  vas={voiceStage1.vas}
                  onDismiss={handleDismissCard}
                />
              )}
            </AnimatePresence>

            {/* Transcript Feed */}
            <div className="flex-1 flex flex-col justify-center items-center">
              <TranscriptFeed
                transcript={transcript}
                isCallActive={isCallActive}
                callerNumber={callerNumber}
                onStartCall={handleStartCall}
                onFileUpload={handleFileUpload}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pre-Transaction Warning Modal (Consequence Escalation) */}
      <AnimatePresence>
        {activeHold && activeHold.status === 'held' && !isOOBModalOpen && (
          <PreTransactionWarningModal
            hold={activeHold}
            onOpenOOB={() => setIsOOBModalOpen(true)}
            onDismiss={dismissHold}
          />
        )}
      </AnimatePresence>

      {/* Independent Trust Channel (OOB Device Simulator) */}
      <AnimatePresence>
        {isOOBModalOpen && activeHold && (
          <OOBVerificationModal
            hold={activeHold}
            onResolve={(decision) => resolveOOBAction(decision)}
            onClose={() => setIsOOBModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Floating Control Bar (Only rendered during active call when scrolling) */}
      {isCallActive && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#070b10] via-[#070b10]/95 to-transparent pt-8 z-40 flex justify-center pointer-events-none">
          <div className="inline-flex items-center gap-3 p-2 px-3 sm:px-4 rounded-full bg-[#0B1523]/95 shadow-2xl border border-amber-500/30 backdrop-blur-2xl pointer-events-auto">
            <div className="flex items-center gap-4 px-2">
              <div className="w-16">
                <VolumeMonitor isRecording={isRecording && isCallActive} />
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleEndCall}
                aria-label="End call"
                data-testid="end-call-floating-button"
                className={`px-4 py-2 rounded-full flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer font-bold text-xs ${
                  voiceRiskState.state === 'Critical'
                    ? 'bg-danger text-white shadow-[0_0_20px_rgba(226,75,74,0.5)] animate-pulse'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                <PhoneOff className="w-4 h-4 text-white" />
                <span>End Call</span>
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Ending Call & Auto Report Generation Overlay ─── */}
      <AnimatePresence>
        {isEndingCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative mb-5 flex items-center justify-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_35px_rgba(29,158,117,0.3)]">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Securing Call Session</h3>
            <p className="text-sm text-white/60 max-w-sm leading-relaxed">
              Generating voice cloning forensic report and syncing with Community Shield...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CallSession;
