import { useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mic,
  ShieldCheck,
  Eye,
  ArrowRight,
  Check,
  Scale,
} from 'lucide-react';
import { motion } from 'framer-motion';

/* ─── Info Card ─── */

interface InfoCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay: number;
  accentColor: string;
}

/**
 * Represents a structured layout for displaying key privacy guarantees.
 * Property bindings inject specific icons and texts.
 * Custom opacity styling (`accentColor` appended with `15` for 15% hex opacity)
 * is applied to the background to create a subtle tinted background matching the icon color.
 */
function InfoCard({ icon, title, description, delay, accentColor }: InfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="glass-card p-4 flex items-start gap-3.5"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${accentColor}15` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-textMain mb-0.5">{title}</h4>
        <p className="text-xs text-textMain/50 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─── */

const ConsentBanner = () => {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleConfirm = useCallback(() => {
    if (agreed) {
      navigate('/session');
    }
  }, [agreed, navigate]);

  const toggleAgreed = useCallback(() => {
    setAgreed((prev) => !prev);
  }, []);

  /**
   * Framer Motion transition animations:
   * Defines a `spring` physics model to scale and translate the main consent card into view.
   * - stiffness: 260 (determines the tension, making it snap into place quickly)
   * - damping: 24 (controls the friction to prevent excessive bouncing)
   * - mass: 0.8 (lightens the object for a faster, snappier feel)
   */
  const cardVariants: import('framer-motion').Variants = {
    initial: {
      opacity: 0,
      y: 60,
      scale: 0.96,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 24,
        mass: 0.8,
      },
    },
  };

  return (
    <div className="min-h-dvh relative flex flex-col items-center justify-center">

      <div className="animated-grid-bg" />


      <div className="fixed top-[10%] right-[-20%] w-[50vw] h-[50vw] rounded-full bg-primary/[0.03] blur-[80px] pointer-events-none" />
      <div className="fixed bottom-[10%] left-[-15%] w-[40vw] h-[40vw] rounded-full bg-primary/[0.04] blur-[60px] pointer-events-none" />


      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        className="relative z-10 w-full max-w-lg mx-auto px-5 py-8"
      >
        <div className="glass-card-strong p-6 flex flex-col gap-5 gradient-border">
          {/* ─── Header ─── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col items-center gap-3 pt-1"
          >

            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-primary/10 shadow-[0_0_16px_rgba(29,158,117,0.25)]" />
              </div>
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 via-slate-900/60 to-primary/10 border border-primary/40 flex items-center justify-center p-1.5 shadow-lg shadow-primary/20 overflow-hidden backdrop-blur-xl">
                <img
                  src="/Dhwani_AI_transparent_512x512.png"
                  alt="Dhwani AI Shield"
                  className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(29,158,117,0.4)]"
                />
              </div>
            </div>

            <div className="text-center">
              <span className="font-brand text-sm font-black uppercase tracking-widest text-primary block mb-1" style={{fontFamily: "'Outfit', sans-serif", letterSpacing: '0.08em'}}>
                Dhwani AI Protection
              </span>
              <h2 className="text-2xl font-bold text-textMain tracking-tight">
                Privacy &amp; Consent
              </h2>
              <p className="text-xs text-textMain/40 mt-1">
                Your protection, your control
              </p>
            </div>
          </motion.div>

          {/* ─── Info Cards ─── */}
          <div className="flex flex-col gap-3">
            <InfoCard
              icon={<Mic className="w-4.5 h-4.5 text-primary" />}
              title="Real-time Streaming"
              description="Audio is streamed in real-time for analysis. Nothing is ever stored on our servers."
              delay={0.35}
              accentColor="#1D9E75"
            />
            <InfoCard
              icon={<ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />}
              title="Auto PII Scrubbing"
              description="Personal data — Aadhaar, bank details, PAN — is automatically detected and scrubbed."
              delay={0.5}
              accentColor="#34D399"
            />
            <InfoCard
              icon={<Eye className="w-4.5 h-4.5 text-sky-400" />}
              title="Voice Feature Telemetry (DPDP Act 2023)"
              description="Acoustic features (MFCC, pitch jitter) are extracted locally in your browser. Raw voice audio is never stored."
              delay={0.65}
              accentColor="#38BDF8"
            />
          </div>

          {/* ─── Legal Text Box ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.4 }}
            className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-3.5 h-3.5 text-textMain/40" />
              <span className="text-[11px] font-semibold text-textMain/50 uppercase tracking-wider">
                Legal Notice &amp; DPDP Compliance
              </span>
            </div>
            <p className="text-[11px] text-textMain/40 leading-relaxed">
              Under the Digital Personal Data Protection (DPDP) Act 2023, IT Act 2000, and Supreme Court 2025–26 anti-fraud directives, acoustic fraud detection operates on non-reversible feature vectors with a 90-day auto-expiry lifecycle.
            </p>
          </motion.div>

          {/* ─── Consent Checkbox ─── */}
          {/*
           * Checkbox toggles and active state mapping:
           * Maps the `agreed` boolean state to conditional CSS classes, driving background colors,
           * border glow, and text opacities. Also coordinates the spring-based checkmark scale animation.
           */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.4 }}
          >
            <button
              type="button"
              onClick={toggleAgreed}
              className="w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-white/[0.03] group text-left"
            >

              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
                  agreed
                    ? 'bg-primary border-primary shadow-md shadow-primary/20'
                    : 'border-white/20 group-hover:border-white/40'
                }`}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: agreed ? 1 : 0,
                    opacity: agreed ? 1 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </motion.div>
              </div>


              <span
                className={`text-sm leading-relaxed transition-colors duration-200 ${
                  agreed ? 'text-textMain' : 'text-textMain/60'
                }`}
              >
                I acknowledge and agree to start recording this call for my
                protection.
              </span>
            </button>
          </motion.div>

          {/* ─── Confirm Button ─── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.4 }}
          >
            <motion.button
              onClick={handleConfirm}
              disabled={!agreed}
              whileTap={agreed ? { scale: 0.97 } : undefined}
              whileHover={agreed ? { scale: 1.01 } : undefined}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                agreed
                  ? 'bg-gradient-to-r from-primary to-emerald-500 text-white shadow-lg shadow-primary/25 animate-pulse-glow'
                  : 'bg-white/[0.06] text-textMain/25 cursor-not-allowed'
              }`}
            >
              {agreed ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm &amp; Start Recording</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <span>Accept terms to continue</span>
              )}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ConsentBanner;
