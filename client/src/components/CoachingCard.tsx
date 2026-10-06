import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, X, HelpCircle } from 'lucide-react';

interface CoachingCardProps {
  risk: number;
  signal: string;
  coaching: string;
  voiceState?: string;
  vas?: number;
  onDismiss: () => void;
}

const CoachingCard = ({ 
  risk, 
  signal, 
  coaching, 
  voiceState, 
  vas, 
  onDismiss 
}: CoachingCardProps) => {

  /**
   * 5-State Voice Integrity Classification per voice-cloning.md:
   * Critical: 🔴 SYNTHETIC VOICE LIKELY — Do NOT authorize any transaction.
   * High: 🟠 VOICE ANOMALY DETECTED — Proceed with caution.
   * Suspicious: 🟡 VOICE IRREGULARITY — Something sounds off.
   * Insufficient Evidence: ⚪ INSUFFICIENT AUDIO — Not enough signal to assess.
   */
  let tierStyle = {
    cardBg: 'bg-warning/10 border-warning/30',
    headerBg: 'bg-warning',
    textColor: 'text-warning-light',
    glow: 'shadow-[0_0_30px_rgba(239,159,39,0.15)]',
    icon: <AlertTriangle className="w-5 h-5 text-white" />,
    label: 'CAUTION',
    defaultAction: coaching || 'Be vigilant and request identity confirmation.'
  };

  if (voiceState === 'Critical' || risk >= 80) {
    tierStyle = {
      cardBg: 'bg-danger/15 border-danger/50',
      headerBg: 'bg-danger',
      textColor: 'text-danger-light',
      glow: 'shadow-[0_0_40px_rgba(226,75,74,0.35)]',
      icon: <ShieldAlert className="w-5 h-5 text-white" />,
      label: vas ? `SYNTHETIC VOICE LIKELY (${vas}% VAS)` : 'CRITICAL THREAT',
      defaultAction: coaching || 'Do NOT authorize any financial or security action. Request in-person or secondary device verification.'
    };
  } else if (voiceState === 'High' || risk >= 65) {
    tierStyle = {
      cardBg: 'bg-orange-500/15 border-orange-500/40',
      headerBg: 'bg-orange-500',
      textColor: 'text-orange-300',
      glow: 'shadow-[0_0_35px_rgba(249,115,22,0.25)]',
      icon: <ShieldAlert className="w-5 h-5 text-white" />,
      label: 'VOICE ANOMALY DETECTED',
      defaultAction: coaching || 'Proceed with high caution. Call back on official enrolled number before taking any action.'
    };
  } else if (voiceState === 'Suspicious' || risk >= 40) {
    tierStyle = {
      cardBg: 'bg-amber-500/15 border-amber-500/40',
      headerBg: 'bg-amber-500',
      textColor: 'text-amber-200',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]',
      icon: <AlertTriangle className="w-5 h-5 text-white" />,
      label: 'VOICE IRREGULARITY',
      defaultAction: coaching || 'Something sounds acoustically irregular. Exercise vigilance.'
    };
  } else if (voiceState === 'Insufficient Evidence') {
    tierStyle = {
      cardBg: 'bg-slate-500/15 border-slate-500/30',
      headerBg: 'bg-slate-600',
      textColor: 'text-slate-300',
      glow: 'shadow-[0_0_20px_rgba(148,163,184,0.15)]',
      icon: <HelpCircle className="w-5 h-5 text-white" />,
      label: 'INSUFFICIENT AUDIO',
      defaultAction: 'Not enough acoustic signal to assess synthesis. Use independent verification for sensitive transactions.'
    };
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`fixed bottom-6 right-6 z-40 w-[calc(100%-48px)] sm:w-[420px] rounded-2xl border backdrop-blur-2xl max-h-[calc(100dvh-120px)] flex flex-col overflow-hidden shadow-2xl ${tierStyle.cardBg} ${tierStyle.glow}`}
    >
      {/* Header bar */}
      <div className={`${tierStyle.headerBg} px-4 py-2 flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-2 font-bold text-white tracking-wide text-xs sm:text-sm">
          {tierStyle.icon}
          <span>{tierStyle.label}</span>
        </div>
        <button 
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5 text-white stroke-[2.5]" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar">
        {/* Detected Pattern */}
        <div className="text-xs">
          <span className="text-white/50 uppercase tracking-wider text-[9px] font-mono block mb-1">
            Detected Threat Signal
          </span>
          <p className="text-white/90 font-medium leading-snug">{signal}</p>
        </div>

        {/* Recommended Action */}
        <div className="bg-black/30 rounded-xl p-3.5 border border-white/5 mt-0.5">
          <span className="font-kaushan text-sm text-amber-300 font-normal tracking-wide block mb-1">
            Recommended Counter-Action:
          </span>
          <p className="text-white text-base font-semibold leading-relaxed">
            &ldquo;{tierStyle.defaultAction}&rdquo;
          </p>
        </div>

        {/* Critical warning banner */}
        {(risk >= 80 || voiceState === 'Critical') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-center text-danger-light font-bold text-xs uppercase tracking-widest animate-pulse"
          >
            Hold transaction and request out-of-band verification
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CoachingCard;
