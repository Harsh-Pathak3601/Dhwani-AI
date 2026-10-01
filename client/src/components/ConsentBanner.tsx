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
import { motion } from 'framer-motion';

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
        <p className="text-xs text-textMain/70 leading-relaxed">{description}</p>
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

      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Scanner
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
          {/* Left Column: Privacy Architecture & Safeguards (Equal 50% width) */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                DPDP Act 2023 Compliant
              </div>

              <h1 className="text-2xl sm:text-4xl font-black font-brand-display tracking-tight text-white leading-tight">
                Privacy Safeguards &amp;{' '}
                <span className="font-serif italic font-normal text-amber-400 text-3xl sm:text-5xl block sm:inline">
                  Telemetry Consent
                </span>
              </h1>

              <p className="font-satisfy text-lg text-amber-300 font-normal">
                &ldquo;Your voice, your protection, your control.&rdquo;
              </p>

              <p className="text-sm sm:text-base text-textMain/80 leading-relaxed">
                Dhwani AI is architected with strict Zero-Knowledge and Data Minimization principles. Before initializing live voice analysis, review the automated technical guarantees below:
              </p>
            </div>

            {/* Info Cards */}
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <InfoCard
                icon={<Mic className="w-5 h-5 text-orange-400" />}
                title="Ephemeral Zero-Retention Streaming"
                description="Audio frames are processed directly in-memory to detect acoustic artifacts. No raw voice audio is ever written to disk or stored on external servers."
                delay={0.15}
                accentColor="#FF6D00"
              />
              <InfoCard
                icon={<ShieldCheck className="w-5 h-5 text-amber-400" />}
                title="Automatic PII Redaction"
                description="Sensitive data — Aadhaar IDs, bank account digits, PAN numbers, and OTPs — are automatically recognized by Groq LPU and replaced with cryptographic redaction markers before report generation."
                delay={0.25}
                accentColor="#FFAB00"
              />
              <InfoCard
                icon={<Eye className="w-5 h-5 text-yellow-400" />}
                title="Client-Side Acoustic DSP Telemetry"
                description="Spectral flux, MFCC envelope smoothness, and micro-jitter vectors are calculated locally in your browser's WebAudio DSP thread, ensuring zero privacy leakage."
                delay={0.35}
                accentColor="#FFA000"
              />
            </div>

            {/* Legal Notice Box */}
            <div className="p-4 rounded-xl bg-black/60 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Statutory Compliance Notice
                </span>
              </div>
              <p className="text-xs text-textMain/60 leading-relaxed">
                Operating in compliance with the Digital Personal Data Protection (DPDP) Act 2023, Information Technology Act 2000, and Indian Supreme Court cyber-fraud directives. Telemetry features expire automatically upon call termination.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Consent & Activation Card (Equal 50% width, matching height) */}
          <div className="flex flex-col h-full">
            <div className="glass-card-strong p-6 sm:p-8 lg:p-9 gradient-border rounded-2xl shadow-2xl flex flex-col justify-between h-full space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/15 border border-orange-500/40 flex items-center justify-center p-1.5 shadow-lg shadow-orange-500/20">
                    <img
                      src="/Dhwani_AI_transparent_512x512.png"
                      alt="Dhwani AI Shield"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Activate Protection</h3>
                    <p className="text-xs text-white/60 mt-0.5">Confirm consent to begin real-time monitoring</p>
                  </div>
                </div>
              </div>

              {/* Pre-Flight Checklist */}
              <div className="space-y-3 p-4 sm:p-5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 mb-2 flex items-center justify-between">
                  <span>Pre-Flight Security Armed</span>
                  <span className="text-[10px] text-white/40 font-mono">0-LATENCY DSP</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <FileCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Microphone parallel acoustic tap activated</span>
                    <p className="text-[11px] text-white/50">High-frequency Nyquist spectral analysis active in browser</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <FileCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Real-time Groq semantic scam classifier armed</span>
                    <p className="text-[11px] text-white/50">Sub-400ms neural LPU inference stream ready</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <FileCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Sub-second counter-coaching cards enabled</span>
                    <p className="text-[11px] text-white/50">Heads-up tactical advisory HUD overlays primed</p>
                  </div>
                </div>
              </div>

              {/* Security Telemetry Specs Bar */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center font-mono">
                <div className="px-2 py-1">
                  <div className="text-[10px] text-white/40 uppercase">Cipher</div>
                  <div className="text-xs font-bold text-amber-400">AES-256</div>
                </div>
                <div className="px-2 py-1 border-x border-white/[0.06]">
                  <div className="text-[10px] text-white/40 uppercase">Retention</div>
                  <div className="text-xs font-bold text-amber-400">0s / RAM</div>
                </div>
                <div className="px-2 py-1">
                  <div className="text-[10px] text-white/40 uppercase">AASIST DSP</div>
                  <div className="text-xs font-bold text-amber-400">16kHz Tap</div>
                </div>
              </div>

              {/* Consent Toggle Button */}
              <button
                type="button"
                onClick={toggleAgreed}
                className={`w-full flex items-start gap-3.5 p-4 rounded-xl transition-all duration-200 border cursor-pointer ${
                  agreed
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-black/50 hover:bg-black/70 border-white/10 hover:border-amber-500/30'
                } group text-left`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
                    agreed
                      ? 'bg-amber-500 border-amber-500 shadow-md shadow-amber-500/40'
                      : 'border-white/30 group-hover:border-amber-400/60'
                  }`}
                >
                  {agreed && <Check className="w-3.5 h-3.5 text-slate-950" strokeWidth={3.5} />}
                </div>

                <div className="flex-1">
                  <span
                    className={`text-xs sm:text-sm leading-relaxed transition-colors duration-200 ${
                      agreed ? 'text-white font-semibold' : 'text-white/70'
                    }`}
                  >
                    I acknowledge and agree to start recording this call for my protection.
                  </span>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Microphone stream remains local &amp; ephemeral with automatic PII masking.
                  </p>
                </div>
              </button>

              {/* Action Button */}
              <div className="space-y-2.5">
                <button
                  onClick={handleConfirm}
                  disabled={!agreed}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer ${
                    agreed
                      ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.01] active:scale-[0.99]'
                      : 'bg-white/[0.06] text-white/30 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {agreed ? (
                    <>
                      <ShieldCheck className="w-5 h-5 text-slate-950" />
                      <span>Confirm &amp; Start Recording</span>
                      <ArrowRight className="w-5 h-5 text-slate-950" />
                    </>
                  ) : (
                    <span>Accept terms to continue</span>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-white/40">
                  <Lock className="w-3 h-3 text-amber-500/70" />
                  <span>Statutory compliance DPDP Act 2023 • In-memory telemetry only</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConsentBanner;
