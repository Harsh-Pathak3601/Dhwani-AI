import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, ShieldCheck, ShieldAlert, X, Check, ArrowRight, Lock, BellRing } from 'lucide-react';
import { ActiveHoldData } from '../store/useSessionStore';

interface OOBVerificationModalProps {
  hold: ActiveHoldData;
  onResolve: (decision: 'approved' | 'denied') => void;
  onClose: () => void;
}

export const OOBVerificationModal = ({
  hold,
  onResolve,
  onClose
}: OOBVerificationModalProps) => {
  const [resolutionStatus, setResolutionStatus] = useState<'pending' | 'denied' | 'approved'>('pending');

  const handleAction = (decision: 'approved' | 'denied') => {
    setResolutionStatus(decision);
    onResolve(decision);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-sm rounded-[36px] border border-white/20 shadow-2xl overflow-hidden bg-slate-950 p-6 relative flex flex-col"
      >
        {/* Device Notch & Status Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-white/50 font-mono">
            <Smartphone className="w-3.5 h-3.5 text-primary" />
            <span>Authorized Security Device</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-white/40 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {resolutionStatus === 'pending' ? (
            <motion.div
              key="pending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              {/* Push Banner */}
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-3 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-primary/20 text-primary">
                  <BellRing className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                    Out-Of-Band Push Alert
                  </span>
                  <h4 className="text-xs font-bold text-white leading-tight mt-0.5">
                    Dhwani AI Enterprise MDM
                  </h4>
                  <p className="text-[10px] text-white/60">Delivered via independent encrypted trust channel</p>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-4 text-center">
                <span className="text-[10px] font-mono text-white/40 uppercase">Pending Authorization</span>
                <div className="text-3xl font-black text-white font-mono my-1">
                  {hold.heldAmount || '₹50,00,000'}
                </div>
                <div className="text-xs text-danger font-semibold bg-danger/10 border border-danger/20 rounded-lg py-1 px-2 mt-2">
                  ⚠️ Triggered while Voice Risk is Elevated
                </div>
                <p className="text-xs text-white/70 mt-3 text-left">
                  A caller claiming to be <strong>Rajiv Verma (CFO)</strong> requested immediate release of funds over an in-progress phone call.
                </p>
              </div>

              {/* Question */}
              <p className="text-xs text-white/90 font-bold text-center px-2">
                Did you initiate or authorize this emergency transfer request?
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => handleAction('denied')}
                  className="w-full py-3.5 bg-danger hover:bg-danger/90 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>DENY & REPORT ATTACK</span>
                </button>
                <button
                  onClick={() => handleAction('approved')}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-xl transition-colors text-xs font-semibold"
                >
                  Confirm (Legitimate Call)
                </button>
              </div>
            </motion.div>
          ) : resolutionStatus === 'denied' ? (
            <motion.div
              key="denied"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <ShieldCheck className="w-9 h-9 text-emerald-400" />
              </div>
              <h3 className="text-xl font-black text-white">IMPERSONATION ATTACK PREVENTED!</h3>
              <p className="text-xs text-emerald-300 mt-2 leading-relaxed px-2">
                The ₹50,00,000 transaction has been permanently blocked. The attacker on the voice call cannot authorize fund movement without independent device clearance.
              </p>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-[10px] font-mono text-white/50 my-4 text-left w-full">
                <div>TXN REF: {hold.transactionRef}</div>
                <div>RESOLUTION: DENIED_BY_AUTHORIZED_USER</div>
                <div>STATUS: SECURED & RECORDED IN LEDGER</div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-emerald-500 text-black font-bold rounded-xl transition-colors text-xs"
              >
                Close & Return to Dashboard
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="approved"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-3">
                <Check className="w-9 h-9 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white">Transaction Cleared</h3>
              <p className="text-xs text-white/70 mt-1">
                Authorized via independent enterprise security device.
              </p>
              <button
                onClick={onClose}
                className="w-full mt-4 py-2.5 bg-white/10 text-white rounded-xl text-xs font-semibold"
              >
                Return to Call
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
