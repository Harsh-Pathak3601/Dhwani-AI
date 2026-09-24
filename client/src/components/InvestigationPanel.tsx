import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ShieldAlert, Save, CheckCircle, Loader2 } from 'lucide-react';
import { updateCaseInvestigation, SecurityCase } from '../services/api';

interface InvestigationPanelProps {
  reportId: string;
  currentStatus: 'Suspected' | 'Verified' | 'Needs Review';
  currentNotes: string;
  currentReviewer?: string;
  onUpdate?: (updatedCase: SecurityCase) => void;
}

const statusConfig = {
  'Needs Review': {
    icon: Shield,
    color: 'warning',
    bg: 'bg-warning/20',
    border: 'border-warning/50',
    activeBg: 'bg-warning/30',
    text: 'text-warning',
  },
  'Verified': {
    icon: ShieldCheck,
    color: 'primary',
    bg: 'bg-primary/20',
    border: 'border-primary/50',
    activeBg: 'bg-primary/30',
    text: 'text-primary',
  },
  'Suspected': {
    icon: ShieldAlert,
    color: 'danger',
    bg: 'bg-danger/20',
    border: 'border-danger/50',
    activeBg: 'bg-danger/30',
    text: 'text-danger',
  },
} as const;

type StatusKey = keyof typeof statusConfig;

const InvestigationPanel = ({
  reportId,
  currentStatus,
  currentNotes,
  currentReviewer,
  onUpdate,
}: InvestigationPanelProps) => {
  const [status, setStatus] = useState<StatusKey>(currentStatus);
  const [notes, setNotes] = useState(currentNotes || '');
  const [reviewer, setReviewer] = useState(currentReviewer || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStatus(currentStatus);
    setNotes(currentNotes || '');
    setReviewer(currentReviewer || '');
  }, [reportId, currentStatus, currentNotes, currentReviewer]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      const updated = await updateCaseInvestigation(reportId, {
        investigationStatus: status,
        investigatorNotes: notes,
        reviewerName: reviewer || undefined,
      });
      setSaved(true);
      onUpdate?.(updated);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save investigation update:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="glass-card-strong p-5 space-y-5"
    >
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest flex items-center gap-2">
          🔍 Investigation Triage
        </h3>
        <p className="text-white/40 text-xs mt-1">Classify this security case and add investigator notes</p>
      </div>

      {/* Status Selector */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(statusConfig) as StatusKey[]).map((key) => {
          const config = statusConfig[key];
          const Icon = config.icon;
          const isActive = status === key;

          return (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                isActive
                  ? `${config.activeBg} ${config.border} ${config.text} shadow-lg`
                  : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
              }`}
            >
              <Icon className="w-4 h-4" />
              {key}
            </button>
          );
        })}
      </div>

      {/* Reviewer Name */}
      <div>
        <label className="text-white/40 text-[10px] uppercase tracking-wider block mb-2">
          Reviewer Name
        </label>
        <input
          type="text"
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          placeholder="e.g. Inv. Priya Mehta"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Investigator Notes */}
      <div>
        <label className="text-white/40 text-[10px] uppercase tracking-wider block mb-2">
          Investigation Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add investigation notes..."
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
          saved
            ? 'bg-primary/30 text-primary border border-primary/50'
            : isSaving
            ? 'bg-white/10 text-white/50 cursor-wait'
            : 'bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-white shadow-[0_0_20px_rgba(29,158,117,0.3)]'
        }`}
      >
        {saved ? (
          <>
            <CheckCircle className="w-5 h-5" />
            Saved Successfully
          </>
        ) : isSaving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Investigation
          </>
        )}
      </button>
    </motion.div>
  );
};

export default InvestigationPanel;
