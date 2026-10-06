import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { INDIAN_ACCENTS, AccentLanguage, applyFullPageTranslation, getSavedLanguageCode } from '../i18n/googleTranslate';
import { useSessionStore } from '../store/useSessionStore';

interface LanguageSelectorProps {
  variant?: 'navbar' | 'compact' | 'expanded';
  className?: string;
}

export default function LanguageSelector({ variant = 'navbar', className = '' }: LanguageSelectorProps) {
  const [activeCode, setActiveCode] = useState<string>('en');
  const [isOpen, setIsOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const setSpeechLanguage = useSessionStore((state) => state.setSpeechLanguage);

  useEffect(() => {
    const saved = getSavedLanguageCode();
    setActiveCode(saved);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const currentOption = INDIAN_ACCENTS.find((a) => a.code === activeCode) || INDIAN_ACCENTS[0];

  const handleSelectLanguage = (accent: AccentLanguage) => {
    setActiveCode(accent.code);
    setSpeechLanguage(accent.speechCode);
    setIsOpen(false);
    setIsTranslating(true);
    setTimeout(() => setIsTranslating(false), 900);
    // Apply full-page DOM translation
    applyFullPageTranslation(accent.code);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Select Indian accent and language"
        className={`flex items-center gap-1.5 rounded-full transition-all cursor-pointer select-none notranslate ${
          variant === 'navbar'
            ? 'px-2.5 py-1 text-[11px] font-mono font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 hover:border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.08)]'
            : variant === 'compact'
            ? 'px-2 py-1 text-[10px] font-mono font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25'
            : 'px-3 py-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300'
        }`}
      >
        {isTranslating ? (
          <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        )}
        {variant === 'compact' ? (
          <span className="font-mono font-bold text-[11px] uppercase tracking-wider text-amber-300">
            {isTranslating ? '...' : currentOption.code}
          </span>
        ) : (
          <span className="truncate max-w-[80px] sm:max-w-[100px]">
            {isTranslating ? 'Translating...' : currentOption.nativeName}
          </span>
        )}
        <ChevronDown
          className={`w-3 h-3 text-amber-400/70 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl bg-[#09101A]/95 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-2 z-50 text-left notranslate"
          >

            <div className="max-h-72 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-white/20">
              {INDIAN_ACCENTS.map((lang: AccentLanguage) => {
                const isSelected = lang.code === activeCode;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border border-amber-500/35 text-white'
                        : 'hover:bg-white/[0.06] text-white/75 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate text-white">
                          {lang.nativeName}
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">({lang.name})</span>
                      </div>
                      <p className="text-[10px] text-amber-300/80 font-mono truncate">
                        {lang.accent}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-amber-400" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
