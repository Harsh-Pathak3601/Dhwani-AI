import { useState, useCallback, useMemo, type ReactNode, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { checkCommunityDB } from '../services/api';
import {
  ShieldCheck,
  Phone,
  ArrowRight,
  AlertTriangle,
  Cpu,
  FileText,
  Shield,
  Loader2,
  Sparkles,
  Lock,
  Zap,
  Activity,
  CheckCircle2,
  Users
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import MobileDeviceFrame from './MobileDeviceFrame';

/* ─── Floating Particles Background ─── */
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

function ParticlesBackground() {
  const particles: Particle[] = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 4,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, 15, 0],
            opacity: [0.15, 0.6, 0.15],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

const NumberCheck = () => {
  const { callerNumber, setCallerNumber } = useSessionStore();
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<{
    message: string;
    reportsCount: number;
  } | null>(null);
  const navigate = useNavigate();

  const isValidNumber = callerNumber.replace(/\D/g, '').length >= 10;

  const handleCheck = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!isValidNumber) return;

      setLoading(true);
      try {
        const cleaned = callerNumber.replace(/\D/g, '').slice(-10) || callerNumber;
        const result = await checkCommunityDB(cleaned);
        if (result.flagged || result.reportsCount > 0) {
          setWarning({
            message: `This number has been reported ${result.reportsCount} time${result.reportsCount !== 1 ? 's' : ''} for suspicious activity.`,
            reportsCount: result.reportsCount,
          });
        } else {
          navigate('/consent');
        }
      } finally {
        setLoading(false);
      }
    },
    [callerNumber, isValidNumber, navigate]
  );

  const handleProceed = useCallback(() => {
    navigate('/consent');
  }, [navigate]);

  const setPresetNumber = (num: string) => {
    setWarning(null);
    setCallerNumber(num);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden bg-transparent text-white">
      <div className="animated-grid-bg opacity-40" />
      <ParticlesBackground />

      {/* Main Responsive Web Content */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Top Hero Grid: 7 cols (Info & Value Prop) + 5 cols (Scanner Console) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* Left Hero & Details (7 cols) */}
            <motion.div variants={itemVariants} className="lg:col-span-7 space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">

              <span className="font-kaushan text-amber-400 tracking-widest text-xs sm:text-sm uppercase font-semibold block drop-shadow-[0_0_12px_rgba(255,171,0,0.35)]">
                AI-POWERED VOICE SECURITY
              </span>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-brand-display tracking-tight leading-snug sm:leading-[1.15] break-words">
                Real-time AI Defense<br />
                <span className="font-serif italic font-normal text-3xl sm:text-5xl lg:text-6xl bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-300 bg-clip-text text-transparent tracking-wide inline-block drop-shadow-[0_2px_18px_rgba(255,109,0,0.35)]">
                  Against Voice Scams
                </span>
              </h1>

              <p className="font-satisfy text-xl sm:text-2xl text-amber-200/90 font-normal tracking-wide drop-shadow-[0_0_8px_rgba(255,171,0,0.25)]">
                &ldquo;Don&apos;t trust the voice. Verify the action.&rdquo;
              </p>

              {/* Compact Protection Flow */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold tracking-wider text-white/80 py-1">
                <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/35 shadow-[0_0_10px_rgba(255,171,0,0.2)]">DETECT VOICE</span>
                <span className="text-white/40">&rarr;</span>
                <span className="px-2.5 py-1 rounded-md bg-white/[0.04] text-white/70 border border-white/10">SCORE</span>
                <span className="text-white/40">&rarr;</span>
                <span className="px-2.5 py-1 rounded-md bg-white/[0.04] text-white/70 border border-white/10">CHALLENGE</span>
                <span className="text-white/40">&rarr;</span>
                <span className="px-2.5 py-1 rounded-md bg-white/[0.04] text-white/70 border border-white/10">VERIFY</span>
                <span className="text-white/40">&rarr;</span>
                <span className="px-2.5 py-1 rounded-md bg-orange-500/25 text-orange-300 border border-orange-500/40 shadow-[0_0_12px_rgba(255,109,0,0.3)]">PROTECT</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-4 w-full">
                <Link
                  to="/session"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm tracking-wide bg-white text-gray-900 shadow-xl shadow-white/10 hover:bg-amber-100 hover:shadow-[0_0_20px_rgba(255,171,0,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                  id="try-dhwani-ai-btn"
                >
                  <span>Try Dhwani AI</span>
                  <span className="text-base font-semibold">&rarr;</span>
                </Link>

                <a
                  href="https://drive.google.com/drive/folders/1FW-ac9awRK2J0J1oe7HMyBwVmvjSl6MC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm tracking-wide text-white/90 bg-white/[0.06] hover:bg-white/[0.12] hover:text-white border border-white/15 hover:border-amber-400/40 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                >
                  <svg
                    className="w-4 h-4 fill-current text-amber-300"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>See How It Works</span>
                </a>
              </div>
            </motion.div>

            {/* Right Interactive Scanner Console (5 cols) housed in a 6.3" Mobile Device */}
            <motion.div variants={itemVariants} className="lg:col-span-5 w-full flex justify-center">
              <MobileDeviceFrame>
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header inside Phone Screen */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center p-1 shadow-md">
                          <img
                            src="/Dhwani_AI_transparent_512x512.png"
                            alt="Dhwani AI Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base tracking-tight leading-tight">Caller Verification</h3>
                          <p className="text-[11px] text-white/50">Enter the incoming or suspected number</p>
                        </div>
                      </div>
                      <div className="px-2 py-0.5 rounded-md bg-white/[0.06] text-[9px] font-mono font-semibold text-amber-400 border border-amber-500/25">
                        SCANNER v1.0
                      </div>
                    </div>

                    <form onSubmit={handleCheck} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-textMain/80 flex items-center justify-between">
                          <span>Caller Phone Number</span>
                          <span className="text-white/40 text-[10px]">Format: +91 XXXXX XXXXX</span>
                        </label>

                        <div className="relative">
                          <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none text-amber-400">
                            <Phone className="w-4 h-4" />
                          </div>
                          <input
                            type="tel"
                            placeholder="+91 98123 45678"
                            className="w-full bg-black/50 border border-white/15 rounded-xl pl-10 pr-3 py-3 text-textMain placeholder:text-textMain/25 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all text-sm font-medium font-mono"
                            value={callerNumber}
                            onChange={(e) => {
                              if (warning) setWarning(null);
                              const val = e.target.value;
                              const hasPlus = val.startsWith('+');
                              const digits = val.replace(/\D/g, '');

                              let formatted = '';
                              if (hasPlus && digits.startsWith('91')) {
                                const country = digits.slice(0, 2);
                                const p1 = digits.slice(2, 7);
                                const p2 = digits.slice(7, 12);
                                formatted = `+${country}`;
                                if (p1) formatted += ` ${p1}`;
                                if (p2) formatted += ` ${p2}`;
                              } else if (hasPlus) {
                                formatted = `+${digits}`;
                              } else {
                                const cleanDigits = digits.slice(0, 10);
                                if (cleanDigits.length > 5) {
                                  formatted = `${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;
                                } else {
                                  formatted = cleanDigits;
                                }
                              }
                              setCallerNumber(val === '' ? '' : (formatted || val));
                            }}
                            required
                          />
                        </div>
                      </div>

                      {/* Warning Box */}
                      <AnimatePresence>
                        {warning && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            className="rounded-xl border border-red-500/40 bg-red-950/40 p-3.5 space-y-2.5"
                          >
                            <div className="flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <h3 className="text-danger font-semibold text-xs text-red-400">
                                  Community Warning
                                </h3>
                                <p className="text-[11px] text-white/80 leading-relaxed">
                                  {warning.message}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/20 text-red-400 text-[10px] font-semibold">
                                {warning.reportsCount} report{warning.reportsCount !== 1 ? 's' : ''}
                              </div>
                              <span className="text-white/40 text-[10px]">from community members</span>
                            </div>

                            <button
                              type="button"
                              onClick={handleProceed}
                              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-900/30"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              Proceed with Protection
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Primary Scan Button */}
                      {!warning && (
                        <button
                          type="submit"
                          onClick={handleCheck}
                          disabled={loading || !isValidNumber}
                          className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${isValidNumber && !loading
                            ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-slate-950 font-black shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:opacity-95'
                            : 'bg-white/[0.08] text-white/30 cursor-not-allowed border border-white/5'
                            }`}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                              <span>Checking Sanchar Saathi &amp; DB...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4 text-slate-950" />
                              <span>Check &amp; Protect</span>
                              <ArrowRight className="w-4 h-4 text-slate-950" />
                            </>
                          )}
                        </button>
                      )}
                    </form>

                    {/* Presets inside Phone Screen */}
                    <div className="pt-2">
                      <span className="text-[10px] font-mono text-white/40 uppercase block mb-1.5">Quick Dial Presets:</span>
                      <div className="flex flex-col gap-1.5">
                        <div
                          role="option"
                          tabIndex={0}
                          aria-selected="false"
                          onClick={() => setPresetNumber('+91 98765 43210')}
                          onKeyDown={(e) => e.key === 'Enter' && setPresetNumber('+91 98765 43210')}
                          className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] text-white/80 transition-all flex items-center justify-between cursor-pointer text-left"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                            <span>Known Threat</span>
                          </span>
                          <span className="font-mono text-white/50 text-[10px]">+91 98765 43210</span>
                        </div>
                        <div
                          role="option"
                          tabIndex={0}
                          aria-selected="false"
                          onClick={() => setPresetNumber('+91 91234 56789')}
                          onKeyDown={(e) => e.key === 'Enter' && setPresetNumber('+91 91234 56789')}
                          className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] text-white/80 transition-all flex items-center justify-between cursor-pointer text-left"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            <span>Verified Safe</span>
                          </span>
                          <span className="font-mono text-white/50 text-[10px]">+91 91234 56789</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer notes inside Phone Display */}
                  <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[10px] text-white/50">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-amber-400" />
                      Encrypted Telemetry
                    </span>
                    <Link to="/consent" className="text-amber-400 hover:underline">
                      View DPDP Safeguards &rarr;
                    </Link>
                  </div>
                </div>
              </MobileDeviceFrame>
            </motion.div>
          </div>

          {/* Lower Feature Grid (Proper Website Layout) */}
          <div className="pt-10 border-t border-white/[0.08]">
            <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                How Dhwani AI <span className="font-serif italic font-normal text-amber-400 text-3xl sm:text-4xl">Neutralizes</span> Impersonation
              </h2>
              <p className="text-xs sm:text-sm text-white/60">
                A multi-layered defense pipeline combining physical acoustic feature extraction with deep semantic intent modeling.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="glass-card p-6 rounded-2xl border-white/[0.08] space-y-3 hover:border-amber-500/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shadow-sm shadow-amber-500/20">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Browser DSP Feature Tap</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Extracts 13-band MFCC coefficients, spectral flux, and pitch jitter in-browser with 0ms roundtrip delay. Pinpoints mathematical anomalies unique to synthetic voice models.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card p-6 rounded-2xl border-white/[0.08] space-y-3 hover:border-orange-500/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform shadow-sm shadow-orange-500/20">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Zero-Hop Edge STT</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Audio flows directly to Deepgram edge servers via WebSocket tokens, delivering real-time multilingual transcription (Hindi, Indian English) without server bottlenecks.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card p-6 rounded-2xl border-white/[0.08] space-y-3 hover:border-amber-500/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shadow-sm shadow-amber-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Groq Tactical Coaching</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Groq LPU processes semantic intent in sub-second cycles, surfacing instant counter-coaching cards on screen to guide the victim safely away from coerced money transfers.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default NumberCheck;
