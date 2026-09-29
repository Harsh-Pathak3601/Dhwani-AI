import React, { useEffect, useRef, useState } from 'react';
import { AudioFeatureExtractor } from '../services/audioFeatureExtractor';

interface MelSpectrogramProps {
  isCallActive?: boolean;
  vas?: number;
  artifacts?: string[];
  className?: string;
}

const MEL_BINS = 48; // 48 continuous Mel-filterbank channels
const HISTORY_COLS = 130; // 130 horizontal time slices for smooth continuous scrolling

export const MelSpectrogram: React.FC<MelSpectrogramProps> = ({
  isCallActive = false,
  vas = 0,
  artifacts = [],
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const historyRef = useRef<Float32Array[]>([]);

  const [peakFreq, setPeakFreq] = useState<number>(0);
  const [rmsEnergy, setRmsEnergy] = useState<number>(0);

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
      historyRef.current = Array.from({ length: HISTORY_COLS }, () => new Float32Array(MEL_BINS).fill(0.04));
    }
  }, []);

  // 60 FPS Heatmap Waterfall Canvas Loop
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

      const newColumn = new Float32Array(MEL_BINS);

      if (analyser && isCallActive) {
        // Extract real FFT frequency power
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
        let sumPower = 0;

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
            // Normalize -95 dB to -15 dB to 0.0 - 1.0 linear amplitude
            const norm = Math.max(0, Math.min(1, (db + 95) / 78));
            sum += norm;
            count++;
          }
          const avgPower = count > 0 ? sum / count : 0;
          // Perceptual dynamic contrast boost
          const boosted = Math.pow(avgPower, 1.35) * 1.2;
          const clamped = Math.max(0.01, Math.min(1.0, boosted));
          newColumn[b] = clamped;

          if (clamped > maxVal) {
            maxVal = clamped;
            dominantBin = b;
          }
          sumPower += clamped;
        }

        if (sampleTick % 8 === 0) {
          const estFreq = Math.round(700 * (Math.pow(10, (melMin + (dominantBin + 0.5) * melStep) / 2595) - 1));
          setPeakFreq(estFreq);
          setRmsEnergy(Math.round((sumPower / MEL_BINS) * 100));
        }

      } else {
        // Standby resting ambient thermal wave (never empty/dead)
        const time = Date.now() / 1000;
        for (let b = 0; b < MEL_BINS; b++) {
          const wave1 = Math.sin(b * 0.25 + time * 1.8) * 0.04;
          const wave2 = Math.cos(b * 0.12 - time * 1.2) * 0.03;
          const thermalFloor = 0.04 + (b < 10 ? 0.03 : 0.01);
          newColumn[b] = Math.max(0.02, thermalFloor + wave1 + wave2);
        }
      }

      // Shift rolling heatmap buffer
      historyRef.current.push(newColumn);
      if (historyRef.current.length > HISTORY_COLS) {
        historyRef.current.shift();
      }

      // ─── SCIENTIFIC INFERNO / MAGMA HEATMAP COLORMAP ───
      const getHeatmapColor = (normVal: number): string => {
        const v = Math.max(0, Math.min(1, normVal));
        if (v < 0.10) {
          // Deep noise floor: dark navy / black
          return '#050813';
        } else if (v < 0.28) {
          // Low energy: deep indigo to rich violet
          const t = (v - 0.10) / 0.18;
          const r = Math.round(15 + t * 55);
          const g = Math.round(10 + t * 15);
          const b = Math.round(45 + t * 90);
          return `rgb(${r}, ${g}, ${b})`;
        } else if (v < 0.52) {
          // Mid-low: electric violet to crimson
          const t = (v - 0.28) / 0.24;
          const r = Math.round(70 + t * 135);
          const g = Math.round(25 + t * 10);
          const b = Math.round(135 - t * 65);
          return `rgb(${r}, ${g}, ${b})`;
        } else if (v < 0.78) {
          // Formant resonance: fiery orange to cyber amber
          const t = (v - 0.52) / 0.26;
          const r = Math.round(205 + t * 45);
          const g = Math.round(35 + t * 135);
          const b = Math.round(70 - t * 50);
          return `rgb(${r}, ${g}, ${b})`;
        } else {
          // Peak acoustic harmonics: bright gold to glowing white-hot
          const t = (v - 0.78) / 0.22;
          const r = 255;
          const g = Math.round(170 + t * 85);
          const b = Math.round(20 + t * 235);
          return `rgb(${r}, ${g}, ${b})`;
        }
      };

      // ─── RENDER CONTINUOUS 2D TIME-FREQUENCY HEATMAP ───
      ctx.fillStyle = '#050813';
      ctx.fillRect(0, 0, width, height);

      const frames = historyRef.current;
      const numCols = frames.length;
      const colWidth = width / numCols;
      const rowHeight = height / MEL_BINS;

      for (let x = 0; x < numCols; x++) {
        const col = frames[x];
        const posX = Math.floor(x * colWidth);
        const w = Math.ceil(colWidth) + 0.5; // slight overlap avoids seam artifacts

        for (let b = 0; b < MEL_BINS; b++) {
          const val = col[b];
          // b=0 (65Hz) at the bottom, b=MEL_BINS-1 (8.5kHz) at the top
          const posY = Math.floor(height - (b + 1) * rowHeight);
          const h = Math.ceil(rowHeight) + 0.5;

          ctx.fillStyle = getHeatmapColor(val);
          ctx.fillRect(posX, posY, w, h);
        }
      }

      // Subtle horizontal octave grid guides
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      const octaveMarks = [0.25, 0.5, 0.75];
      octaveMarks.forEach((pct) => {
        const y = Math.floor(height * pct);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });

      // Synthetic Vocoder Shelf Highlight if AI clone risk or high VAS is flagged
      const isVocoderFlagged = (vas >= 50 && isCallActive) || artifacts.some(a => a.includes('high_frequency') || a.includes('vocoder'));
      if (isVocoderFlagged) {
        const shelfY = Math.floor(height * 0.22); // ~6.8kHz cutoff
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, shelfY);
        ctx.lineTo(width, shelfY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.font = '8px monospace';
        ctx.fillText('AI VOCODER SHELF CUTOFF', width - 150, shelfY - 3);
      }

      // Live Scanning Playhead line at right edge
      if (isCallActive) {
        ctx.strokeStyle = '#FF6D00';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#FF6D00';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(width - 1.5, 0);
        ctx.lineTo(width - 1.5, height);
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
  }, [isCallActive, vas, artifacts]);

  // Adjust high-resolution DPR for retina clarity
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }, []);

  return (
    <div className={`bg-[#050A14]/90 rounded-xl p-2.5 border border-white/10 shadow-lg relative overflow-hidden backdrop-blur-xl ${className}`}>
      
      {/* ── Compact Header Bar ── */}
      <div className="flex items-center justify-between gap-2 mb-1.5 relative z-10 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 10v4" />
              <path d="M6 6v12" />
              <path d="M10 3v18" />
              <path d="M14 8v8" />
              <path d="M18 5v14" />
              <path d="M22 10v4" />
            </svg>
          </div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">
            Mel Spectrogram Heatmap
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-white/50">
            48 Bins • 65Hz–8.5kHz
          </span>
        </div>

        {/* Dynamic Mode / Live Status Pill */}
        <div className="flex items-center gap-1.5">
          {isCallActive ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/35 text-[9px] font-mono font-bold text-orange-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500" />
              </span>
              <span>LIVE FFT 2048</span>
            </div>
          ) : (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">
              STANDBY
            </span>
          )}
        </div>
      </div>

      {/* ── Main Canvas: Continuous 2D Heatmap Waterfall ── */}
      <div className="relative rounded-lg overflow-hidden border border-white/10 bg-[#03060B]">
        <canvas
          ref={canvasRef}
          className="w-full h-[72px] block cursor-crosshair"
          style={{ width: '100%', height: '72px' }}
        />

        {/* Left Y-Axis Logarithmic Frequency Scale */}
        <div className="absolute left-1.5 top-0.5 bottom-0.5 flex flex-col justify-between text-[8px] font-mono text-white/45 pointer-events-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          <span>8.5k</span>
          <span>4.0k</span>
          <span>1.5k</span>
          <span>500</span>
          <span>65Hz</span>
        </div>

        {/* Bottom X-Axis Time Scale */}
        <div className="absolute bottom-0.5 right-2 left-10 flex justify-between text-[7.5px] font-mono text-white/35 pointer-events-none select-none">
          <span>-3.5s</span>
          <span>-2.0s</span>
          <span>-1.0s</span>
          <span className="text-amber-400 font-bold">NOW</span>
        </div>

        {/* Live Audio Telemetry Badge (Top Right) */}
        {isCallActive ? (
          <div className="absolute top-1 right-1.5 flex items-center gap-1.5 text-[8.5px] font-mono bg-black/75 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 text-white/80">
            <span>Peak: <strong className="text-amber-400">{peakFreq > 0 ? `${peakFreq} Hz` : '--'}</strong></span>
            <span className="text-white/30">•</span>
            <span>Power: <strong className="text-orange-400">{rmsEnergy}%</strong></span>
          </div>
        ) : (
          <div className="absolute top-1 right-1.5 text-[8px] font-mono bg-black/70 px-2 py-0.5 rounded border border-white/10 text-white/40">
            Awaiting Live Mic or Test File
          </div>
        )}
      </div>

      {/* ── Compact Inferno Heatmap Colormap Bar ── */}
      <div className="flex items-center justify-between text-[8.5px] font-mono text-white/45 pt-1.5 px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-white/40">Power (dB):</span>
          <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-[#050813] via-[#7c3aed] via-[#f59e0b] to-[#ffffff] border border-white/15" />
          <span className="text-[7.5px] text-white/35">-90dB → 0dB</span>
        </div>
        <div className="flex items-center gap-2 text-[8px]">
          <span className="text-cyan-400/80">F0 Fundamental</span>
          <span className="text-amber-400/80">Vowel Formants</span>
          <span className="text-red-400/80">Vocoder Shelf</span>
        </div>
      </div>

    </div>
  );
};

export default MelSpectrogram;
