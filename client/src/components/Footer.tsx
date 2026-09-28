import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Radio, PhoneCall, LayoutDashboard } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Caller Scanner', path: '/app', icon: PhoneCall },
    { name: 'Call Cockpit', path: '/session', icon: Radio },
    { name: 'Architecture', path: '/architecture', icon: ShieldCheck },
    { name: 'Cases & Triage', path: '/dashboard', icon: LayoutDashboard },
    { name: 'DPDP Privacy', path: '/consent', icon: Lock },
  ];

  return (
    <footer className="w-full border-t border-white/[0.08] bg-transparent text-white/70 py-10 px-4 sm:px-6 lg:px-8 mt-auto relative z-10">
      <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-6">
        
        {/* Brand Lockup matching Project Style */}
        <div className="flex flex-col items-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/30 via-slate-900/60 to-primary/10 border border-primary/40 flex items-center justify-center p-1 shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <img
                src="/Dhwani_AI_transparent_512x512.png"
                alt="Dhwani AI Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black font-brand-display tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                Dhwani
              </span>
              <span className="text-[10px] font-bold font-brand tracking-widest text-white/90 px-1.5 py-0.5 rounded bg-white/10 border border-white/15">
                AI
              </span>
            </div>
          </Link>

          <p className="text-xs sm:text-sm text-white/60 font-medium tracking-wide">
            &ldquo;Don&apos;t trust the voice. Verify the action.&rdquo;
          </p>
        </div>

        {/* Minimalist Navigation Pills */}
        <nav className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all flex items-center gap-1.5"
            >
              {link.icon && <link.icon className="w-3 h-3 text-emerald-400/80" />}
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>

        {/* Clean Privacy & Architecture Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] text-white/40 pt-2 border-t border-white/[0.05] w-full max-w-xl">
          <span className="flex items-center gap-1 text-emerald-400/80 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            DPDP Act 2023 Compliant
          </span>
          <span className="hidden sm:inline text-white/20">&bull;</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-cyan-400/70" />
            Zero Raw Audio Stored
          </span>
          <span className="hidden sm:inline text-white/20">&bull;</span>
          <span className="flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Biometric Defense
          </span>
        </div>

        {/* Copyright */}
        <p className="text-[11px] text-white/35 font-mono">
          &copy; {currentYear} Dhwani AI &bull; Real-Time Voice Cloning Defense
        </p>

      </div>
    </footer>
  );
}
