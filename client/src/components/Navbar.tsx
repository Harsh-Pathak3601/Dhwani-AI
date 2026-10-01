import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// React Icons
import {
  HiOutlineHome,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineShieldCheck,
  HiOutlineChevronRight,
  // HiOutlineArrowDownTray
} from 'react-icons/hi2';
import {
  TbWaveSine,
  TbLayoutDashboard,
  TbBinaryTree,
  TbCode
} from 'react-icons/tb';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();
  const { t } = useTranslation();

  const navLinks = [
    { key: 'nav.home', name: 'Home', path: '/', icon: HiOutlineHome },
    // { key: 'nav.download', name: 'Download', path: '/download', icon: HiOutlineArrowDownTray },
    { key: 'nav.cockpit', name: 'Cockpit', path: '/session', icon: TbWaveSine },
    { key: 'nav.cases', name: 'Cases', path: '/dashboard', icon: TbLayoutDashboard },
    { key: 'nav.architecture', name: 'Architecture', path: '/architecture', icon: TbBinaryTree },
    { key: 'nav.enterprise', name: 'Enterprise API', path: '/enterprise-api', icon: TbCode },
    { key: 'nav.privacy', name: 'Privacy', path: '/consent', icon: HiOutlineLockClosed },
  ];

  // Smart Scroll: Hide on scroll down, show immediately on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show when near the top
      if (currentScrollY <= 25) {
        setIsVisible(true);
      }
      // Scrolling down: hide floating navbar
      else if (currentScrollY > lastScrollY && currentScrollY > 70) {
        setIsVisible(false);
        setMobileMenuOpen(false);
      }
      // Scrolling up: reveal navbar
      else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/app' || location.pathname === '/check';
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const isCockpit = location.pathname.startsWith('/session');

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed top-2.5 sm:top-3.5 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none w-full max-w-full notranslate"
    >
      <div className={`w-full max-w-6xl mx-auto rounded-full bg-[#070b10]/85 hover:bg-[#070b10]/95 backdrop-blur-xl border border-white/[0.08] ${isCockpit
        ? 'shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
        : 'shadow-[0_16px_36px_-6px_rgba(0,0,0,0.75),inset_0_1px_1px_rgba(255,255,255,0.12)]'
        } px-3 sm:px-4 h-12 flex items-center justify-between pointer-events-auto transition-all`}>

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0 pr-1 notranslate">
          <div className="relative w-7 h-7 flex items-center justify-center group-hover:scale-105 transition-transform drop-shadow-[0_2px_8px_rgba(255,109,0,0.4)]">
            <img
              src="/Dhwani_AI_transparent_512x512.png"
              alt="Dhwani AI Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black font-brand-display tracking-tight text-white notranslate">
              Dhwani
            </span>
            <span className="text-[9px] font-bold font-brand tracking-widest px-1.5 py-0.2 rounded-full border text-amber-300 bg-amber-500/15 border-amber-500/30 notranslate">
              AI
            </span>
          </div>
        </Link>

        {/* Desktop Single-Line Navigation Pills */}
        <nav className="hidden md:flex items-center gap-0.5 bg-black/40 p-0.5 rounded-full border border-white/5">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            const Icon = link.icon;
            const label = t(link.key, link.name);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-2 lg:px-2.5 py-1 rounded-full text-[11px] lg:text-xs font-medium tracking-normal transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap ${active
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(255,109,0,0.3)]'
                  : 'text-white/65 hover:text-white hover:bg-white/[0.06]'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-amber-400' : 'text-white/50'}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Language Dropdown (Replaced REST/gRPC Gateway) */}
        <div className="hidden md:flex items-center gap-2 shrink-0 notranslate">
          <LanguageSelector variant="navbar" />
        </div>

        {/* Mobile Actions: Language Dropdown + Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2 shrink-0 notranslate">
          <LanguageSelector variant="compact" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white/80 hover:text-white active:scale-95 flex items-center justify-center focus:outline-none transition-all cursor-pointer shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <HiOutlineXMark className="w-4 h-4" /> : <HiOutlineBars3 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Floating Mobile Dropdown Menu Card */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="md:hidden w-full max-w-sm mx-auto mt-2 rounded-2xl bg-[#070b10]/95 backdrop-blur-2xl border border-white/[0.08] p-3 shadow-2xl space-y-1 pointer-events-auto"
          >
            {navLinks.map((link) => {
              const active = isActive(link.path);
              const Icon = link.icon;
              const label = t(link.key, link.name);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${active
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span>{label}</span>
                  </div>
                  <HiOutlineChevronRight className="w-3.5 h-3.5 text-white/30" />
                </Link>
              );
            })}
            <div className="pt-2.5 mt-2 border-t border-white/[0.08] flex items-center justify-between px-2">
              <span className="text-[11px] font-mono text-white/50">Language:</span>
              <LanguageSelector variant="navbar" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
