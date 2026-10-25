import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

interface BackToTopProps {
  /** Scroll distance threshold in px before the gooey drop appears */
  threshold?: number;
}

export const BackToTop: React.FC<BackToTopProps> = ({ threshold = 260 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);

  // Monitor scroll depth and calculate exact percentage
  const handleScroll = useCallback(() => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY;

    if (totalHeight > 0) {
      const progress = Math.min(Math.max((currentScroll / totalHeight) * 100, 0), 100);
      setScrollProgress(Math.round(progress));
    }

    if (currentScroll > threshold) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
      setIsReleasing(false);
    }
  }, [threshold]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Trigger fluid liquid slingshot release & direct smooth scroll
  const handleLiquidRelease = () => {
    if (isReleasing) return;
    setIsReleasing(true);

    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 35, 15]);
      }
    } catch {
      // Ignore vibration error
    }

    // Scroll window smoothly directly to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Reset liquid tension state after spring settles
    setTimeout(() => {
      setIsReleasing(false);
    }, 850);
  };

  return (
    <>
      {/* ─── SVG METABALL GOOEY LIQUID FILTER ─── */}
      <svg
        className="fixed -top-full -left-full pointer-events-none opacity-0 select-none w-0 h-0"
        aria-hidden="true"
      >
        <defs>
          <filter id="gooey-liquid-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6.5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 20 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* ─── GOOEY LIQUID BUTTON ─── */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.4, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 25, transition: { duration: 0.25 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex flex-col items-center select-none"
          >
            {/* Interactive Liquid Container with Gooey SVG Filter */}
            <div
              className="relative flex items-center justify-center"
              style={{ filter: 'url(#gooey-liquid-filter)' }}
            >
              {/* Detached Satellite Bubble 1 (Buds upward when hovered or releasing) */}
              <motion.div
                animate={
                  isReleasing
                    ? {
                        y: [-8, -45, -60],
                        scale: [0.8, 1.3, 0],
                        opacity: [1, 1, 0],
                      }
                    : isHovered
                    ? {
                        y: [-10, -22, -15],
                        scale: [0.8, 1.1, 0.95],
                        opacity: 1,
                      }
                    : {
                        y: 0,
                        scale: 0.4,
                        opacity: 0,
                      }
                }
                transition={
                  isReleasing
                    ? { duration: 0.65, ease: [0.2, 0.9, 0.2, 1] }
                    : { duration: 0.4, ease: 'easeOut' }
                }
                className="absolute w-3.5 h-3.5 rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-amber-300 pointer-events-none shadow-[0_0_10px_rgba(255,171,0,0.8)]"
              />

              {/* Detached Satellite Bubble 2 (Smaller spray droplet on launch) */}
              <motion.div
                animate={
                  isReleasing
                    ? {
                        y: [-6, -35, -48],
                        x: [0, 6, 10],
                        scale: [0.6, 0.9, 0],
                        opacity: [1, 1, 0],
                      }
                    : {
                        y: 0,
                        x: 0,
                        scale: 0,
                        opacity: 0,
                      }
                }
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="absolute w-2.5 h-2.5 rounded-full bg-amber-300 pointer-events-none"
              />

              {/* Main Liquid Droplet Body (Squishes & Slingshots) */}
              <motion.button
                onClick={handleLiquidRelease}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                aria-label="Back to top"
                animate={
                  isReleasing
                    ? {
                        // Elastic Slingshot: Squish down -> Catapult straight up -> Spring bounce back
                        scaleX: [1, 1.35, 0.6, 1.15, 0.92, 1],
                        scaleY: [1, 0.65, 1.55, 0.88, 1.08, 1],
                        y: [0, 10, -32, 4, -2, 0],
                      }
                    : isHovered
                    ? {
                        scaleX: [1, 1.08, 0.95, 1.03, 1],
                        scaleY: [1, 0.94, 1.06, 0.98, 1],
                        y: [-2, -6, -3],
                        transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' },
                      }
                    : {
                        scaleX: 1,
                        scaleY: 1,
                        y: 0,
                      }
                }
                transition={
                  isReleasing
                    ? {
                        duration: 0.8,
                        ease: [0.22, 1, 0.36, 1],
                      }
                    : { duration: 0.25 }
                }
                className="relative w-12 h-12 sm:w-[50px] sm:h-[50px] rounded-full bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center shadow-[0_6px_20px_rgba(255,109,0,0.45)] cursor-pointer outline-none border-none p-0 overflow-hidden"
              >
                {/* Internal Liquid Surface Sheen */}
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.6)_0%,transparent_60%)] pointer-events-none" />
                <div className="absolute inset-x-1 bottom-1 h-2 rounded-full bg-orange-700/40 blur-[1px] pointer-events-none" />

                {/* Subsurface Liquid Meniscus Level */}
                <div
                  className="absolute inset-0 bg-amber-300/20 pointer-events-none transition-all duration-150"
                  style={{
                    clipPath: `inset(${100 - scrollProgress}% 0 0 0)`,
                  }}
                />
              </motion.button>
            </div>

            {/* Sharp, Unfiltered Crisp Icon & TOP Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              {/* Slingshot Kinetic Chevron */}
              <motion.div
                animate={
                  isReleasing
                    ? {
                        y: [0, 6, -22, 0],
                        scale: [1, 0.8, 1.25, 1],
                        opacity: [1, 0.9, 0, 1],
                      }
                    : isHovered
                    ? {
                        y: [-1, -3, -1],
                        transition: { repeat: Infinity, duration: 0.9, ease: 'easeInOut' },
                      }
                    : { y: 0 }
                }
                transition={
                  isReleasing
                    ? { duration: 0.75, ease: [0.16, 1, 0.3, 1] }
                    : { duration: 0.2 }
                }
                className="text-[#070d18] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] flex flex-col items-center"
              >
                <ChevronUp className="w-4 h-4 stroke-[3.2]" />
              </motion.div>

              {/* TOP Text Only */}
              <motion.span
                animate={isReleasing ? { opacity: 0 } : { opacity: 1 }}
                className="text-[9px] font-black text-[#070d18] uppercase tracking-wider text-center leading-none -mt-1 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]"
              >
                TOP
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BackToTop;
