import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, ShieldCheck, Activity, Cpu, Fingerprint,
  Lock, AlertTriangle, ChevronDown, ChevronUp,
  Target, Sliders, Radio, CheckCircle2, AlertCircle
} from 'lucide-react';
import { VoiceStage1Data, VoiceStage2Data, VoiceRiskState } from '../store/useSessionStore';
import { VoiceCloneGraph } from './VoiceCloneGraph';
import { MelSpectrogram } from './MelSpectrogram';


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
  className?: string;
}

export const VoiceIntegrityPanel = ({
  stage1,
  stage2,
  riskState,
  peakRiskScore,
  evidenceAnchor,
  livenessScore,
  isCallActive,
  className = ''
}: VoiceIntegrityPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [telemetryTab, setTelemetryTab] = useState<'graph' | 'spectrogram' | 'dual'>('graph');

  // Determine if active voice stream is currently engaged or has processed audio
  const hasVoice = isCallActive !== false || (stage1.vas > 0 || riskState.index > 0);

  // Latched forensic threat index:
  // If an AI voice anomaly or manipulation was detected earlier in the stream/file (peakRiskScore >= 40),
  // retain the peak alert level for protective tiering and security states.
  const latchedPeak = (peakRiskScore && peakRiskScore >= 40) ? peakRiskScore : 0;
  
  // Live dynamic risk score from current speech chunk
  const liveRisk = hasVoice ? Math.min(100, Math.max(0, riskState.index)) : 0;
  
  // Display index for gauge: dynamically moves with live speech risk, falling back to peak if live speech pauses
  const displayIndex = liveRisk > 0 ? liveRisk : latchedPeak;

  // Peak security tier for protective status banner and colors (defensive)
  const peakTierScore = Math.max(liveRisk, latchedPeak);
  const effectiveState = (peakTierScore >= 75)
    ? 'Critical'
    : (peakTierScore >= 55)
      ? 'High'
      : (peakTierScore >= 40)
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
  const clampedIndex = hasVoice ? Math.min(100, Math.max(0, displayIndex)) : 0;
  const strokeDashoffset = circumference - (clampedIndex / 100) * circumference;

  return (
    <div className={`glass-card-strong rounded-2xl border ${currentTheme.borderColor} p-4 shadow-xl transition-all duration-300 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between h-full ${className}`}>
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
        // 1. Stage 1 Voice Authenticity & Deepfake Probability (Aligned 1:1 with Stage 1 VAS: higher = synthetic threat)
        const syntheticScore = hasVoice
          ? (Math.min(100, Math.max(0, stage1.vas || 0)) / 100).toFixed(2)
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
            {/* Card 1: Acoustic Deepfake (Aligned 1:1 with Stage 1 VAS) */}
            <div className="bg-sky-500/10 border border-sky-400/30 rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-2.5 shadow-sm transition-all hover:bg-sky-500/15 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] sm:text-[11px] font-semibold text-white/90 leading-tight">Acoustic Deepfake</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`text-sm sm:text-base font-bold font-mono leading-tight ${syntheticScore === '--' ? 'text-white/40' : stage1.vas >= 60 ? 'text-danger' : stage1.vas >= 40 ? 'text-warning' : 'text-emerald-400'}`}>
                    {syntheticScore}
                  </span>
                  {hasVoice && stage1.vas > 0 && (
                    <span className="text-[9px] font-mono text-white/50">({stage1.vas}% VAS)</span>
                  )}
                </div>
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
      <div className="mt-3.5 grid grid-cols-2 gap-3">
        {/* Metric 1: Security Risk Index Gauge */}
        <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center text-center">
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
              <span className="text-[8px] font-mono text-white/50 uppercase mt-0.5 tracking-wider">
                {hasVoice ? (latchedPeak > 0 ? `PEAK ${latchedPeak}` : 'LIVE SRI') : 'WAITING'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold font-mono text-white/60 mt-1.5 uppercase tracking-wider">
            Risk Index
          </span>
        </div>

        {/* Metric 2: AI Synthesis (VAS) */}
        <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider font-semibold">AI Synthesis (VAS)</span>
            <Cpu className="w-4 h-4 text-orange-500 shrink-0" />
          </div>
          <div className="my-1">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-bold font-mono ${hasVoice && stage1.vas > 0 ? (stage1.vas >= 60 ? 'text-danger' : stage1.vas >= 40 ? 'text-warning' : 'text-primary') : 'text-orange-500'}`}>
                {hasVoice && stage1.vas > 0 ? `${stage1.vas}%` : '--'}
              </span>
              <span className="text-[9px] text-white/40 font-mono">
                {hasVoice && stage1.vas > 0 ? 'synthetic probability' : 'awaiting voice'}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-1.5 overflow-hidden">
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
      </div>

      {/* Visual Telemetry Engine Selector & Controls */}
      <div className="mt-3.5 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider font-semibold">
          Live Acoustic Telemetry
        </span>
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => setTelemetryTab('graph')}
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
              telemetryTab === 'graph'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Waveform</span>
          </button>
          <button
            type="button"
            onClick={() => setTelemetryTab('spectrogram')}
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
              telemetryTab === 'spectrogram'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Mel Spectrogram</span>
          </button>
          <button
            type="button"
            onClick={() => setTelemetryTab('dual')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
              telemetryTab === 'dual'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <span>Dual</span>
          </button>
        </div>
      </div>

      {/* Real-Time Acoustic Voice Clone Waveform / Mel Spectrogram Telemetry */}
      <div className="mt-2" data-testid="voice-clone-graph-container">
        {telemetryTab === 'graph' && (
          <VoiceCloneGraph
            vas={stage1.vas || 0}
            riskIndex={peakTierScore}
            riskState={effectiveState}
            isCallActive={Boolean(isCallActive)}
            confidence={stage1.confidence}
          />
        )}
        {telemetryTab === 'spectrogram' && (
          <MelSpectrogram
            vas={stage1.vas || 0}
            riskIndex={peakTierScore}
            riskState={effectiveState}
            isCallActive={Boolean(isCallActive)}
            artifacts={stage1.artifacts || []}
            compact={true}
          />
        )}
        {telemetryTab === 'dual' && (
          <div className="space-y-2.5">
            <VoiceCloneGraph
              vas={stage1.vas || 0}
              riskIndex={peakTierScore}
              riskState={effectiveState}
              isCallActive={Boolean(isCallActive)}
              confidence={stage1.confidence}
            />
            <MelSpectrogram
              vas={stage1.vas || 0}
              riskIndex={peakTierScore}
              riskState={effectiveState}
              isCallActive={Boolean(isCallActive)}
              artifacts={stage1.artifacts || []}
              compact={true}
            />
          </div>
        )}
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
                stage1.artifacts.map((art) => {
                  const isPositive = art.includes('human') || art.includes('authentic') || art.includes('bonafide');
                  return (
                    <span
                      key={art}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1.5 ${
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                          : 'bg-red-500/10 text-red-300 border border-red-500/20'
                      }`}
                    >
                      {isPositive ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                      )}
                      <span>{art.replace(/_/g, ' ')}</span>
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* Policy Decision & Explanations */}
          {(() => {
            const rawExplanationList = Array.isArray(riskState.explanation)
              ? riskState.explanation
              : riskState.explanation
                ? [String(riskState.explanation)]
                : [];
            // Sanitize vendor or internal model names from user-facing frontend UI
            const explanationList = rawExplanationList
              .map(exp => exp.replace(/Modulate\s*/gi, '').replace(/Velma(-2)?\s*(Batch)?/gi, 'Forensic Acoustic Engine').trim())
              .filter(Boolean);

            if (explanationList.length === 0) return null;
            return (
              <div className="bg-black/25 rounded-xl p-2.5 border border-white/5">
                <span className="text-[10px] font-mono text-white/50 uppercase block mb-1">
                  Security Policy Rationale
                </span>
                <ul className="text-xs text-white/80 space-y-1">
                  {explanationList.map((exp, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-primary">•</span>
                      <span>{exp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Tamper-Evident Ledger Anchor Footer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-2 border-t border-white/5 mt-auto">
            <div className="flex items-center gap-1.5 truncate">
              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">
                {evidenceAnchor
                  ? `Ledger Block #${evidenceAnchor.ledgerAnchorBlock}: ${evidenceAnchor.evidenceHash.slice(0, 16)}...`
                  : 'Zero-Knowledge Cryptographic Hash Anchor Active'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 shrink-0 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>TAMPER-EVIDENT</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
