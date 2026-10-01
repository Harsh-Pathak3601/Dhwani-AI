import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  Check,
  Radio,
  CheckCircle2,
  Lock,
  ArrowRight,
  PhoneCall,
  Sparkles,
  ShieldAlert,
  Zap,
  Activity,
  Cpu,
  Layers,
  EyeOff,
  Flame,
  Fingerprint,
  Globe
} from 'lucide-react';
import MobileDeviceFrame from './MobileDeviceFrame';
import { INDIAN_ACCENTS, applyFullPageTranslation, getSavedLanguageCode, AccentLanguage } from '../i18n/googleTranslate';

// ─── CONFIGURATION: UPDATE YOUR DIRECT APK URL HERE ───
// You can replace this with any hosted APK link (e.g. S3, GitHub Release, or custom CDN)
export const APK_CONFIG = {
  downloadUrl: (import.meta.env.VITE_APK_URL as string) || '/dhwani-ai-v1.2.apk',
  version: 'v1.2.0-stable',
  fileSize: '28.4 MB',
  releaseDate: 'October 2026',
  packageName: 'com.dhwani.shield',
};

// ─── CUSTOM SCREENSHOT SLOTS ───
// When you have your actual app UI images, set their paths here (e.g. '/images/app-home.png')
// If set to null, the built-in interactive high-fidelity UI will be displayed!
export const APP_SCREENSHOTS = {
  home: null as string | null,
  callAlert: null as string | null,
  permissions: null as string | null,
};

