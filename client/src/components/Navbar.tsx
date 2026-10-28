import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// React Icons
import {
  HiOutlineHome,
  HiOutlineLockClosed,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import {
  TbWaveSine,
  TbLayoutDashboard,
  TbBinaryTree,
  TbCode
} from 'react-icons/tb';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from '../i18n/useTranslation';
import GooeyNav from './GooeyNav';
import ShinyText from './ShinyText';
import { prefetchRoute } from '../App';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navLinks = useMemo(
    () => [
      { key: 'nav.home', name: 'Home', path: '/', icon: HiOutlineHome },
      // { key: 'nav.download', name: 'Download', path: '/download', icon: HiOutlineArrowDownTray },
      { key: 'nav.cockpit', name: 'Cockpit', path: '/session', icon: TbWaveSine },
      { key: 'nav.cases', name: 'Cases', path: '/dashboard', icon: TbLayoutDashboard },
      { key: 'nav.architecture', name: 'Architecture', path: '/architecture', icon: TbBinaryTree },
      { key: 'nav.enterprise', name: 'API', path: '/enterprise-api', icon: TbCode },
      { key: 'nav.privacy', name: 'Privacy', path: '/consent', icon: HiOutlineLockClosed },
    ],
    []
  );

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/app' || location.pathname === '/check';
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const activeIndex = useMemo(() => {
    const idx = navLinks.findIndex((link) => isActive(link.path));
    return idx >= 0 ? idx : 0;
  }, [location.pathname, navLinks]);

  const gooeyItems = useMemo(() => {
    return navLinks.map((link) => {
      const Icon = link.icon;
      return {
        label: t(link.key, link.name),
        href: link.path,
        icon: <Icon className="w-3.5 h-3.5 shrink-0" />
      };
    });
  }, [t, navLinks]);

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
        <Link
          to="/"
          onMouseEnter={() => prefetchRoute('/')}
          className="flex items-center gap-2 group shrink-0 pr-1 notranslate"
        >
          <div className="relative w-7 h-7 flex items-center justify-center group-hover:scale-105 transition-transform drop-shadow-[0_2px_8px_rgba(255,109,0,0.4)]">
            <img
              src="/Dhwani_AI_transparent_512x512.png"
              alt="Dhwani AI Logo"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <ShinyText
              text="Dhwani"
              color="#ffffff"
              shineColor="#fbbf24"
              speed={2.2}
              delay={1.5}
              softness={0.7}
              trigger="loop"
              glow={0.3}
              className="text-base font-black font-brand-display tracking-tight notranslate"
            />
            <span className="text-[9px] font-bold font-brand tracking-widest px-1.5 py-0.2 rounded-full border text-amber-300 bg-amber-500/15 border-amber-500/30 notranslate">
              AI
            </span>
          </div>
        </Link>

        {/* Desktop Single-Line Navigation with GooeyNav */}
        <div
          className="hidden md:flex items-center notranslate"
          onMouseEnter={() => {
            // Idle prefetch most visited routes on navbar hover
            prefetchRoute('/session');
            prefetchRoute('/dashboard');
          }}
        >
          <GooeyNav
            items={gooeyItems}
            activeIndex={activeIndex}
            theme="dark"
            size="sm"
            frame={false}
            color="#342408"
            activeTextColor="#fcd34d"
            colors={['#fcd34d', '#f0c948', '#e2ac20', '#78350f']}
            particleCount={14}
            spread={52}
            animationTime={540}
            timeVariance={220}
            gooeyness={0.52}
            wobble={0.45}
            hoverEffect={true}
            onChange={(_index, item) => {
              if (item.href && item.href !== location.pathname) {
                prefetchRoute(item.href);
                navigate(item.href);
              }
            }}
          />
        </div>

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
                  onMouseEnter={() => prefetchRoute(link.path)}
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
