import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  PhoneCall, 
  Phone, 
  ShieldCheck, 
  Volume2, 
  MicOff, 
  Grid3X3, 
  User, 
  Video, 
  Plus, 
  Sparkles,
  FileAudio
} from 'lucide-react';
import MobileDeviceFrame from './MobileDeviceFrame';
import { useSessionStore } from '../store/useSessionStore';

interface TranscriptFeedProps {
  transcript: string;
  isCallActive?: boolean;
  callerNumber?: string;
  onStartCall?: () => void;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TranscriptFeed: React.FC<TranscriptFeedProps> = ({ 
  transcript, 
  isCallActive = true,
  callerNumber: propCallerNumber,
  onStartCall,
  onFileUpload,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const storeCallerNumber = useSessionStore((state) => state.callerNumber);
  const displayCallerNumber = propCallerNumber || storeCallerNumber || '+91 98123 45678';

  const [callDuration, setCallDuration] = useState<number>(0);

  // In-call timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCallActive) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  /**
   * Automatic Scroll Adjustment:
   * Keeps the live transcript view pinned to the bottom.
   */
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript]);

  /**
   * Phrase Splitting using Lookahead Regex:
   * Splits the text stream into individual sentences without deleting punctuation.
   */
  const phrases = transcript.split(/(?<=[.!?])\s+/).filter(p => p.trim().length > 0);

  return (
    <div data-testid="transcript-feed" className="w-full flex justify-center items-center py-2">
      <MobileDeviceFrame isCallActive={isCallActive}>
        <div className="flex-1 flex flex-col h-full justify-between p-4 pt-2">
          
          {/* Top In-Call / Standby Phone Header */}
          <div className="text-center pt-2 pb-3 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[10px] font-mono tracking-wider uppercase text-white/50 font-semibold">
                {isCallActive ? 'Secured Voice Channel' : 'Cellular Standby'}
              </span>
            </div>

            <h3 className="text-base font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>{displayCallerNumber}</span>
            </h3>

            <p className="text-[11px] font-mono text-emerald-400/90 font-medium mt-0.5">
              {isCallActive ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  In Call • {formatCallTime(callDuration)}
                </span>
              ) : (
                'Waiting for Connection...'
              )}
            </p>
          </div>

          {/* Phone Display Center Content */}
          <div className="flex-1 flex flex-col min-h-0 relative my-2 overflow-hidden">
            {/* Top fade gradient for transcript scrolling */}
            {isCallActive && phrases.length > 0 && (
              <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#08121E] to-transparent z-10 pointer-events-none" />
            )}

            <div 
              ref={containerRef}
              className="flex-1 overflow-y-auto px-2 py-2 scroll-smooth"
            >
              <AnimatePresence mode="popLayout">
                {!isCallActive ? (
                  /* Call on Standby Screen (matches Screenshot 2) */
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full flex flex-col items-center justify-center text-white/40 space-y-3.5 px-3 text-center my-auto"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                      <PhoneCall className="w-7 h-7 text-emerald-400" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-base font-bold text-white tracking-tight">Call on Standby</p>
                      <p className="text-xs text-white/60 leading-relaxed max-w-[240px]">
                        Choose an input to test real-time voice clone and acoustic threat detection:
                      </p>
                    </div>

                    {/* Interactive Direct Test Buttons inside the Phone Display */}
                    {(onStartCall || onFileUpload) && (
                      <div className="flex flex-col w-full max-w-[220px] gap-2 pt-1">
                        {onStartCall && (
                          <button
                            onClick={onStartCall}
                            className="w-full py-2 px-3 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5 fill-current" />
                            <span>Start Live Mic</span>
                          </button>
                        )}
                        {onFileUpload && (
                          <label
                            className="w-full py-2 px-3 rounded-xl flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                          >
                            <FileAudio className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Upload Test File</span>
                            <input
                              type="file"
                              accept="audio/*,video/*,.mp4,.mp3,.wav,.webm,.m4a"
                              className="hidden"
                              onChange={onFileUpload}
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {/* Shield Status Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] text-white/70">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>VAS Biometric Engine Ready</span>
                    </div>
                  </motion.div>
                ) : phrases.length === 0 ? (
                  /* Active Call Listening State */
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-white/40 space-y-4 my-auto py-8"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-full"
                          animate={{ height: ['8px', '32px', '8px'] }}
                          transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: 'easeInOut'
                          }}
                        />
                      ))}
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 animate-pulse" /> Listening Securely...
                      </p>
                      <p className="text-[11px] text-white/40">
                        Analyzing audio stream for AI vocal synthesis &amp; acoustic artifacts
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  /* Active Call Transcript Stream - Live Caption Bubbles */
                  <div className="space-y-2.5 pb-4">
                    {phrases.map((phrase, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.25 }}
                        className="p-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] shadow-sm backdrop-blur-md"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mb-1">
                          <span className="flex items-center gap-1 text-emerald-400/80 font-semibold">
                            <Sparkles className="w-2.5 h-2.5" /> Caller Audio
                          </span>
                          <span>Live</span>
                        </div>
                        <p className="text-xs sm:text-[13px] leading-relaxed text-white/90 font-medium">
                          {phrase}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Simulated In-Call Quick Controls Pad */}
          <div className="pt-2 pb-1 border-t border-white/[0.06] shrink-0">
            <div className="grid grid-cols-3 gap-2 px-3 py-1">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCallActive ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-white/[0.04] text-white/30'
                }`}>
                  <MicOff className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-white/50">Mute</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCallActive ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-white/[0.04] text-white/30'
                }`}>
                  <Grid3X3 className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-white/50">Keypad</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCallActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/[0.04] text-white/30'
                }`}>
                  <Volume2 className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-white/50">Speaker</span>
              </div>
            </div>
          </div>

        </div>
      </MobileDeviceFrame>
    </div>
  );
};

export default TranscriptFeed;