export default function DownloadView() {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [activeLangCode, setActiveLangCode] = useState<string>('en');

  React.useEffect(() => {
    setActiveLangCode(getSavedLanguageCode());
  }, []);

  const handleDownload = () => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = APK_CONFIG.downloadUrl;
    link.download = APK_CONFIG.downloadUrl.split('/').pop() || 'dhwani-ai-v1.2.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadStarted(false);
    }, 4500);
  };

  const architectureFeatures = [
    {
      title: 'Zero-Lag Sidecar Tap',
      badge: 'AUDIO WORKLET',
      desc: 'Hooks into the incoming telephony audio stream via native Android 10+ capture. Adds 0ms conversational latency while analyzing acoustic harmonics in parallel.',
      icon: Activity,
      color: 'text-amber-400',
      bgGlow: 'from-orange-500/15 via-amber-500/5 to-transparent',
      border: 'border-orange-500/25',
    },
    {
      title: 'AASIST Neural Voting',
      badge: 'SPEECH FORENSICS',
      desc: 'Sub-400ms neural inference inspects high-frequency spectral artifacts, synthetic vocoder harmonics, and phase discontinuities to detect cloned voices.',
      icon: Cpu,
      color: 'text-orange-400',
      bgGlow: 'from-amber-500/15 via-orange-500/5 to-transparent',
      border: 'border-amber-500/25',
    },
    {
      title: 'In-Call Floating Intervention',
      badge: 'SYSTEM HUD',
      desc: 'Injects a high-priority heads-up warning directly over active calls (Cellular, WhatsApp, Telegram) with instant VAS score and UPI pre-transaction hold.',
      icon: PhoneCall,
      color: 'text-red-400',
      bgGlow: 'from-red-500/15 via-orange-500/5 to-transparent',
      border: 'border-red-500/25',
    },
    {
      title: 'Volatile RAM Quarantine',
      badge: 'DPDP 2023 VAULT',
      desc: 'Audio chunks exist strictly in volatile RAM for under 500ms and are immediately wiped. Your conversations are NEVER written to disk, cache, or external servers.',
      icon: EyeOff,
      color: 'text-emerald-400',
      bgGlow: 'from-emerald-500/15 via-teal-500/5 to-transparent',
      border: 'border-emerald-500/25',
    },
  ];

  const privacyGuarantees = [
    {
      title: 'What Stays 100% On-Device',
      badge: 'PROTECTED',
      badgeStyle: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      items: [
        'Local PCM feature extraction runs inside the phone sandbox',
        'Voice liveness challenge prompts evaluated in real-time RAM',
        'Contacts & phone numbers remain exclusively on the device',
        'Operates fully autonomous even without active internet connection',
      ],
    },
    {
      title: 'What Dhwani Never Touches',
      badge: 'ZERO TELEMETRY',
      badgeStyle: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      items: [
        'NO call audio is ever recorded, stored on disk, or saved to media',
        'NO voice samples are sent to cloud servers for model training',
        'NO background telemetry tracking, advertising IDs, or metadata harvest',
        'NO contact list syncing or call history uploads of any kind',
      ],
    },
  ];

  const systemSpecs = [
    { label: 'Compatible Platforms', value: 'Android 10.0 to Android 15 (ARM64-v8a)' },
    { label: 'Memory Footprint', value: 'Lightweight (~48 MB idle, ~120 MB during active call tap)' },
    { label: 'Required Permission', value: 'SYSTEM_ALERT_WINDOW (Display over apps for HUD alerts)' },
    { label: 'Privacy Framework', value: 'Digital Personal Data Protection Act (DPDP 2023) Enforced' },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col relative overflow-hidden pb-24 selection:bg-amber-500/30 selection:text-amber-200">
      {/* ─── Ambient Glow & Futuristic Backdrop ─── */}
      <div className="animated-grid-bg opacity-25 fixed inset-0 pointer-events-none" />
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-orange-500/15 via-amber-500/10 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[60%] -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* ─── 1. UNIQUE HERO COMMAND SECTION ─── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-16 text-center">

        {/* Brand Shield Lockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border border-amber-500/30 shadow-[0_0_25px_rgba(255,109,0,0.15)] mb-8 backdrop-blur-xl"
        >
          <div className="w-6 h-6 rounded-lg bg-orange-500/30 border border-orange-500/40 p-1 flex items-center justify-center">
            <img
              src="/Dhwani_AI_transparent_512x512.png"
              alt="Dhwani Shield"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-brand font-black text-xs uppercase tracking-widest text-white">
            Dhwani AI Telephony Sentinel
          </span>
          <span className="text-white/30">•</span>
          <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full">
            {APK_CONFIG.version}
          </span>
        </motion.div>

        {/* Distinctive Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black font-brand-display tracking-tight text-white leading-[1.08] mb-6"
        >
          Zero-Lag Acoustic Defense{' '}
          <span className="font-serif italic font-normal text-amber-400 text-5xl sm:text-7xl lg:text-8xl block mt-2">
            for Your Smartphone.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed font-light mb-10"
        >
          Stop deepfake voice impersonation, synthesized extortion, and digital arrest traps directly on your Android device in real-time.
        </motion.p>

        {/* Standalone High-Impact Download Engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center justify-center max-w-md mx-auto"
        >
          <button
            onClick={handleDownload}
            data-testid="primary-download-apk"
            className="w-full py-4 sm:py-5 px-8 rounded-2xl flex items-center justify-center gap-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 hover:from-orange-600 hover:to-amber-500 text-slate-950 font-black text-base sm:text-lg shadow-[0_10px_40px_rgba(255,109,0,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
          >
            <Download className="w-5 h-5 text-slate-950 group-hover:-translate-y-0.5 transition-transform" />
            <span>Download APK Package</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-black/15 font-mono text-slate-950/90 font-bold ml-1">
              {APK_CONFIG.fileSize}
            </span>
          </button>

          {/* Download Started Feedback Toast */}
          <AnimatePresence>
            {downloadStarted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-semibold shadow-lg shadow-emerald-500/10"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                <span>Download initiated! Check your Android notification drawer.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Minimalist Trust Chips (No QR, No SHA-256) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-white/50 font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>DPDP Act 2023 Compliant</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>No Root Required</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>Zero Audio Retention</span>
            </div>
          </div>

          {/* ─── MULTILINGUAL INDIAN ACCENT TRANSLATION BAR ─── */}
          <div className="mt-9 pt-6 border-t border-white/[0.08] w-full max-w-2xl mx-auto notranslate">
            <div className="flex items-center justify-center gap-2 text-xs text-amber-400/90 mb-3 font-mono font-medium">
              <Globe className="w-3.5 h-3.5" />
              <span>Translate Entire Website into Your Regional Indian Accent:</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {INDIAN_ACCENTS.map((accent: AccentLanguage) => {
                const isActive = activeLangCode === accent.code;
                return (
                  <button
                    key={accent.code}
                    type="button"
                    onClick={() => {
                      setActiveLangCode(accent.code);
                      applyFullPageTranslation(accent.code);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-slate-950 font-black shadow-lg shadow-orange-500/25 ring-2 ring-amber-400/50'
                        : 'bg-white/[0.05] hover:bg-white/[0.1] text-white/80 border border-white/10 hover:border-amber-400/40 hover:text-white'
                    }`}
                  >
                    <span>{accent.nativeName}</span>
                    <span className={`text-[10px] ${isActive ? 'text-slate-950/80 font-bold' : 'text-white/40'} font-mono`}>
                      ({accent.name})
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-white/40 mt-2.5 font-mono text-center">
              Powered by real-time neural translation • Automatically adapts DSP audio recognition
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─── 2. THE 3-MOBILE PANORAMIC STAGE (SIDE-BY-SIDE USING MobileDeviceFrame) ─── */}
      <section className="relative z-10 py-16 sm:py-24 border-y border-white/[0.08] bg-[#070b10]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Triple-Layer Mobile Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black font-brand-display text-white tracking-tight mb-3">
              Experience the Mobile Sentinel
            </h2>
            <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto font-light">
              How Dhwani AI sits invisibly in memory to guard cellular calls, VoIP streams, and financial channels.
            </p>
          </div>

          {/* ── 3 MOBILES SIDE-BY-SIDE ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-stretch justify-center">

            {/* ═══ PHONE 1: AMBIENT RADAR (HOME) ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center group"
            >
              <div className="w-full flex justify-center relative">
                <MobileDeviceFrame
                  isCallActive={false}
                  className="hover:scale-[1.02] transition-transform duration-500 shadow-2xl"
                >
                  {APP_SCREENSHOTS.home ? (
                    <img
                      src={APP_SCREENSHOTS.home}
                      alt="Dhwani AI App Home Screen"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* High Fidelity Home Screen UI */
                    <div className="flex-1 flex flex-col justify-between p-4 pt-1 text-left relative overflow-hidden select-none">
                      {/* Top Bar */}
                      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 pt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/40 p-1 flex items-center justify-center">
                            <img src="/Dhwani_AI_transparent_512x512.png" alt="Dhwani" className="w-full h-full object-contain" />
                          </div>
                          <span className="text-xs font-bold text-white font-brand">Dhwani AI Sentinel</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                          STANDBY
                        </span>
                      </div>

                      {/* Main Gauge Graphic */}
                      <div className="my-auto text-center space-y-4 py-4">
                        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-ping opacity-25" />
                          <div className="absolute inset-1 rounded-full border border-dashed border-amber-400/40 animate-spin" style={{ animationDuration: '14s' }} />
                          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent border border-amber-500/40 flex flex-col items-center justify-center p-2">
                            <span className="text-2xl font-black text-amber-400 font-brand">98.7%</span>
                            <span className="text-[9px] uppercase tracking-wider text-white/50 font-bold">Biometric Safety</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white tracking-tight">Spectral Acoustic Tap</h4>
                          <p className="text-[11px] text-white/50">Zero in-call lag DSP sidecar active</p>
                        </div>
                      </div>

                      {/* Quick Protection Toggle */}
                      <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-semibold text-white/80">Auto Scam Intercept</span>
                        </div>
                        <div className="w-9 h-5 rounded-full bg-orange-500 p-0.5 flex justify-end">
                          <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                        </div>
                      </div>
                    </div>
                  )}
                </MobileDeviceFrame>
              </div>

              {/* Card Label Underneath */}
              <div className="text-center mt-6 space-y-1">
                <span className="font-brand font-bold text-base text-white/90 group-hover:text-amber-400 transition-colors duration-300 block">
                  01. Ambient Voice Radar
                </span>
                <p className="text-xs text-white/50 font-light">
                  Continuous frequency monitoring &amp; biometric trust score
                </p>
              </div>
            </motion.div>

            {/* ═══ PHONE 2: LIVE CALL OVERLAY WARNING (ELEVATED HERO CARD) ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-col items-center group relative md:-translate-y-2"
            >
              <div className="w-full flex justify-center relative">
                {/* Visual Elevation Glow for Center Card */}
                <div className="absolute -inset-2 bg-gradient-to-b from-red-500/20 via-orange-500/10 to-transparent rounded-[60px] blur-xl opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none -z-10" />

                <MobileDeviceFrame
                  isCallActive={true}
                  className="hover:scale-[1.02] transition-transform duration-500 shadow-2xl"
                >
                  {APP_SCREENSHOTS.callAlert ? (
                    <img
                      src={APP_SCREENSHOTS.callAlert}
                      alt="Dhwani AI Call Overlay Warning"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* High Fidelity In-Call Threat HUD UI */
                    <div className="flex-1 flex flex-col justify-between p-4 pt-1 text-left relative overflow-hidden select-none">
                      {/* Incoming Call Header */}
                      <div className="text-center pt-2 border-b border-white/[0.06] pb-3">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-bold block mb-1">
                          Incoming Call
                        </span>
                        <h4 className="text-base font-black text-white tracking-tight">
                          +91 98123 45678
                        </h4>
                        <div className="inline-flex items-center gap-1.5 text-[10px] text-amber-400 font-mono mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          <span>Acoustic Tap Active</span>
                        </div>
                      </div>

                      {/* FLOATING INTERVENTION THREAT CARD */}
                      <div className="my-auto space-y-2.5">
                        <div className="p-4 rounded-2xl bg-red-950/90 border border-red-500/70 shadow-[0_0_35px_rgba(239,68,68,0.4)] backdrop-blur-xl relative overflow-hidden animate-pulse">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span className="font-brand uppercase tracking-wider">CRITICAL THREAT</span>
                            </div>
                            <span className="text-[10px] font-mono font-black text-red-100 bg-red-600/40 border border-red-500/50 px-2 py-0.5 rounded-full">
                              94% VAS
                            </span>
                          </div>

                          <p className="text-[11px] text-white/95 font-semibold leading-snug">
                            AI Voice Clone detected! High frequency acoustic anomalies &amp; extortion markers.
                          </p>

                          <div className="mt-2.5 pt-2 border-t border-red-500/30 flex items-center justify-between text-[10px] text-red-200/90 font-mono">
                            <span>DSP: AASIST Neural Tap</span>
                            <span className="text-amber-300 font-bold">DO NOT SEND OTP</span>
                          </div>
                        </div>

                        {/* Pre-Transaction UPI Hold Pill */}
                        <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                            <span className="font-semibold text-[11px]">Hold Outgoing UPI</span>
                          </div>
                          <span className="text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded text-amber-300">HELD</span>
                        </div>
                      </div>

                      {/* Bottom Quick Controls */}
                      <div className="pt-2 border-t border-white/[0.06] space-y-2">
                        <button className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30">
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>End Scam Call Now</span>
                        </button>
                        <p className="text-[9px] text-center text-white/40 font-mono">
                          Dhwani AI In-Call Interceptor
                        </p>
                      </div>
                    </div>
                  )}
                </MobileDeviceFrame>
              </div>

              {/* Card Label Underneath */}
              <div className="text-center mt-6 space-y-1">
                <span className="font-brand font-bold text-base text-white/90 group-hover:text-red-400 transition-colors duration-300 block">
                  02. Real-Time Intervention HUD
                </span>
                <p className="text-xs text-white/50 font-light">
                  Active floating warning card with voice cloning confidence
                </p>
              </div>
            </motion.div>

            {/* ═══ PHONE 3: PRIVACY VAULT ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center group"
            >
              <div className="w-full flex justify-center relative">
                <MobileDeviceFrame
                  isCallActive={false}
                  className="hover:scale-[1.02] transition-transform duration-500 shadow-2xl"
                >
                  {APP_SCREENSHOTS.permissions ? (
                    <img
                      src={APP_SCREENSHOTS.permissions}
                      alt="Dhwani AI Permissions Setup"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* High Fidelity Permissions Setup UI */
                    <div className="flex-1 flex flex-col justify-between p-4 pt-1 text-left relative overflow-hidden select-none">
                      <div className="pt-1 border-b border-white/[0.08] pb-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-md bg-cyan-500/20 flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-cyan-400" />
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                            Android 10+ Security
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white">App Permissions</h4>
                        <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">
                          Enable system access for live call inspection:
                        </p>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-2.5 my-auto">
                        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">Draw over other apps</span>
                            <div className="w-8 h-4.5 rounded-full bg-cyan-500 p-0.5 flex justify-end">
                              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
                            </div>
                          </div>
                          <p className="text-[10px] text-white/40">Displays real-time threat cards</p>
                        </div>

                        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">Acoustic Audio Tap</span>
                            <div className="w-8 h-4.5 rounded-full bg-cyan-500 p-0.5 flex justify-end">
                              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
                            </div>
                          </div>
                          <p className="text-[10px] text-white/40">Parallel voice frequency analysis</p>
                        </div>

                        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">DPDP 2023 Shield</span>
                            <Check className="w-4 h-4 text-emerald-400" />
                          </div>
                          <p className="text-[10px] text-white/40">Zero telemetry audio retention</p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-[10px] font-semibold text-emerald-300">Ready to protect calls</span>
                      </div>
                    </div>
                  )}
                </MobileDeviceFrame>
              </div>

              {/* Card Label Underneath */}
              <div className="text-center mt-6 space-y-1">
                <span className="font-brand font-bold text-base text-white/90 group-hover:text-cyan-400 transition-colors duration-300 block">
                  03. DPDP 2023 Vault
                </span>
                <p className="text-xs text-white/50 font-light">
                  Simple 1-tap overlay &amp; mic tap configuration
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── 3. DHWANI ON-DEVICE DEFENSE PIPELINE (REPLACING GENERIC 4 BOXES) ─── */}
      <section className="relative z-10 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Proprietary Defense Stack</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-brand-display text-white tracking-tight mb-3">
            How Dhwani AI Shields Your Calls
          </h2>
          <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto font-light">
            Engineered from first acoustic principles to defeat even the most deceptive ElevenLabs and VALL-E vocal clones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {architectureFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`glass-card-strong p-8 rounded-3xl relative overflow-hidden group hover:${feat.border} hover:-translate-y-1 transition-all duration-300 shadow-xl`}
              >
                {/* Glow backdrop */}
                <div className={`absolute -inset-1 bg-gradient-to-br ${feat.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none -z-10`} />

                <div className="flex items-start justify-between mb-5">
                  <div className="w-13 h-13 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center p-3 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <Icon className={`w-6 h-6 ${feat.color}`} />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-white/60">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold font-brand-display text-white mb-2.5 tracking-tight">
                  {feat.title}
                </h3>

                <p className="text-sm text-white/60 leading-relaxed font-light">
                  {feat.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── 4. EXECUTIVE PRIVACY GUARANTEE MATRIX (REPLACING GENERIC AMBER BOX) ─── */}
      <section className="relative z-10 py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Zero-Knowledge Telemetry</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black font-brand-display text-white tracking-tight mb-2">
            DPDP Act 2023 Technical Safeguards
          </h2>
          <p className="text-sm text-white/60 max-w-lg mx-auto font-light">
            Architected so that your personal conversations can never be intercepted, stored, or leaked.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {privacyGuarantees.map((column, i) => (
            <motion.div
              key={column.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass-card-strong p-7 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
                <h3 className="text-lg font-bold font-brand text-white">
                  {column.title}
                </h3>
                <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${column.badgeStyle}`}>
                  {column.badge}
                </span>
              </div>

              <ul className="space-y-4">
                {column.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-md bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-amber-400">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs sm:text-sm text-white/75 font-light leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── 5. HARDWARE & COMPATIBILITY HUB ─── */}
      <section className="relative z-10 py-16 pb-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold font-brand-display text-white mb-6">
          Device Compatibility
        </h2>

        <div className="glass-card-strong p-6 sm:p-8 rounded-3xl text-left border-white/10 shadow-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {systemSpecs.map((spec, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-1">
                  {spec.label}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-white/90 block">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-white/50 font-mono">
              Build Version: {APK_CONFIG.version} • Standalone APK
            </span>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer group"
            >
              <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span>Download Signed Package ({APK_CONFIG.fileSize})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
