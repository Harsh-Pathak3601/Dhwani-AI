import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, PhoneCall } from 'lucide-react';

interface TranscriptFeedProps {
  transcript: string;
  isCallActive?: boolean;
}

const TranscriptFeed: React.FC<TranscriptFeedProps> = ({ transcript, isCallActive = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Automatic Scroll Adjustment:
   * Keeps the live transcript view pinned to the bottom.
   * By setting `scrollTop` to the `scrollHeight`, it continuously scrolls the latest transcribed text into view.
   */
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript]);

  /**
   * Phrase Splitting using Lookahead Regex:
   * `/(?<=[.!?])\s+/` splits the text stream into individual sentences *without* deleting the punctuation marks.
   * This granular segmentation enables Framer Motion to apply staggered transition enter animations
   * on individual sentences rather than redrawing or jarring the entire text block on every keystroke/word update.
   */
  const phrases = transcript.split(/(?<=[.!?])\s+/).filter(p => p.trim().length > 0);

  return (
    <div className="relative flex-1 min-h-0 mx-4 my-2 mb-24 rounded-2xl overflow-hidden glass-card shadow-lg flex flex-col">
      {/* Top fade gradient */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background/90 to-transparent z-10 pointer-events-none" />
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-5 pb-10 pt-8 scroll-smooth"
      >
        <AnimatePresence mode="popLayout">
          {!isCallActive ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-white/40 space-y-3 px-6 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1 shadow-sm">
                <PhoneCall className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-white/90">Call on Standby</p>
              <p className="text-xs text-white/50 max-w-xs leading-relaxed">
                Tap <span className="text-emerald-400 font-semibold">&ldquo;Start Call&rdquo;</span> below when your call connects to activate real-time voice cloning detection.
              </p>
            </motion.div>
          ) : phrases.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-white/40 space-y-4"
            >
              <div className="flex items-center justify-center space-x-2">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-primary/50 rounded-full"
                    animate={{ height: ['8px', '24px', '8px'] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: 'easeInOut'
                    }}
                  />
                ))}
              </div>
              <p className="text-sm font-medium uppercase tracking-widest flex items-center gap-2">
                <Mic className="w-4 h-4" /> Listening securely...
              </p>
            </motion.div>
          ) : (
            phrases.map((phrase, idx) => (
              <motion.div
                key={idx} // Using index is okay here because transcript is append-only from Deepgram mostly
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-3 text-[15px] leading-relaxed text-white/80 font-medium"
              >
                {phrase}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TranscriptFeed;
