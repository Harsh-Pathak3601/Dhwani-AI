import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertOctagon, Smartphone, ArrowRight, Lock, X } from 'lucide-react';
import { ActiveHoldData, useSessionStore } from '../store/useSessionStore';
import { extractSpokenAmount } from './OOBVerificationModal';

interface PreTransactionWarningModalProps {
  hold: ActiveHoldData;
  onOpenOOB: () => void;
  onDismiss: () => void;
}

export const PreTransactionWarningModal = ({
  hold,
  onOpenOOB,
  onDismiss
}: PreTransactionWarningModalProps) => {
  const transcript = useSessionStore((state) => state.transcript);
  const callerNumber = useSessionStore((state) => state.callerNumber);
  const isDemoAttackRunning = useSessionStore((state) => state.isDemoAttackRunning);

  const heardAmount = (() => {
    if (isDemoAttackRunning) return '₹50,00,000';
    const fromTranscript = extractSpokenAmount(transcript);
    if (fromTranscript) return fromTranscript;
    const fromReason = extractSpokenAmount(hold.reason || '');
    if (fromReason) return fromReason;
    if (hold.heldAmount && hold.heldAmount !== 'HIGH TRANSACTION ALERT' && hold.heldAmount !== '₹50,00,000') {
      return hold.heldAmount;
    }
    return null;
  })();

  const hasHeardAmount = Boolean(heardAmount);
  const displayAmount = heardAmount || 'HIGH TRANSACTION ALERT';

  const callerOrFileName = (() => {
    if (isDemoAttackRunning) return 'Rajiv Verma (CFO)';
    if (hold.fileName) return hold.fileName;
    if (hold.callerName) return hold.callerName;
    if (callerNumber && callerNumber !== 'Unknown Caller') return callerNumber;
    return '';
  })();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-lg"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onDismiss();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md rounded-3xl border-2 border-red-500/80 shadow-[0_0_50px_rgba(226,75,74,0.4)] overflow-hidden bg-background relative p-6"
      >
        {/* Flashing Top Banner */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-red-500/30">
          <div className="flex items-center gap-2 text-danger font-bold text-xs uppercase tracking-widest animate-pulse">
            <AlertOctagon className="w-5 h-5" />
            <span>CRITICAL TRANSACTION INTERRUPT</span>
          </div>
          <button 
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss warning modal"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Title */}
        <div className="text-center my-2">
          <div className="w-16 h-16 rounded-3xl bg-danger/20 border-2 border-danger flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(226,75,74,0.3)]">
            <ShieldAlert className="w-9 h-9 text-danger" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            ACTION HELD BY POLICY
          </h2>
          <p className="text-xs text-red-300/80 mt-1">
            Voice Authenticity Score & Impersonation Risk reached Critical Tier
          </p>
        </div>

        {/* Transaction Held Card */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 my-4">
          <div className="flex items-center justify-between text-xs font-mono text-white/50 mb-1">
            <span>TXN REF: {hold.transactionRef}</span>
            <span className="text-danger font-bold uppercase">STATUS: HELD</span>
          </div>
          <div className={`font-black font-mono my-1 ${hasHeardAmount ? 'text-2xl text-white' : 'text-lg text-amber-400 py-0.5'}`}>
            {displayAmount}
          </div>
          <p className="text-xs text-white/80 leading-snug mt-1">
            {callerOrFileName
              ? `High-stakes financial transaction requested from ${callerOrFileName} during detected voice anomaly.`
              : (hold.reason || 'High-stakes financial transaction requested during detected voice cloning attack.')}
          </p>
        </div>

        {/* Core Security Rule */}
        <div className="bg-black/40 rounded-xl p-3 border border-white/10 text-[11px] text-white/70 flex items-start gap-2.5 mb-5">
          <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Zero Trust Principle:</strong> Never authenticate a compromised channel using the same compromised channel. Do not ask the caller for confirmation on this call.
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onOpenOOB}
            className="w-full py-3.5 bg-danger hover:bg-danger/90 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
          >
            <Smartphone className="w-4 h-4" />
            <span>Verify via Independent Trust Channel (OOB Push)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-colors text-xs font-semibold"
          >
            Acknowledge Hold & Keep Monitoring
          </button>
        </div>
      </motion.div>
    </div>
  );
};
