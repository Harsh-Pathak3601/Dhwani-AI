import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, Radio, PhoneCall, LayoutDashboard } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const aiBadgeClass = isHome
    ? 'text-white/90 bg-white/10 border-white/20'
    : 'text-amber-300 bg-amber-500/15 border-amber-500/30';

  const logoBoxClass = isHome
    ? 'bg-gradient-to-br from-emerald-500/30 via-slate-900/60 to-emerald-500/10 border-emerald-500/40 shadow-emerald-500/20'
    : 'bg-gradient-to-br from-orange-500/30 via-slate-900/60 to-amber-500/10 border-amber-500/40 shadow-orange-500/20';

  const navIconClass = isHome ? 'text-emerald-400/80' : 'text-amber-400/80';
  const complianceBadgeClass = isHome ? 'text-emerald-400/80' : 'text-amber-400/90';
  const lockIconClass = isHome ? 'text-cyan-400/70' : 'text-orange-400/80';
  const pulseDotClass = isHome ? 'bg-emerald-400' : 'bg-amber-400';

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
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center p-1 shadow-md group-hover:scale-105 transition-transform ${logoBoxClass}`}>
              <img
                src="/Dhwani_AI_transparent_512x512.png"
                alt="Dhwani AI Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black font-brand-display tracking-tight text-white">
                Dhwani
              </span>
              <span className={`text-xs font-bold font-brand tracking-widest px-1.5 py-0.5 rounded border ${aiBadgeClass}`}>
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
              {link.icon && <link.icon className={`w-3 h-3 ${navIconClass}`} />}
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>

        {/* Clean Privacy & Architecture Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-white/40 pt-2 border-t border-white/[0.05] w-full max-w-xl">
          <span className={`flex items-center gap-1 font-medium ${complianceBadgeClass}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            DPDP Act 2023 Compliant
          </span>
          <span className="hidden sm:inline text-white/20">&bull;</span>
          <span className="flex items-center gap-1">
            <Lock className={`w-3 h-3 ${lockIconClass}`} />
            Zero Raw Audio Stored
          </span>
          <span className="hidden sm:inline text-white/20">&bull;</span>
          <span className="flex items-center gap-1 font-mono">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${pulseDotClass}`} />
            Live Biometric Defense
          </span>
        </div>

        {/* Copyright */}
        <p className="text-xs text-white/35 font-mono">
          &copy; {currentYear} Dhwani AI &bull; Real-Time Voice Cloning Defense
        </p>

      </div>
    </footer>
  );
}
