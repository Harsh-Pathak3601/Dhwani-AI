import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, ShieldAlert, Timer, Check, X, Volume2, HelpCircle } from 'lucide-react';
import { LivenessChallengeData } from '../store/useSessionStore';

interface LivenessChallengeModalProps {
  challenge: LivenessChallengeData;
  transcript?: string;
  onRespond: (spokenText: string, latencyMs: number) => void;
  onDismiss: () => void;
}

export const LivenessChallengeModal = ({
  challenge,
  transcript = '',
  onRespond,
  onDismiss
}: LivenessChallengeModalProps) => {
  const [secondsLeft, setSecondsLeft] = useState(challenge.timeLimitSec || 15);
  const [spokenText, setSpokenText] = useState('');
  const [startTime] = useState(Date.now());
  const initialTranscriptLen = useRef(transcript.length);

  // Automatically listen to words spoken into the microphone while modal is open
  useEffect(() => {
    if (transcript.length > initialTranscriptLen.current) {
      const newlySpoken = transcript.slice(initialTranscriptLen.current).trim();
      if (newlySpoken) {
        setSpokenText(newlySpoken);
      }
    }
  }, [transcript]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time expired, submit current response
          onRespond(spokenText || 'challenge_timeout', Date.now() - startTime);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRespond, spokenText, startTime]);

  const handleSubmit = (textToSubmit?: string) => {
    const latency = Date.now() - startTime;
    onRespond(textToSubmit || spokenText || challenge.expectedToken, latency);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md glass-card-strong rounded-3xl border border-warning/40 shadow-2xl overflow-hidden p-6 relative bg-background/95"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-warning/20 border border-warning/40 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-warning" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-mono text-warning font-bold">
                ACTIVE LIVENESS TRIGGERED
              </span>
              <h3 className="text-base font-bold text-white">Verbal Challenge Response</h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 font-mono text-xs font-bold text-white">
            <Timer className="w-3.5 h-3.5 text-warning" />
            <span>{secondsLeft}s</span>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-xs text-white/70 mb-4 leading-relaxed">
          The acoustic engine detected synthetic voice anomalies. Read the following randomized prompt aloud to verify human biological liveness:
        </p>

        {/* Prompt Card */}
        <div className="bg-black/40 border border-warning/30 rounded-2xl p-4 mb-4 text-center">
          <span className="text-[10px] font-mono text-warning uppercase tracking-wider block mb-1">
            Challenge Type: {challenge.type}
          </span>
          <p className="text-lg font-bold text-white leading-snug">
            &ldquo;{challenge.prompt}&rdquo;
          </p>
        </div>

        {/* Verbal Response Input / Live Speech Capture */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-mono text-white/50 uppercase">
              Spoken Response Capture
            </label>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Mic Live Listening</span>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={spokenText}
              onChange={(e) => setSpokenText(e.target.value)}
              placeholder={`Speak prompt aloud, or type: "${challenge.expectedToken}"`}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-warning/60"
            />
            <button
              onClick={() => setSpokenText(challenge.expectedToken)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70"
            >
              Fill Match
            </button>
          </div>
          {spokenText && (
            <div className="text-[10px] font-mono text-emerald-300 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Voice captured: &ldquo;{spokenText}&rdquo;</span>
            </div>
          )}
        </div>

        {/* Accessibility Safeguard Alert */}
        <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 mb-5 flex items-start gap-2 text-[11px] text-white/60 leading-tight">
          <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>
            <strong className="text-white/80">Accessibility Safeguard:</strong> Speech hesitation, accent diversity, or atypical prosody will <em>never</em> penalize legitimate callers; ambiguous audio routes to out-of-band verification.
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={() => handleSubmit()}
            className="flex-1 py-3 bg-warning hover:bg-warning/90 text-black font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
          >
            <Check className="w-4 h-4" />
            <span>Verify Verbal Challenge</span>
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-xs font-semibold"
          >
            Skip to OOB
          </button>
        </div>
      </motion.div>
    </div>
  );
};
