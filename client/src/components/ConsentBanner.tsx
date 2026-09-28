import { useState, useCallback, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mic,
  ShieldCheck,
  Eye,
  ArrowRight,
  Check,
  Scale,
  ArrowLeft,
  Lock,
  FileCheck
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';

interface InfoCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay: number;
  accentColor: string;
}

function InfoCard({ icon, title, description, delay, accentColor }: InfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="glass-card p-4 flex items-start gap-4 rounded-xl border border-white/[0.08]"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${accentColor}18` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
        <p className="text-xs text-textMain/60 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

const ConsentBanner = () => {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleConfirm = useCallback(() => {
    if (!agreed) return;
    navigate('/session');
  }, [agreed, navigate]);

  const toggleAgreed = useCallback(() => {
    setAgreed((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col justify-between bg-transparent text-white">
      <div className="animated-grid-bg opacity-40" />

      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Scanner
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Privacy Architecture & Safeguards (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                DPDP Act 2023 Compliant
              </div>

              <h1 className="text-3xl sm:text-4xl font-black font-brand-display tracking-tight text-white">
                Privacy Safeguards &amp;{' '}
                <span className="font-serif italic font-normal text-emerald-400 text-4xl sm:text-5xl">
                  Telemetry Consent
                </span>
              </h1>

              <p className="font-satisfy text-lg text-teal-300/90 font-normal">
                &ldquo;Your voice, your protection, your control.&rdquo;
              </p>

              <p className="text-sm sm:text-base text-textMain/70 leading-relaxed">
                Dhwani AI is architected with strict Zero-Knowledge and Data Minimization principles. Before initializing live voice analysis, review the automated technical guarantees below:
              </p>
            </div>

            {/* Info Cards */}
            <div className="space-y-3">
              <InfoCard
                icon={<Mic className="w-5 h-5 text-primary" />}
                title="Ephemeral Zero-Retention Streaming"
                description="Audio frames are processed directly in-memory to detect acoustic artifacts. No raw voice audio is ever written to disk or stored on external servers."
                delay={0.15}
                accentColor="#1D9E75"
              />
              <InfoCard
                icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
                title="Automatic PII Redaction"
                description="Sensitive data — Aadhaar IDs, bank account digits, PAN numbers, and OTPs — are automatically recognized by Groq LPU and replaced with cryptographic redaction markers before report generation."
                delay={0.25}
                accentColor="#34D399"
              />
              <InfoCard
                icon={<Eye className="w-5 h-5 text-sky-400" />}
                title="Client-Side Acoustic DSP Telemetry"
                description="Spectral flux, MFCC envelope smoothness, and micro-jitter vectors are calculated locally in your browser's WebAudio DSP thread, ensuring zero privacy leakage."
                delay={0.35}
                accentColor="#38BDF8"
              />
            </div>

            {/* Legal Notice Box */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Statutory Compliance Notice
                </span>
              </div>
              <p className="text-xs text-textMain/50 leading-relaxed">
                Operating in compliance with the Digital Personal Data Protection (DPDP) Act 2023, Information Technology Act 2000, and Indian Supreme Court cyber-fraud directives. Telemetry features expire automatically upon call termination.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Consent & Activation Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="glass-card-strong p-6 sm:p-8 gradient-border rounded-2xl shadow-2xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center p-1 shadow-md">
                  <img
                    src="/Dhwani_AI_transparent_512x512.png"
                    alt="Dhwani AI Shield"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Activate Protection</h3>
                  <p className="text-xs text-white/50">Confirm consent to begin real-time monitoring</p>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/80">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Microphone parallel acoustic tap activated</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time Groq semantic scam classifier armed</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sub-second counter-coaching cards enabled</span>
                </div>
              </div>

              {/* Consent Toggle Button */}
              <button
                type="button"
                onClick={toggleAgreed}
                className="w-full flex items-start gap-3 p-3.5 rounded-xl transition-all duration-200 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 group text-left cursor-pointer"
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
                    agreed
                      ? 'bg-primary border-primary shadow-md shadow-primary/20'
                      : 'border-white/20 group-hover:border-white/40'
                  }`}
                >
                  {agreed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>

                <span
                  className={`text-xs sm:text-sm leading-relaxed transition-colors duration-200 ${
                    agreed ? 'text-white font-medium' : 'text-white/60'
                  }`}
                >
                  I acknowledge and agree to start recording this call for my protection.
                </span>
              </button>

              {/* Action Button */}
              <button
                onClick={handleConfirm}
                disabled={!agreed}
                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                  agreed
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:opacity-95'
                    : 'bg-white/[0.08] text-white/30 cursor-not-allowed border border-white/5'
                }`}
              >
                {agreed ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Confirm &amp; Start Recording</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </>
                ) : (
                  <span>Accept terms to continue</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConsentBanner;
