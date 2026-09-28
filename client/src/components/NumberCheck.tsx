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
            <motion.div variants={itemVariants} className="lg:col-span-7 space-y-6 text-left">

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-brand-display tracking-tight leading-[1.15]">
                Real-Time Voice Cloning Detection &amp;{' '}
                <span className="font-serif italic font-normal text-4xl sm:text-5xl lg:text-6xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  Scam Interception
                </span>
              </h1>

              <p className="text-textMain/75 text-base sm:text-lg leading-relaxed max-w-2xl">
                Protect vulnerable citizens from generative AI voice clones, digital arrest threats, and coercive bank extortion. Our browser-level DSP tap extracts micro-acoustic physical features in real time without sending raw audio to servers.
              </p>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-white">0ms Latency</p>
                    <p className="text-white/50 text-[11px]">Parallel Audio Tap</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-white">DPDP 2023</p>
                    <p className="text-white/50 text-[11px]">Zero Audio Stored</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] col-span-2 sm:col-span-1">
                  <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-white">Groq LPU</p>
                    <p className="text-white/50 text-[11px]">Instant Llama 3 Coaching</p>
                  </div>
                </div>
              </div>

              {/* Preset Threat Scenarios for Quick Testing */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <span className="font-satisfy text-base text-teal-300 font-normal">
                    Quick-Test Threat Simulation Scenarios:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div
                    role="option"
                    aria-selected="false"
                    tabIndex={0}
                    onClick={() => setPresetNumber('+91 98765 43210')}
                    onKeyDown={(e) => e.key === 'Enter' && setPresetNumber('+91 98765 43210')}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-white/80 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    <span>Digital Arrest Scam (+91 98765 43210)</span>
                  </div>
                  <div
                    role="option"
                    aria-selected="false"
                    tabIndex={0}
                    onClick={() => setPresetNumber('+91 88888 12345')}
                    onKeyDown={(e) => e.key === 'Enter' && setPresetNumber('+91 88888 12345')}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-white/80 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Voice Clone Fake Emergency (+91 88888 12345)</span>
                  </div>
                  <div
                    role="option"
                    aria-selected="false"
                    tabIndex={0}
                    onClick={() => setPresetNumber('+91 91234 56789')}
                    onKeyDown={(e) => e.key === 'Enter' && setPresetNumber('+91 91234 56789')}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-white/80 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Verified Legitimate (+91 91234 56789)</span>
                  </div>
                </div>
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
                      <div className="px-2 py-0.5 rounded-md bg-white/[0.06] text-[9px] font-mono font-semibold text-emerald-400 border border-emerald-500/20">
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
                          <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none text-emerald-400">
                            <Phone className="w-4 h-4" />
                          </div>
                          <input
                            type="tel"
                            placeholder="+91 98123 45678"
                            className="w-full bg-black/50 border border-white/15 rounded-xl pl-10 pr-3 py-3 text-textMain placeholder:text-textMain/25 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-all text-sm font-medium font-mono"
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
                              ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:opacity-95'
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
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
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
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Encrypted Telemetry
                    </span>
                    <Link to="/consent" className="text-emerald-400 hover:underline">
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
                How Dhwani AI <span className="font-serif italic font-normal text-emerald-400 text-3xl sm:text-4xl">Neutralizes</span> Impersonation
              </h2>
              <p className="text-xs sm:text-sm text-white/60">
                A multi-layered defense pipeline combining physical acoustic feature extraction with deep semantic intent modeling.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="glass-card p-6 rounded-2xl border-white/[0.08] space-y-3 hover:border-emerald-500/30 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Browser DSP Feature Tap</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Extracts 13-band MFCC coefficients, spectral flux, and pitch jitter in-browser with 0ms roundtrip delay. Pinpoints mathematical anomalies unique to synthetic voice models.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card p-6 rounded-2xl border-white/[0.08] space-y-3 hover:border-cyan-500/30 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Zero-Hop Edge STT</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Audio flows directly to Deepgram edge servers via WebSocket tokens, delivering real-time multilingual transcription (Hindi, Indian English) without server bottlenecks.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card p-6 rounded-2xl border-white/[0.08] space-y-3 hover:border-amber-500/30 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
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
