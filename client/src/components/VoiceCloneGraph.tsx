import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, ShieldCheck, AlertTriangle, Radio } from 'lucide-react';

interface VoiceCloneGraphProps {
  vas: number; // 0 - 100 Voice Authenticity Score (Synthetic / Clone Likelihood)
  isCallActive?: boolean;
  confidence?: 'sufficient' | 'insufficient' | number;
  className?: string;
}

const POINT_COUNT = 36;
const SVG_WIDTH = 480;
const SVG_HEIGHT = 125;
const PADDING_TOP = 14;
const PADDING_BOTTOM = 22;

export const VoiceCloneGraph: React.FC<VoiceCloneGraphProps> = ({
  vas = 0,
  isCallActive = false,
  confidence = 'sufficient',
  className = '',
}) => {
  const isSignalLow = confidence === 'insufficient';
  // Circular buffer storing historical probability values (0-100)
  const [dataPoints, setDataPoints] = useState<number[]>(() => {
    // Initial low resting baseline with subtle natural variance
    return Array.from({ length: POINT_COUNT }, (_, i) => 
      Math.max(2, 6 + Math.sin(i * 0.4) * 3)
    );
  });

  const [peakVas, setPeakVas] = useState<number>(0);
  const targetVasRef = useRef(vas);
  const currentInterpolatedRef = useRef(vas);

  useEffect(() => {
    targetVasRef.current = vas;
    if (vas > peakVas) {
      setPeakVas(vas);
    }
  }, [vas, peakVas]);

  const prevActiveRef = useRef(isCallActive);
  useEffect(() => {
    // When a brand new call starts (transition from inactive to active), reset peak
    if (isCallActive && !prevActiveRef.current) {
      setPeakVas(0);
    }
    prevActiveRef.current = isCallActive;
  }, [isCallActive]);

  // Real-time animation loop feeding data points into the timeline buffer
  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints((prevPoints) => {
        let nextValue: number;

        if (!isCallActive) {
          // Resting baseline when idle/standby: gentle micro-undulation between 3% and 7%
          nextValue = 4 + Math.sin(Date.now() / 800) * 2;
        } else {
          // Smooth asymptotic approach to target VAS with realistic voice fluctuations
          const target = targetVasRef.current;
          const diff = target - currentInterpolatedRef.current;
          currentInterpolatedRef.current += diff * 0.35;

          const base = currentInterpolatedRef.current;

          if (base >= 55) {
            // High / Cloned Voice state: sharp synthetic jitter & elevated spikes
            const cloneNoise = (Math.random() - 0.5) * 6;
            nextValue = Math.min(100, Math.max(50, base + cloneNoise));
          } else if (base >= 35) {
            // Suspicious intermediate state
            const suspicionNoise = (Math.random() - 0.5) * 5;
            nextValue = Math.min(65, Math.max(25, base + suspicionNoise));
          } else {
            // Natural Human Voice: low baseline with biological vocal micro-tremor & breath fluctuations
            const organicTremor = (Math.random() - 0.5) * 2;
            nextValue = Math.max(0, Math.min(25, (base ?? 0) + organicTremor));
          }
        }

        const updated = [...prevPoints.slice(1), Math.round(nextValue * 10) / 10];
        return updated;
      });
    }, 280);

    return () => clearInterval(interval);
  }, [isCallActive]);

  // Determine current acoustic state and visual theme
  const currentVal = dataPoints[dataPoints.length - 1] ?? vas;
  const isCloned = isCallActive && currentVal >= 60;
  const isSuspicious = isCallActive && currentVal >= 40 && currentVal < 60;
  const isHuman = isCallActive && currentVal < 40;

  const theme = useMemo(() => {
    if (isCloned) {
      return {
        label: 'AI CLONED VOICE DETECTED',
        badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]',
        color: '#EF4444',
        glowColor: 'rgba(239, 68, 68, 0.45)',
        gradientTop: '#EF4444',
        gradientBottom: '#7F1D1D',
        statusIcon: ShieldAlert,
        statusText: 'CRITICAL SYNTHETIC RISK',
      };
    }
    if (isSuspicious) {
      return {
        label: 'ACOUSTIC ANOMALY SUSPECTED',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
        color: '#F59E0B',
        glowColor: 'rgba(245, 158, 11, 0.35)',
        gradientTop: '#F59E0B',
        gradientBottom: '#78350F',
        statusIcon: AlertTriangle,
        statusText: 'ELEVATED SYNTHETIC TRACES',
      };
    }
    if (isHuman) {
      return {
        label: 'NATURAL HUMAN SPEECH',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
        color: '#10B981',
        glowColor: 'rgba(16, 185, 129, 0.25)',
        gradientTop: '#10B981',
        gradientBottom: '#064E3B',
        statusIcon: ShieldCheck,
        statusText: 'BIOLOGICAL PROSODY VERIFIED',
      };
    }
    return {
      label: isSignalLow ? 'ANALYZING • WEAK SIGNAL' : 'STANDBY • WAITING FOR AUDIO',
      badgeBg: 'bg-white/5 text-white/50 border-white/10',
      color: '#06B6D4',
      glowColor: 'rgba(6, 182, 212, 0.15)',
      gradientTop: '#06B6D4',
      gradientBottom: '#164E63',
      statusIcon: Activity,
      statusText: isSignalLow ? 'INSUFFICIENT AUDIO SIGNAL' : 'ZERO-LATENCY PARALLEL TAP',
    };
  }, [isCloned, isSuspicious, isHuman, isSignalLow]);

  // Compute SVG coordinates and Catmull-Rom smooth spline path
  const graphMath = useMemo(() => {
    const usableHeight = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    // Helper: Map 0-100 value to SVG Y-coordinate (0 = bottom, 100 = top)
    const getY = (val: number) => {
      const clamped = Math.max(0, Math.min(100, val));
      return PADDING_TOP + usableHeight * (1 - clamped / 100);
    };

    const getX = (index: number) => {
      return (index / (POINT_COUNT - 1)) * SVG_WIDTH;
    };

    const points = dataPoints.map((val, idx) => ({
      x: getX(idx),
      y: getY(val),
      val,
    }));

    // Generate smooth Cubic Bezier path
    let linePath = '';
    let areaPath = '';

    if (points.length > 0) {
      linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

      for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const mx = (curr.x + next.x) / 2;
        linePath += ` C ${mx.toFixed(1)} ${curr.y.toFixed(1)}, ${mx.toFixed(1)} ${next.y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
      }

      const lastPoint = points[points.length - 1];
      const bottomY = SVG_HEIGHT - PADDING_BOTTOM + 6;
      areaPath = `${linePath} L ${lastPoint.x.toFixed(1)} ${bottomY.toFixed(1)} L ${points[0].x.toFixed(1)} ${bottomY.toFixed(1)} Z`;
    }

    // Critical threshold Y-lines
    const thresholdCloneY = getY(60);
    const thresholdHumanY = getY(30);

    const latestPoint = points[points.length - 1] ?? { x: SVG_WIDTH, y: getY(0), val: 0 };

    return {
      linePath,
      areaPath,
      thresholdCloneY,
      thresholdHumanY,
      latestPoint,
    };
  }, [dataPoints]);

  const StatusIcon = theme.statusIcon;
  const avgVas = useMemo(() => {
    const sum = dataPoints.reduce((acc, curr) => acc + curr, 0);
    return Math.round((sum / dataPoints.length) * 10) / 10;
  }, [dataPoints]);

  return (
    <div className={`bg-black/35 rounded-xl border border-white/10 p-3 relative overflow-hidden backdrop-blur-md transition-colors duration-500 ${className}`}>
      {/* Background radial glow */}
      <div
        className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: theme.color }}
      />

      {/* Header telemetry row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-lg flex items-center justify-center border transition-colors duration-300"
            style={{ 
              backgroundColor: `${theme.color}15`,
              borderColor: `${theme.color}40`,
              color: theme.color 
            }}
          >
            <StatusIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white/90 tracking-wide">
                VOICE CLONE REAL-TIME TELEMETRY
              </span>
              <span className="flex h-1.5 w-1.5 relative">
                {isCallActive && (
                  <span 
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ backgroundColor: theme.color }}
                  />
                )}
                <span 
                  className="relative inline-flex rounded-full h-1.5 w-1.5"
                  style={{ backgroundColor: isCallActive ? theme.color : '#64748B' }}
                />
              </span>
            </div>
            <p className="text-[10px] font-mono text-white/45">
              {theme.statusText}
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className={`px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 transition-all duration-300 ${theme.badgeBg}`}>
          {isCloned && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              🚨
            </motion.span>
          )}
          <span>{theme.label}</span>
        </div>
      </div>

      {/* SVG Waveform Graph Viewport */}
      <div className="relative w-full h-[120px] rounded-lg bg-black/40 border border-white/5 overflow-hidden">
        {/* Subtle Horizontal Grid lines & Threshold labels */}
        <div 
          className="absolute inset-x-0 border-b border-dashed border-red-500/30 flex items-center justify-between px-2 pointer-events-none z-10"
          style={{ top: `${(graphMath.thresholdCloneY / SVG_HEIGHT) * 100}%` }}
        >
          <span className="text-[9px] font-mono font-semibold text-red-400/80 bg-black/80 px-1 rounded">
            60% CLONE THRESHOLD (HIGH RISK)
          </span>
          <span className="text-[8px] font-mono text-red-400/60 hidden sm:inline">
            AASIST / WAV2VEC2 SPIKE
          </span>
        </div>

        <div 
          className="absolute inset-x-0 border-b border-dashed border-emerald-500/25 flex items-center justify-between px-2 pointer-events-none z-10"
          style={{ top: `${(graphMath.thresholdHumanY / SVG_HEIGHT) * 100}%` }}
        >
          <span className="text-[9px] font-mono font-semibold text-emerald-400/80 bg-black/80 px-1 rounded">
            30% NATURAL HUMAN BASELINE
          </span>
          <span className="text-[8px] font-mono text-emerald-400/60 hidden sm:inline">
            ORGANIC JITTER VERIFIED
          </span>
        </div>

        {/* The Dynamic SVG Waveform */}
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-full preserve-3d"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Area gradient under the line */}
            <linearGradient id="cloneAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.gradientTop} stopOpacity={isCloned ? 0.55 : 0.3} />
              <stop offset="60%" stopColor={theme.gradientBottom} stopOpacity={0.15} />
              <stop offset="100%" stopColor={theme.gradientBottom} stopOpacity={0.0} />
            </linearGradient>

            {/* Glowing stroke filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Area fill under curve */}
          {graphMath.areaPath && (
            <path
              d={graphMath.areaPath}
              fill="url(#cloneAreaGradient)"
              className="transition-all duration-300"
            />
          )}

          {/* Foreground curve line with neon glow */}
          {graphMath.linePath && (
            <path
              d={graphMath.linePath}
              fill="none"
              stroke={theme.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neonGlow)"
              className="transition-all duration-300"
            />
          )}

          {/* Real-time head marker with ping at latest reading */}
          {isCallActive && graphMath.latestPoint && (
            <g>
              <circle
                cx={graphMath.latestPoint.x}
                cy={graphMath.latestPoint.y}
                r="6"
                fill={theme.color}
                opacity="0.4"
                className="animate-ping"
              />
              <circle
                cx={graphMath.latestPoint.x}
                cy={graphMath.latestPoint.y}
                r="3.5"
                fill="#FFFFFF"
                stroke={theme.color}
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Live reading overlay at bottom right corner of canvas */}
        <div className="absolute right-2 bottom-1.5 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 z-20">
          <Radio className="w-2.5 h-2.5" style={{ color: theme.color }} />
          <span className="text-[10px] font-mono text-white/60">CURRENT:</span>
          <span 
            className="text-xs font-mono font-bold"
            style={{ color: theme.color }}
          >
            {isCallActive ? `${Math.round(currentVal)}%` : '--'}
          </span>
        </div>
      </div>

      {/* Telemetry metadata footer strip */}
      <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
        <div className="flex flex-col">
          <span className="text-white/40 uppercase">Synthetic Probability</span>
          <span className="font-bold text-white text-xs mt-0.5">
            {isCallActive ? `${Math.round(currentVal)}%` : '--'}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-white/40 uppercase">Session Peak</span>
          <span className={`font-bold text-xs mt-0.5 ${peakVas >= 60 ? 'text-red-400' : peakVas >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isCallActive || peakVas > 0 ? `${Math.round(peakVas)}%` : '--'}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-white/40 uppercase">Rolling Average</span>
          <span className="font-bold text-white text-xs mt-0.5">
            {isCallActive || avgVas > 0 ? `${avgVas}%` : '--'}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-white/40 uppercase">Acoustic Status</span>
          <span className={`font-bold text-xs mt-0.5 truncate ${isCloned ? 'text-red-400' : isSuspicious ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isCloned ? 'CLONE ELEVATED' : isSuspicious ? 'ANOMALY DETECTED' : isCallActive ? 'HUMAN LOW LEVEL' : 'AWAITING CALL'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceCloneGraph;
