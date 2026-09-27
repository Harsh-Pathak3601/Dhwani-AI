import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Phone, Wifi, WifiOff, Loader2, Languages, FileAudio } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { useSessionStore } from '../store/useSessionStore';
import TranscriptFeed from './TranscriptFeed';
import CoachingCard from './CoachingCard';
import VolumeMonitor from './VolumeMonitor';
import { VoiceIntegrityPanel } from './VoiceIntegrityPanel';
import { LivenessChallengeModal } from './LivenessChallengeModal';
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
  const respondToLiveness = session.respondToLiveness ?? (() => {});
  const resolveOOBAction = session.resolveOOBAction ?? (() => {});
  const dismissHold = session.dismissHold ?? (() => {});
  const runDemoAttack = session.runDemoAttack ?? (() => {});
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

  useEffect(() => {
    if (reportResult) {
      setIsEndingCall(false);
      if (reportResult.report) {
        navigate('/report', { state: { report: reportResult.report } });
      } else if (reportResult.safe) {
        navigate('/app');
      }
    }
  }, [reportResult, navigate]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isEndingCall && !reportResult) {
      timeout = setTimeout(() => {
        setIsEndingCall(false);
        navigate('/app');
      }, 8000);
    }
    return () => clearTimeout(timeout);
  }, [isEndingCall, reportResult, navigate]);

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
    <div className="h-[100dvh] bg-background flex flex-col relative w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto overflow-hidden">
      {/* Background glow indicating active threat level */}
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      {voiceRiskState.state === 'Critical' && (
        <div className="absolute top-0 left-0 w-full h-full bg-danger/10 animate-pulse pointer-events-none z-0" />
      )}

      {/* Command Bar Header */}
      <div className="relative z-10 px-4 pt-4 pb-2">
        <div className="glass-card flex items-center justify-between p-3 px-4 mb-3 shadow-lg border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
              <img
                src="/Dhwani_AI_transparent_512x512.png"
                alt="Dhwani AI"
                className="w-full h-full object-contain drop-shadow-[0_1px_4px_rgba(29,158,117,0.4)]"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-brand text-[11px] uppercase tracking-wider text-primary font-black" style={{fontFamily: "'Outfit', sans-serif"}}>Dhwani AI</span>
                <span className="text-[10px] text-white/30">•</span>
                <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  {isCallActive ? 'Monitoring Call' : 'Call Standby'}
                </p>
              </div>
              <span className="font-mono text-base font-bold">{callerNumber || 'Unknown'}</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
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
            <span className="font-mono text-xs text-white/70">{formatTime(seconds)}</span>
          </div>
        </div>

        {/* Language & Multilingual Mode Selector */}
        <div className="flex items-center justify-between px-1 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs text-white/60 font-medium">
            <Languages className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px]">Voice Language:</span>
          </div>
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => setSpeechLanguage('hi-IN')}
              className={`px-2.5 py-0.5 rounded-md transition-all font-medium cursor-pointer ${
                speechLanguage === 'hi-IN' 
                  ? 'bg-primary text-black font-bold shadow-sm' 
                  : 'text-white/60 hover:text-white'
              }`}
              title="Hindi & Hinglish conversational detection"
            >
              हिंदी / Hinglish
            </button>
            <button
              onClick={() => setSpeechLanguage('en-IN')}
              className={`px-2.5 py-0.5 rounded-md transition-all font-medium cursor-pointer ${
                speechLanguage === 'en-IN' 
                  ? 'bg-primary text-black font-bold shadow-sm' 
                  : 'text-white/60 hover:text-white'
              }`}
              title="Indian English detection"
            >
              English (IN)
            </button>
            <button
              onClick={() => setSpeechLanguage('en-US')}
              className={`px-2 py-0.5 rounded-md transition-all font-medium cursor-pointer ${
                speechLanguage === 'en-US' 
                  ? 'bg-primary text-black font-bold shadow-sm' 
                  : 'text-white/60 hover:text-white'
              }`}
              title="Global English detection"
            >
              EN (US)
            </button>
          </div>
        </div>

        {/* Dhwani AI 3-Stage Acoustic HUD Panel */}
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

      {/* Transcript Feed */}
      <TranscriptFeed transcript={transcript} isCallActive={isCallActive} />

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

      {/* Active Verbal Liveness Challenge Modal */}
      <AnimatePresence>
        {activeChallenge && (
          <LivenessChallengeModal
            challenge={activeChallenge}
            transcript={transcript}
            onRespond={(spokenText, latencyMs) => respondToLiveness(spokenText, latencyMs)}
            onDismiss={() => respondToLiveness('skipped_to_oob', 1500)}
          />
        )}
      </AnimatePresence>

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

      {/* Bottom Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pt-12 z-30">
        <div className="glass-card-strong p-2 pr-6 rounded-full flex items-center justify-between shadow-2xl">
          <div className="w-20 pl-4">
            <VolumeMonitor isRecording={isRecording && isCallActive} />
          </div>

          {!isCallActive ? (
            <div className="flex items-center gap-2">
              <motion.button 
                whileTap={{ scale: 0.94 }}
                onClick={handleStartCall}
                aria-label="Start call"
                data-testid="start-call-button"
                className="px-6 h-13 rounded-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold shadow-[0_0_25px_rgba(16,185,129,0.45)] transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4 fill-current" />
                <span className="text-xs sm:text-sm font-semibold tracking-wide">Live Mic</span>
              </motion.button>

              <label 
                className="px-4 h-13 rounded-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
                title="Select an audio/video file (e.g., CIVIXSHIELD_English.mp4) to test voice clone authenticity directly"
              >
                <FileAudio className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold">Test File</span>
                <input
                  type="file"
                  accept="audio/*,video/*,.mp4,.mp3,.wav,.webm,.m4a"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          ) : (
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={handleEndCall}
              aria-label="End call"
              data-testid="end-call-button"
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${
                voiceRiskState.state === 'Critical' 
                  ? 'bg-danger shadow-[0_0_20px_rgba(226,75,74,0.5)] animate-pulse' 
                  : 'bg-white/10 hover:bg-danger/80'
              }`}
            >
              <PhoneOff className={`w-6 h-6 ${voiceRiskState.state === 'Critical' ? 'text-white' : 'text-danger'}`} />
            </motion.button>
          )}

          <div className="w-20 flex justify-end">
            {isConnected ? (
              <div className="p-2 bg-primary/10 rounded-full text-primary" title="Secured connection active">
                <Wifi className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-2 bg-white/5 rounded-full text-white/30" title="Disconnected">
                <WifiOff className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>

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
