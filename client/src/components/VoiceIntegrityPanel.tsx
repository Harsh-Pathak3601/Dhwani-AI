import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, ShieldCheck, Activity, Cpu, Fingerprint, 
  Lock, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Target, Sliders
} from 'lucide-react';
import { VoiceStage1Data, VoiceStage2Data, VoiceRiskState } from '../store/useSessionStore';
import { VoiceCloneGraph } from './VoiceCloneGraph';

interface VoiceIntegrityPanelProps {
  stage1: VoiceStage1Data;
  stage2: VoiceStage2Data;
  riskState: VoiceRiskState;
  peakRiskScore?: number;
  evidenceAnchor: { recordId: string; evidenceHash: string; ledgerAnchorBlock: number } | null;
  livenessScore?: number | null;
  onRunDemoAttack?: () => void;
  isDemoRunning?: boolean;
  isCallActive?: boolean;
}

export const VoiceIntegrityPanel = ({
  stage1,
  stage2,
  riskState,
  peakRiskScore,
  evidenceAnchor,
  livenessScore,
  isCallActive
}: VoiceIntegrityPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Determine if active voice stream is currently engaged or has processed audio
  const hasVoice = isCallActive !== false || (stage1.vas > 0 || riskState.index > 0);

  // Latched forensic threat index:
  // If an AI voice anomaly or manipulation was detected earlier in the video/stream (peakRiskScore >= 40),
  // the gauge and state banner retain the latched peak alert level rather than collapsing to "Monitoring Safe"
  // when trailing silence or humanized outro audio plays.
  const latchedPeak = (peakRiskScore && peakRiskScore >= 40) ? peakRiskScore : 0;
  const effectiveIndex = hasVoice ? Math.max(riskState.index, latchedPeak) : 0;

  // Determine state based on effectiveIndex if peak anomaly was latched
  const effectiveState = (effectiveIndex >= 85)
    ? 'Critical'
    : (effectiveIndex >= 70)
      ? 'High'
      : (effectiveIndex >= 40)
        ? 'Suspicious'
        : riskState.state;

  // 5-State Color Theme Mapping
  const getStateConfig = (state: string) => {
    switch (state) {
      case 'Critical':
        return {
          color: '#E24B4A',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/40',
          badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30',
          label: 'CRITICAL RISK',
          icon: ShieldAlert
        };
      case 'High':
        return {
          color: '#F97316',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/40',
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          label: 'HIGH ANOMALY',
          icon: ShieldAlert
        };
      case 'Suspicious':
        return {
          color: '#EF9F27',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/40',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          label: 'SUSPICIOUS',
          icon: AlertTriangle
        };
      case 'Insufficient Evidence':
        return {
          color: '#94A3B8',
          bgColor: 'bg-slate-500/10',
          borderColor: 'border-slate-500/30',
          badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
          label: 'INSUFFICIENT SIGNAL',
          icon: Activity
        };
      default: // Low / Watch
        return {
          color: '#1D9E75',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          label: 'MONITORING SAFE',
          icon: ShieldCheck
        };
    }
  };

  const currentTheme = getStateConfig(effectiveState);
  const StateIcon = currentTheme.icon;

  // Circular gauge math for Security Risk Index (0-100)
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const clampedIndex = hasVoice ? Math.min(100, Math.max(0, effectiveIndex)) : 0;
  const strokeDashoffset = circumference - (clampedIndex / 100) * circumference;

  return (
    <div className={`glass-card-strong rounded-2xl border ${currentTheme.borderColor} p-4 mb-4 shadow-xl transition-all duration-300 backdrop-blur-xl relative overflow-hidden`}>
      {/* Background glow pulse */}
      <div 
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: currentTheme.color }}
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${currentTheme.badgeBg}`}>
            <StateIcon className="w-5 h-5" style={{ color: currentTheme.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-wide text-white/90">DHWANI AI ACOUSTIC HUD</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${hasVoice ? currentTheme.badgeBg : 'bg-white/5 text-white/50 border-white/10'}`}>
                {hasVoice 
                  ? (latchedPeak >= 40 && riskState.index < 40 
                      ? `${currentTheme.label} (PEAK ${latchedPeak})` 
                      : currentTheme.label) 
                  : (isCallActive ? 'AWAITING VOICE' : 'STANDBY')}
              </span>
            </div>
            <p className="text-[11px] text-white/50 font-mono">3-Stage Parallel Tap • Zero Call Latency</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 4-Pillar Dynamic Acoustic & Consequence Fusion Telemetry */}
      {(() => {
        // 1. Stage 1 Voice Authenticity Score (Human Likelihood: higher = authentic human)
        const authenticityScore = hasVoice 
          ? (Math.max(0, Math.min(100, 100 - (stage1.vas || 0))) / 100).toFixed(2)
          : '--';

        // 2. Stage 2 Impersonation & Identity Trust Score (higher = verified identity)
        const identityScore = hasVoice 
          ? (stage2.profileStatus === 'deviated'
              ? Math.max(0.1, (100 - (stage2.impersonationRisk || 60)) / 100).toFixed(2)
              : stage2.similarity !== null
                ? stage2.similarity.toFixed(2)
                : Math.max(0.2, (100 - (stage2.impersonationRisk || 0)) / 100).toFixed(2))
          : '--';

        // 3. Stage 3 Active Liveness & Biological Prosody (higher = verified living human)
        let activeLivenessScore = '--';
        if (hasVoice) {
          let activeLivenessVal = 0.95;
          if (livenessScore !== undefined && livenessScore !== null) {
            activeLivenessVal = Math.max(0.05, Math.min(0.99, livenessScore / 100));
          } else if (stage1.vas >= 60) {
            activeLivenessVal = Math.max(0.05, (100 - stage1.vas) / 100);
          } else if (stage1.details) {
            const biologicalHealth = (stage1.details.breathIndex * 0.5) + (Math.min(0.1, stage1.details.pitchJitter) * 5);
            activeLivenessVal = Math.max(0.70, Math.min(0.98, biologicalHealth));
          }
          activeLivenessScore = activeLivenessVal.toFixed(2);
        }

        // 4. Consequence & High-Stakes Financial Intent
        let consequenceScore = '--';
        if (hasVoice) {
          let consequenceVal = 0.05;
          if (riskState.requiresHold) {
            consequenceVal = 0.95;
          } else if (riskState.isConsequential || (stage2.transactionKeywords && stage2.transactionKeywords.length > 0)) {
            consequenceVal = Math.min(0.90, 0.25 + (stage2.transactionKeywords?.length || 1) * 0.20);
          } else if (stage2.urgencyFlag) {
            consequenceVal = 0.45;
          }
          consequenceScore = consequenceVal.toFixed(2);
        }

        return (
          <div className="mt-3.5 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5" data-testid="fusion-scoring-grid">
            {/* Card 1: Authenticity (Blue) */}
            <div className="bg-sky-500/10 border border-sky-400/30 rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5 shadow-sm transition-all hover:bg-sky-500/15 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] sm:text-[11px] font-semibold text-white/90 leading-tight">Authenticity</span>
                <span className={`text-sm sm:text-base font-bold font-mono leading-tight mt-0.5 ${authenticityScore === '--' ? 'text-white/40' : 'text-white'}`}>
                  {authenticityScore}
                </span>
              </div>
            </div>

            {/* Card 2: Identity (Green) */}
            <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5 shadow-sm transition-all hover:bg-emerald-500/15 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] sm:text-[11px] font-semibold text-white/90 leading-tight">Identity</span>
                <span className={`text-sm sm:text-base font-bold font-mono leading-tight mt-0.5 ${identityScore === '--' ? 'text-white/40' : 'text-white'}`}>
                  {identityScore}
                </span>
              </div>
            </div>

            {/* Card 3: Passive Liveness (Orange) */}
            <div className="bg-orange-500/10 border border-orange-400/30 rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5 shadow-sm transition-all hover:bg-orange-500/15 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] sm:text-[11px] font-semibold text-white/90 leading-tight">Passive Liveness</span>
                <span className={`text-sm sm:text-base font-bold font-mono leading-tight mt-0.5 ${activeLivenessScore === '--' ? 'text-white/40' : 'text-white'}`}>
                  {activeLivenessScore}
                </span>
              </div>
            </div>

            {/* Card 4: Consequence (Purple) */}
            <div className="bg-purple-500/10 border border-purple-400/30 rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5 shadow-sm transition-all hover:bg-purple-500/15 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] sm:text-[11px] font-semibold text-white/90 leading-tight">Consequence</span>
                <span className={`text-sm sm:text-base font-bold font-mono leading-tight mt-0.5 ${consequenceScore === '--' ? 'text-white/40' : 'text-white'}`}>
                  {consequenceScore}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Main Stats Row */}
      <div className="mt-3.5 grid grid-cols-3 gap-3">
        {/* Metric 1: Security Risk Index Gauge */}
        <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 flex flex-col items-center justify-center text-center">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 70 70">
              <circle
                cx="35"
                cy="35"
                r={radius}
                fill="transparent"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="6"
              />
              <motion.circle
                cx="35"
                cy="35"
                r={radius}
                fill="transparent"
                stroke={currentTheme.color}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold font-mono text-white leading-none">
                {hasVoice ? clampedIndex : '--'}
              </span>
              <span className="text-[8px] font-mono text-white/50 uppercase mt-0.5">
                {hasVoice ? (latchedPeak > riskState.index ? 'PEAK SRI' : 'SRI') : 'WAITING'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-white/60 mt-1 uppercase tracking-wider">
            {latchedPeak > riskState.index ? 'Peak Risk' : 'Risk Index'}
          </span>
        </div>

        {/* Metric 2: Stage 1 Voice Authenticity Score (VAS) */}
        <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-white/50 uppercase">Stage 1: VAS</span>
            <Cpu className="w-3.5 h-3.5 text-primary/70" />
          </div>
          <div className="my-1">
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-bold font-mono ${stage1.vas >= 60 ? 'text-danger' : stage1.vas >= 40 ? 'text-warning' : 'text-primary'}`}>
                {hasVoice && stage1.vas > 0 ? `${stage1.vas}%` : '--'}
              </span>
              <span className="text-[9px] text-white/40">{hasVoice && stage1.vas > 0 ? 'synthetic' : 'awaiting voice'}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-1 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ 
                  width: hasVoice && stage1.vas > 0 ? `${stage1.vas}%` : '0%',
                  backgroundColor: stage1.vas >= 60 ? '#E24B4A' : stage1.vas >= 40 ? '#EF9F27' : '#1D9E75' 
                }}
              />
            </div>
          </div>
          <span className="text-[9px] text-white/40 truncate font-mono">
            Model: {hasVoice && stage1.vas > 0 ? stage1.model : 'standby'}
          </span>
        </div>

        {/* Metric 3: Stage 2 Speaker Consistency (ECAPA-TDNN) */}
        <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-white/50 uppercase">Stage 2: Voiceprint</span>
            <Fingerprint className="w-3.5 h-3.5 text-primary/70" />
          </div>
          <div className="my-1">
            {stage2.profileStatus === 'deviated' ? (
              <div className="text-danger font-bold text-xs flex items-center gap-1">
                <span>⚠️ {stage2.speakerDeviation}σ Mismatch</span>
              </div>
            ) : stage2.profileStatus === 'consistent' ? (
              <div className="text-primary font-bold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Consistent</span>
              </div>
            ) : (
              <div className="text-white/60 font-semibold text-xs">
                <span>🔍 No Profile</span>
              </div>
            )}
            <p className="text-[9px] text-white/50 mt-1 truncate">
              {stage2.profileStatus === 'deviated' 
                ? 'Deviates from enrolled' 
                : stage2.profileStatus === 'consistent' 
                ? 'Matches historical calls' 
                : 'First-seen contact'}
            </p>
          </div>
          <span className="text-[9px] text-white/40 truncate font-mono">
            Impersonation: {hasVoice ? `${stage2.impersonationRisk}%` : '--'}
          </span>
        </div>
      </div>

      {/* Real-Time Acoustic Voice Clone Waveform Telemetry */}
      <div className="mt-3.5" data-testid="voice-clone-graph-container">
        <VoiceCloneGraph 
          vas={stage1.vas || 0}
          isCallActive={Boolean(isCallActive)}
          confidence={stage1.confidence}
        />
      </div>

      {/* Expanded Forensics & Artifacts */}
      {isExpanded && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-2.5"
        >
          {/* Detected Acoustic Physical Fingerprints */}
          <div>
            <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block mb-1.5">
              Detected Acoustic Fingerprints ({stage1.artifacts?.length ?? 0})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(!stage1.artifacts || stage1.artifacts.length === 0) ? (
                <span className="text-xs text-white/40 italic font-mono">
                  Natural human micro-tremor & breath baseline verified
                </span>
              ) : (
                stage1.artifacts.map((art) => (
                  <span
                    key={art}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-500/10 text-red-300 border border-red-500/20 flex items-center gap-1"
                  >
                    <span>🔴</span>
                    <span>{art.replace(/_/g, ' ')}</span>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Policy Decision & Explanations */}
          {riskState.explanation && riskState.explanation.length > 0 && (
            <div className="bg-black/25 rounded-xl p-2.5 border border-white/5">
              <span className="text-[10px] font-mono text-white/50 uppercase block mb-1">
                Stage 3 Security Policy Rationale
              </span>
              <ul className="text-xs text-white/80 space-y-1">
                {riskState.explanation.map((exp, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-primary">•</span>
                    <span>{exp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tamper-Evident Ledger Anchor Footer */}
          {evidenceAnchor && (
            <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-1">
              <div className="flex items-center gap-1.5 truncate">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="truncate">Ledger Block #{evidenceAnchor.ledgerAnchorBlock}: {evidenceAnchor.evidenceHash.slice(0, 16)}...</span>
              </div>
              <span className="text-emerald-400 shrink-0 font-bold">TAMPER-EVIDENT</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
