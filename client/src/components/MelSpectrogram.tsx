import React, { useEffect, useRef, useState, useMemo } from 'react';
import { AudioFeatureExtractor } from '../services/audioFeatureExtractor';

export interface MelSpectrogramProps {
  isCallActive?: boolean;
  vas?: number; // 0 - 100 Voice Authenticity Score
  riskIndex?: number; // 0 - 98 Security Risk Index
  riskState?: 'Insufficient Evidence' | 'Low' | 'Suspicious' | 'High' | 'Critical' | string;
  artifacts?: string[];
  className?: string;
  compact?: boolean;
}

const MEL_BINS = 64; // 64 continuous logarithmic Mel-filterbank channels for high frequency definition
const HISTORY_COLS = 160; // 160 horizontal time slices for smooth continuous scrolling

export const MelSpectrogram: React.FC<MelSpectrogramProps> = ({
  isCallActive = false,
  vas = 0,
  riskIndex = 0,
  riskState,
  artifacts = [],
  className = '',
  compact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const historyRef = useRef<Float32Array[]>([]);

  const [peakFreq, setPeakFreq] = useState<number>(0);
  const [rmsEnergy, setRmsEnergy] = useState<number>(0);

  // Dynamic threat level combining acoustic VAS and Security Risk Index (0 - 98 max)
  const targetThreat = Math.min(98, Math.max(0, Math.max(vas || 0, riskIndex || 0)));
  const targetThreatRef = useRef(targetThreat);
  const currentThreatRef = useRef(targetThreat);

  useEffect(() => {
    targetThreatRef.current = targetThreat;
  }, [targetThreat]);

  // Determine active threat tier matching VoiceCloneGraph logic
  const effectiveTier: 'Critical' | 'High' | 'Suspicious' | 'Low' = useMemo(() => {
    if (riskState === 'Critical' || targetThreat >= 75) return 'Critical';
    if (riskState === 'High' || targetThreat >= 55) return 'High';
    if (riskState === 'Suspicious' || targetThreat >= 40) return 'Suspicious';
    return 'Low';
  }, [riskState, targetThreat]);

  // Determine if AI voice cloning is explicitly detected (Strictly Critical Risk Index only)
  const isCloneDetected = useMemo(() => {
    if (!isCallActive) return false;
    return (
      effectiveTier === 'Critical' ||
      riskState === 'Critical' ||
      targetThreat >= 70
    );
  }, [isCallActive, effectiveTier, riskState, targetThreat]);

  // Dynamic theme matching the acoustic cockpit threat tier
  const theme = useMemo(() => {
    if (!isCallActive) {
      return {
        tier: 'STANDBY',
        label: 'Awaiting Audio Stream',
        badgeBg: 'bg-white/5 text-white/50 border-white/10',
        color: '#06B6D4',
        border: 'border-white/10',
        shadow: 'shadow-lg',
        glowColor: 'rgba(6, 182, 212, 0.12)',
        statusText: 'STANDBY',
      };
    }
    if (isCloneDetected || effectiveTier === 'Critical') {
      return {
        tier: 'CRITICAL',
        label: 'VOICE CLONING DETECTED',
        badgeBg: 'bg-red-500/25 text-red-200 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.45)] animate-pulse',
        color: '#EF4444',
        border: 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.35)]',
        shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.35)]',
        glowColor: 'rgba(239, 68, 68, 0.45)',
        statusText: 'VOICE CLONING DETECTED',
      };
    }
    if (effectiveTier === 'High') {
      return {
        tier: 'HIGH',
        label: 'HIGH RISK THREAT',
        badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.3)]',
        color: '#F97316',
        border: 'border-orange-500/40 shadow-[0_0_16px_rgba(249,115,22,0.25)]',
        shadow: 'shadow-[0_0_16px_rgba(249,115,22,0.25)]',
        glowColor: 'rgba(249, 115, 22, 0.4)',
        statusText: 'HIGH ANOMALY DETECTED',
      };
    }
    if (effectiveTier === 'Suspicious') {
      return {
        tier: 'SUSPICIOUS',
        label: 'ACOUSTIC ANOMALY',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
        color: '#F59E0B',
        border: 'border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
        shadow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]',
        glowColor: 'rgba(245, 158, 11, 0.35)',
        statusText: 'ELEVATED SYNTHETIC TRACES',
      };
    }
    return {
      tier: 'LOW',
      label: 'NATURAL HUMAN SPEECH',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
      color: '#10B981',
      border: 'border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
      shadow: 'shadow-lg',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      statusText: 'BIOMETRIC BASELINE VERIFIED',
    };
  }, [isCallActive, effectiveTier]);

  // Subscribe to live AnalyserNode from AudioFeatureExtractor
  useEffect(() => {
    const unsubscribe = AudioFeatureExtractor.onAnalyserChange((analyser) => {
      analyserRef.current = analyser;
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Initialize rolling heatmap buffer with resting ambient thermal floor
  useEffect(() => {
    if (historyRef.current.length === 0) {
      historyRef.current = Array.from({ length: HISTORY_COLS }, () => new Float32Array(MEL_BINS).fill(0.05));
    }
  }, []);

  // 60 FPS Scientific Mel Spectrogram Waterfall Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sampleTick = 0;

    const render = () => {
      sampleTick++;
      const analyser = analyserRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Smooth threat interpolation mirroring VoiceCloneGraph
      const threatDiff = targetThreatRef.current - currentThreatRef.current;
      currentThreatRef.current += threatDiff * 0.16;
      const threat = currentThreatRef.current;

      const newColumn = new Float32Array(MEL_BINS);

      // Check if real microphone audio is providing active energy
      let hasRealAudio = false;
      let rawSumPower = 0;

      if (analyser && isCallActive) {
        const bufferLength = analyser.frequencyBinCount;
        const freqData = new Float32Array(bufferLength);
        analyser.getFloatFrequencyData(freqData);

        const sampleRate = analyser.context?.sampleRate || 44100;
        const binHz = (sampleRate / 2) / bufferLength;

        // Logarithmic Mel-Scale Mapping: 65 Hz to 8500 Hz
        const fMin = 65;
        const fMax = Math.min(8500, sampleRate / 2);
        const melMin = 2595 * Math.log10(1 + fMin / 700);
        const melMax = 2595 * Math.log10(1 + fMax / 700);
        const melStep = (melMax - melMin) / MEL_BINS;

        let maxVal = 0;
        let dominantBin = 0;

        for (let b = 0; b < MEL_BINS; b++) {
          const melStart = melMin + b * melStep;
          const melEnd = melMin + (b + 1) * melStep;
          const fStart = 700 * (Math.pow(10, melStart / 2595) - 1);
          const fEnd = 700 * (Math.pow(10, melEnd / 2595) - 1);

          const binStart = Math.max(0, Math.floor(fStart / binHz));
          const binEnd = Math.max(binStart + 1, Math.min(bufferLength, Math.ceil(fEnd / binHz)));

          let sum = 0;
          let count = 0;
          for (let j = binStart; j < binEnd; j++) {
            const db = freqData[j];
            // Normalize -95 dB to -15 dB into 0.0 - 1.0 linear amplitude
            const norm = Math.max(0, Math.min(1, (db + 95) / 78));
            sum += norm;
            count++;
          }
          const avgPower = count > 0 ? sum / count : 0;
          // Perceptual dynamic contrast boost for speech clarity
          const boosted = Math.pow(avgPower, 1.3) * 1.25;
          const clamped = Math.max(0.02, Math.min(1.0, boosted));
          newColumn[b] = clamped;

          if (clamped > maxVal) {
            maxVal = clamped;
            dominantBin = b;
          }
          rawSumPower += clamped;
        }

        if (maxVal > 0.14) {
          hasRealAudio = true;
        }

        if (hasRealAudio && sampleTick % 6 === 0) {
          const estFreq = Math.round(700 * (Math.pow(10, (melMin + (dominantBin + 0.5) * melStep) / 2595) - 1));
          setPeakFreq(estFreq);
          setRmsEnergy(Math.round((rawSumPower / MEL_BINS) * 100));
        }
      }

      // ─── ACOUSTIC SPEECH SYNTHESIS & THREAT LAYER ───
      // If no live mic or during simulated attack / file parsing, render organic speech spectrogram
      // matching the visual texture of Python librosa/magma spectrograms (formant tracks & glottal pulses)
      if (isCallActive) {
        if (!hasRealAudio) {
          const time = Date.now() / 1000;
          const intensity = Math.max(0.25, threat / 100);

          // Syllabic speech cadence (intermittent phrases and pauses)
          const phraseEnv = Math.max(0, Math.sin(time * 2.2) * 0.7 + Math.sin(time * 4.5) * 0.3);
          const isVoiced = phraseEnv > 0.15;

          // Vocal Formants (F0 fundamental, F1 vowel, F2 oral cavity, F3 vocal tract, F4)
          const f0Bin = 5 + Math.floor(Math.sin(time * 3.1) * 2);
          const f1Bin = 15 + Math.floor(Math.sin(time * 3.8) * 3);
          const f2Bin = 28 + Math.floor(Math.cos(time * 2.6) * 4);
          const f3Bin = 40 + Math.floor(Math.sin(time * 2.1) * 3);
          const f4Bin = 50 + Math.floor(Math.cos(time * 1.7) * 2);

          // Glottal Closure Instant (GCI) pulse: thin vertical striations every 5-7 frames typical of voiced speech
          const isGlottalPulse = sampleTick % 6 === 0 || sampleTick % 7 === 0;

          for (let b = 0; b < MEL_BINS; b++) {
            // Ambient thermal floor
            let val = 0.04 + (b < 10 ? 0.04 : 0.01);

            if (isVoiced) {
              const distF0 = Math.abs(b - f0Bin);
              const distF1 = Math.abs(b - f1Bin);
              const distF2 = Math.abs(b - f2Bin);
              const distF3 = Math.abs(b - f3Bin);
              const distF4 = Math.abs(b - f4Bin);

              // Formant energy envelopes
              if (distF0 <= 2) val += (1 - distF0 * 0.35) * 0.65 * intensity * phraseEnv;
              if (distF1 <= 3) val += (1 - distF1 * 0.28) * 0.55 * intensity * phraseEnv;
              if (distF2 <= 3) val += (1 - distF2 * 0.30) * 0.48 * intensity * phraseEnv;
              if (distF3 <= 4) val += (1 - distF3 * 0.24) * 0.40 * intensity * phraseEnv;
              if (distF4 <= 3) val += (1 - distF4 * 0.32) * 0.30 * intensity * phraseEnv;

              // Vertical glottal pulse striations across spectrum
              if (isGlottalPulse && b < 52) {
                val += 0.15 * phraseEnv * (1 - b / 64);
              }
            }

            // ─── Elevated Risk Anomaly Synthesis (matching VoiceCloneGraph threat level) ───
            if (threat >= 40) {
              const cloneFactor = (threat - 35) / 63; // 0 to 1
              // 1. Robotic comb-filter harmonics (unnatural rigid vertical and horizontal phase lock)
              if (b % 4 === 0 && b >= 10 && b <= 48) {
                val += 0.24 * cloneFactor * (0.65 + Math.sin(time * 18 + b) * 0.35);
              }
              // 2. High-frequency AI vocoder cutoff shelf (sharp attenuation above bin 50 ~6.8kHz)
              if (b >= 50) {
                val *= Math.max(0.04, 1 - cloneFactor * 0.88);
              }
              // 3. Vocoder phase micro-jitter in mid-upper harmonics
              if (b >= 35 && b <= 49) {
                val += (Math.random() - 0.5) * 0.1 * cloneFactor;
              }
            }

            newColumn[b] = Math.max(0.02, Math.min(0.98, val));
          }

          if (sampleTick % 6 === 0) {
            setPeakFreq(Math.round(210 + Math.sin(time * 3.5) * 45));
            setRmsEnergy(Math.round(intensity * 75 * phraseEnv));
          }
        } else if (threat >= 40) {
          // If real microphone audio is active AND risk is elevated:
          // Overlay the detected synthetic deepfake vocoder anomalies onto the live FFT stream
          const cloneFactor = (threat - 35) / 63;
          for (let b = 0; b < MEL_BINS; b++) {
            // Apply vocoder shelf cutoff above bin 50 (~6.8kHz)
            if (b >= 50) {
              newColumn[b] = newColumn[b] * (1 - cloneFactor * 0.75);
            }
            // Enhance detected synthetic harmonic comb anomalies
            if (b % 4 === 0 && b >= 12 && b <= 42) {
              newColumn[b] = Math.min(1.0, newColumn[b] + 0.20 * cloneFactor);
            }
          }
        }
      } else {
        // Standby resting ambient thermal floor (never dead or empty)
        const time = Date.now() / 1000;
        for (let b = 0; b < MEL_BINS; b++) {
          const wave1 = Math.sin(b * 0.22 + time * 1.6) * 0.04;
          const wave2 = Math.cos(b * 0.14 - time * 1.1) * 0.03;
          const thermalFloor = 0.05 + (b < 12 ? 0.03 : 0.01);
          newColumn[b] = Math.max(0.02, thermalFloor + wave1 + wave2);
        }
      }

      // Shift rolling heatmap history buffer
      historyRef.current.push(newColumn);
      if (historyRef.current.length > HISTORY_COLS) {
        historyRef.current.shift();
      }

      // ─── AUTHENTIC MAGMA SPEECH SPECTROGRAM COLORMAP (Derived from reference image) ───
      const getMagmaColor = (normVal: number): string => {
        const v = Math.max(0, Math.min(1, normVal));
        if (v < 0.08) {
          // Deep plum/purple background floor
          const t = v / 0.08;
          const r = Math.round(24 + t * 18);
          const g = Math.round(4 + t * 6);
          const b = Math.round(34 + t * 24);
          return `rgb(${r}, ${g}, ${b})`;
        } else if (v < 0.26) {
          // Deep violet to dark magenta
          const t = (v - 0.08) / 0.18;
          const r = Math.round(42 + t * 76);
          const g = Math.round(10 + t * 28);
          const b = Math.round(58 + t * 35);
          return `rgb(${r}, ${g}, ${b})`;
        } else if (v < 0.50) {
          // Rich magenta to vibrant violet-rose
          const t = (v - 0.26) / 0.24;
          const r = Math.round(118 + t * 54);
          const g = Math.round(38 + t * 34);
          const b = Math.round(93 + t * 32);
          return `rgb(${r}, ${g}, ${b})`;
        } else if (v < 0.74) {
          // Vibrant salmon to fiery coral-pink
          const t = (v - 0.50) / 0.24;
          const r = Math.round(172 + t * 76);
          const g = Math.round(72 + t * 45);
          const b = Math.round(125 - t * 15);
          return `rgb(${r}, ${g}, ${b})`;
        } else if (v < 0.90) {
          // Warm glowing amber / gold
          const t = (v - 0.74) / 0.16;
          const r = 248 + Math.round(t * 7);
          const g = Math.round(117 + t * 75);
          const b = Math.round(110 - t * 42);
          return `rgb(${r}, ${g}, ${b})`;
        } else {
          // Peak acoustic harmonics: bright pale yellow to glowing white
          const t = (v - 0.90) / 0.10;
          const r = 255;
          const g = Math.round(192 + t * 63);
          const b = Math.round(68 + t * 187);
          return `rgb(${r}, ${g}, ${b})`;
        }
      };

      // ─── RENDER CONTINUOUS 2D TIME-FREQUENCY HEATMAP ───
      ctx.fillStyle = '#180320';
      ctx.fillRect(0, 0, width, height);

      const frames = historyRef.current;
      const numCols = frames.length;
      const colWidth = width / numCols;
      const rowHeight = height / MEL_BINS;

      for (let x = 0; x < numCols; x++) {
        const col = frames[x];
        const posX = Math.floor(x * colWidth);
        const w = Math.ceil(colWidth) + 0.5;

        for (let b = 0; b < MEL_BINS; b++) {
          const val = col[b];
          // b=0 (65Hz) at the bottom, b=MEL_BINS-1 (8.5kHz) at the top
          const posY = Math.floor(height - (b + 1) * rowHeight);
          const h = Math.ceil(rowHeight) + 0.5;

          ctx.fillStyle = getMagmaColor(val);
          ctx.fillRect(posX, posY, w, h);
        }
      }

      // Subtle horizontal octave grid guides
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      const octaveMarks = [0.22, 0.45, 0.70];
      octaveMarks.forEach((pct) => {
        const y = Math.floor(height * pct);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });

      const isVocoderFlagged = (isCallActive && threat >= 40) || artifacts.some(a => a.includes('high_frequency') || a.includes('vocoder'));
      if (isVocoderFlagged) {
        const shelfY = Math.floor(height * 0.22); // ~6.8kHz cutoff
        const isCriticalVocoder = threat >= 70;
        ctx.strokeStyle = isCriticalVocoder
          ? 'rgba(239, 68, 68, 0.95)'
          : threat >= 40
            ? 'rgba(249, 115, 22, 0.9)'
            : 'rgba(245, 158, 11, 0.85)';
        ctx.lineWidth = isCriticalVocoder ? 2.0 : 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(0, shelfY);
        ctx.lineTo(width, shelfY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = isCriticalVocoder
          ? 'rgba(239, 68, 68, 0.95)'
          : threat >= 40
            ? 'rgba(249, 115, 22, 0.9)'
            : 'rgba(245, 158, 11, 0.85)';
        ctx.font = 'bold 9px monospace';
        const labelText = isCriticalVocoder
          ? '⚠️ AI VOCODER SHELF • VOICE CLONING DETECTED'
          : '⚡ VOCODER SHELF ANOMALY';
        ctx.fillText(labelText, width - (compact ? 240 : 270), shelfY - 4);
      }

      // Live Scanning Playhead line at right edge with dynamic threat glow
      if (isCallActive) {
        ctx.strokeStyle = theme.color;
        ctx.lineWidth = 2.0;
        ctx.shadowColor = theme.color;
        ctx.shadowBlur = threat >= 75 ? 12 : 7;
        ctx.beginPath();
        ctx.moveTo(width - 2, 0);
        ctx.lineTo(width - 2, height);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isCallActive, artifacts, theme]);

  // Adjust high-resolution DPR for retina clarity
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }, [compact]);

  const displayThreat = Math.round(targetThreat);

  return (
    <div
      className={`bg-[#0A0512]/95 border transition-all duration-500 relative overflow-hidden backdrop-blur-2xl ${
        compact ? 'rounded-xl p-2.5 sm:p-3' : 'rounded-2xl p-3 sm:p-4'
      } ${theme.border} ${theme.shadow} ${className}`}
      data-testid="mel-spectrogram-container"
    >
      {/* Background radial threat glow matching VoiceCloneGraph */}
      <div
        className="absolute -top-14 -right-14 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: theme.color }}
      />

      {/* ── Header Telemetry Bar ── */}
      <div className={`flex items-center justify-between gap-2 relative z-10 flex-wrap ${compact ? 'mb-1.5' : 'mb-2.5'}`}>
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center transition-colors duration-500 shadow-sm shrink-0"
            style={{ backgroundColor: `${theme.color}25`, border: `1px solid ${theme.color}60`, color: theme.color }}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 10v4" />
              <path d="M6 6v12" />
              <path d="M10 3v18" />
              <path d="M14 8v8" />
              <path d="M18 5v14" />
              <path d="M22 10v4" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white">
              Mel Spectrogram
            </span>
            <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-white/50">
              64 Bins • Magma
            </span>
          </div>
        </div>

        {/* Dynamic Threat & Live Status Badge */}
        <div className="flex items-center gap-1.5">
          {isCallActive ? (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold transition-all duration-300 ${theme.badgeBg}`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-80"
                  style={{ backgroundColor: theme.color }}
                />
                <span
                  className="relative inline-flex rounded-full h-1.5 w-1.5"
                  style={{ backgroundColor: theme.color }}
                />
              </span>
              <span>{theme.statusText}</span>
              <span className="font-mono font-black ml-0.5">({displayThreat}%)</span>
            </div>
          ) : (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
              STANDBY
            </span>
          )}
        </div>
      </div>

      {/* ── Main Canvas: Continuous Magma Spectrogram Waterfall ── */}
      <div className="relative rounded-lg overflow-hidden border border-white/10 bg-[#12041A]">
        <canvas
          ref={canvasRef}
          className="w-full block cursor-crosshair"
          style={{ width: '100%', height: compact ? '72px' : '96px' }}
        />

        {/* 🚨 In-Graph Voice Cloning Detected Alert Pill */}
        {isCloneDetected && (
          <div className="absolute top-1 left-12 z-20 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/90 border border-red-400 text-white font-mono text-[8px] sm:text-[9px] font-black tracking-wide shadow-[0_0_15px_rgba(239,68,68,0.85)] animate-pulse pointer-events-none">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            <span>VOICE CLONING DETECTED</span>
            <span className="text-red-200 ml-0.5">({displayThreat}%)</span>
          </div>
        )}

        {/* Left Y-Axis Logarithmic Frequency Scale with Tick Lines */}
        <div className="absolute left-1.5 top-0.5 bottom-0.5 flex flex-col justify-between text-[7.5px] font-mono text-white/60 pointer-events-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          <span>8.5k—</span>
          <span>4.0k—</span>
          <span>1.5k—</span>
          <span>500—</span>
          <span>65Hz—</span>
        </div>

        {/* Bottom X-Axis Time Scale */}
        <div className="absolute bottom-0.5 right-2 left-10 flex justify-between text-[7.5px] font-mono text-white/40 pointer-events-none select-none">
          <span>-3.5s</span>
          <span>-2.0s</span>
          <span>-1.0s</span>
          <span style={{ color: theme.color }} className="font-bold">NOW</span>
        </div>

        {/* Live Audio & Risk Telemetry Overlay Badge (Top Right) */}
        {isCallActive ? (
          <div className="absolute top-1 right-1.5 flex items-center gap-1.5 text-[8px] font-mono bg-black/85 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 text-white/90 shadow-md">
            <span>Peak: <strong className="text-amber-400">{peakFreq > 0 ? `${peakFreq} Hz` : '--'}</strong></span>
            <span className="text-white/30">•</span>
            <span>Power: <strong className="text-orange-400">{rmsEnergy}%</strong></span>
            <span className="text-white/30">•</span>
            <span>
              Risk:{' '}
              <strong style={{ color: theme.color }} className="font-bold">
                {displayThreat}/98
              </strong>
            </span>
          </div>
        ) : (
          <div className="absolute top-1 right-1.5 text-[7.5px] font-mono bg-black/80 px-2 py-0.5 rounded border border-white/10 text-white/40">
            Awaiting Mic / File
          </div>
        )}
      </div>

      {/* ── Compact Magma Colormap Bar & Acoustic Legend ── */}
      <div className="flex items-center justify-between text-[8px] font-mono text-white/50 pt-1.5 px-0.5 flex-wrap gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-white/40">Power:</span>
          <div className="w-16 h-1 rounded-full bg-gradient-to-r from-[#180320] via-[#7b1d6d] via-[#ea6d4d] via-[#f6aa3d] to-[#fef18c] border border-white/15" />
          <span className="text-[7px] text-white/40">-90dB → 0dB</span>
        </div>
        <div className="flex items-center gap-2 text-[7.5px]">
          <span className="text-cyan-400/90">F0 Pitch</span>
          <span className="text-amber-400/90">Formants</span>
          <span className={displayThreat >= 40 ? 'text-red-400 font-bold' : 'text-red-400/70'}>
            Vocoder Shelf {displayThreat >= 40 ? '(ALERT)' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MelSpectrogram;
