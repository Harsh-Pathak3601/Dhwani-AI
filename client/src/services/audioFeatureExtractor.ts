/**
 * Browser-side Audio DSP Feature Extractor
 * Operates on a parallel tap of the microphone stream using the Web Audio API.
 * Computes acoustic physical fingerprints (Mel flux, MFCC, Pitch F0, ZCR, Pauses, Breathing proxy)
 * without sending raw audio bytes to the backend.
 */

export interface AudioFeatures {
  melSpec: number[];
  cqt: number[];
  mfcc: number[];
  f0: number[];
  zcr: number[];
  pauses: {
    count: number;
    avgDurationMs: number;
    uniformity: number; // 0 to 1, higher = machine uniform
  };
  breathingProxy: number; // 0 to 1, higher = natural breath detected
  windowType: 'short' | 'medium' | 'long';
  timestamp: number;
}

export type FeatureCallback = (features: AudioFeatures) => void;

export class AudioFeatureExtractor {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private callback: FeatureCallback | null = null;

  // Analysis buffers
  private f0History: number[] = [];
  private mfccHistory: number[] = [];
  private energyHistory: number[] = [];
  private lastEmitTime: number = 0;
  private windowCycle: number = 0;

  public start(stream: MediaStream, onFeatures: FeatureCallback) {
    if (this.isRunning) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      this.sourceNode = this.audioCtx.createMediaStreamSource(stream);
      this.sourceNode.connect(this.analyser);

      this.callback = onFeatures;
      this.isRunning = true;
      this.lastEmitTime = Date.now();

      this.processLoop();
    } catch (err) {
      console.error('Failed to initialize AudioFeatureExtractor:', err);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.f0History = [];
    this.mfccHistory = [];
    this.energyHistory = [];
  }

  private processLoop = () => {
    if (!this.isRunning || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const freqData = new Float32Array(bufferLength);
    const timeData = new Float32Array(this.analyser.fftSize);

    this.analyser.getFloatFrequencyData(freqData);
    this.analyser.getFloatTimeDomainData(timeData);

    // 1. Calculate Fundamental Frequency (F0) via Autocorrelation
    const f0 = this.detectPitchAutocorrelation(timeData, this.audioCtx?.sampleRate || 44100);
    if (f0 > 50 && f0 < 600) {
      this.f0History.push(f0);
    }
    if (this.f0History.length > 50) this.f0History.shift();

    // 2. Zero-Crossing Rate (ZCR)
    let zcrCount = 0;
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i] >= 0 && timeData[i - 1] < 0) || (timeData[i] < 0 && timeData[i - 1] >= 0)) {
        zcrCount++;
      }
    }
    const zcr = zcrCount / timeData.length;

    // 3. Spectral Energy & Mel Approximation
    const melBands = this.approximateMelBands(freqData);
    const currentRms = Math.sqrt(timeData.reduce((acc, val) => acc + val * val, 0) / timeData.length);
    this.energyHistory.push(currentRms);
    if (this.energyHistory.length > 60) this.energyHistory.shift();

    // Approximate MFCCs from Mel bands
    const mfccApprox = this.computeDCT(melBands).slice(0, 13);
    this.mfccHistory.push(...mfccApprox);
    if (this.mfccHistory.length > 39) this.mfccHistory = this.mfccHistory.slice(-39);

    const now = Date.now();
    const elapsed = now - this.lastEmitTime;

    // Multi-resolution window cadence:
    // Short (~1s), Medium (~3s), Long (~8s)
    if (elapsed >= 1000) {
      this.lastEmitTime = now;
      this.windowCycle++;

      let windowType: 'short' | 'medium' | 'long' = 'short';
      if (this.windowCycle % 8 === 0) {
        windowType = 'long';
      } else if (this.windowCycle % 3 === 0) {
        windowType = 'medium';
      }

      // Calculate Pause & Breathing Metrics
      const pauses = this.analyzePauses(this.energyHistory);
      const breathingProxy = this.analyzeBreathingProxy(this.energyHistory);

      const features: AudioFeatures = {
        melSpec: Array.from(melBands),
        cqt: Array.from(melBands.slice(0, 16)), // CQT representation proxy
        mfcc: Array.from(mfccApprox),
        f0: this.f0History.slice(-15),
        zcr: [zcr],
        pauses,
        breathingProxy,
        windowType,
        timestamp: now
      };

      if (this.callback) {
        this.callback(features);
      }
    }

    this.animFrameId = requestAnimationFrame(this.processLoop);
  };

  /**
   * Autocorrelation method to estimate pitch (F0)
   */
  private detectPitchAutocorrelation(buffer: Float32Array, sampleRate: number): number {
    const SIZE = buffer.length;
    let sumOfSquares = 0;
    for (let i = 0; i < SIZE; i++) {
      sumOfSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumOfSquares / SIZE);
    if (rms < 0.01) return -1; // Silence or background noise

    let r1 = 0;
    let r2 = SIZE - 1;
    const threshold = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < threshold) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < threshold) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmed = buffer.slice(r1, r2);
    const newSize = trimmed.length;
    const c = new Float32Array(newSize);

    for (let i = 0; i < newSize; i++) {
      for (let j = 0; j < newSize - i; j++) {
        c[i] += trimmed[j] * trimmed[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < newSize; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    if (T0 > 0) {
      return sampleRate / T0;
    }
    return -1;
  }

  /**
   * Approximates 20 triangular Mel-filterbank energies, peak-normalized to 0-1.
   * Real Web Audio API frequency data is in dB (-100 to 0) producing very small
   * linear values (0.00001 to 1.0). Peak-normalizing ensures the delta-smoothness
   * thresholds in voiceAuthService are on the same scale as the simulated values.
   */
  private approximateMelBands(freqData: Float32Array): Float32Array {
    const numBands = 20;
    const bands = new Float32Array(numBands);
    const step = Math.floor(freqData.length / numBands);

    for (let i = 0; i < numBands; i++) {
      let sum = 0;
      for (let j = i * step; j < (i + 1) * step; j++) {
        // Convert dB (-100 to 0) to normalized linear amplitude (0 to 1)
        const linear = Math.pow(10, freqData[j] / 20);
        sum += isNaN(linear) ? 0 : linear;
      }
      bands[i] = sum / step;
    }

    // Peak-normalize to 0-1 range so detection thresholds are scale-invariant.
    // This ensures real mic audio produces values comparable to the simulated
    // attack fingerprints ([0.65-0.82]) used to tune the smoothness thresholds.
    let peak = 0;
    for (let i = 0; i < numBands; i++) {
      if (bands[i] > peak) peak = bands[i];
    }
    if (peak > 0) {
      for (let i = 0; i < numBands; i++) {
        bands[i] = bands[i] / peak;
      }
    }

    return bands;
  }


  /**
   * Discrete Cosine Transform for MFCC approximation
   */
  private computeDCT(input: Float32Array): number[] {
    const N = input.length;
    const result: number[] = [];
    for (let k = 0; k < N; k++) {
      let sum = 0;
      for (let n = 0; n < N; n++) {
        sum += input[n] * Math.cos((Math.PI / N) * (n + 0.5) * k);
      }
      result.push(sum);
    }
    return result;
  }

  /**
   * Analyzes silence pauses and mechanical timing uniformity
   */
  private analyzePauses(energySeries: number[]): { count: number; avgDurationMs: number; uniformity: number } {
    const silenceThreshold = 0.015;
    let pauseCount = 0;
    const pauseDurations: number[] = [];
    let currentPause = 0;

    for (const rms of energySeries) {
      if (rms < silenceThreshold) {
        currentPause++;
      } else {
        if (currentPause > 2) {
          pauseCount++;
          pauseDurations.push(currentPause * 100);
        }
        currentPause = 0;
      }
    }

    const avgDurationMs = pauseDurations.length > 0
      ? pauseDurations.reduce((a, b) => a + b, 0) / pauseDurations.length
      : 250;

    // High uniformity = all pauses are almost exactly equal duration (hallmark of TTS)
    let uniformity = 0.3;
    if (pauseDurations.length >= 2) {
      const variance = pauseDurations.reduce((sum, d) => sum + Math.pow(d - avgDurationMs, 2), 0) / pauseDurations.length;
      const std = Math.sqrt(variance);
      // Normalized: 1 = zero variation in pause duration
      uniformity = Math.max(0, Math.min(1, 1 - (std / (avgDurationMs + 1))));
    }

    return { count: pauseCount, avgDurationMs, uniformity };
  }

  /**
   * Analyzes respiratory energy dip before phrases (absent in standard TTS vocoders)
   */
  private analyzeBreathingProxy(energySeries: number[]): number {
    if (energySeries.length < 10) return 0.5;
    // Human breath produces subtle ~0.008 to 0.025 RMS bursts immediately prior to voiced onset
    let breathLikeCount = 0;
    for (let i = 2; i < energySeries.length - 1; i++) {
      const prev = energySeries[i - 2];
      const cur = energySeries[i];
      const next = energySeries[i + 1];
      if (prev < 0.005 && cur >= 0.008 && cur <= 0.028 && next > 0.05) {
        breathLikeCount++;
      }
    }
    return Math.min(1, breathLikeCount / 3);
  }

  /**
   * Demo Scenario Feature Generator
   * Injects simulated acoustic physical fingerprints matching the SIH 2026 CFO Clone attack
   */
  public static generateSimulatedFeatures(mode: 'synthetic_attack' | 'authentic_human'): AudioFeatures {
    const now = Date.now();
    if (mode === 'synthetic_attack') {
      // Machine-perfect F0 curve, unnaturally smooth MFCC, uniform pauses, zero breathing proxy
      return {
        melSpec: [0.82, 0.81, 0.79, 0.78, 0.75, 0.74, 0.72, 0.70, 0.68, 0.65],
        cqt: [0.80, 0.79, 0.78, 0.77, 0.75, 0.74],
        mfcc: [0.45, 0.44, 0.43, 0.42, 0.41, 0.40, 0.39, 0.38, 0.37, 0.36, 0.35, 0.34, 0.33],
        f0: [142.1, 142.2, 142.0, 142.1, 142.3, 142.1, 142.2, 142.1, 142.2, 142.1], // Jitter < 0.2%
        zcr: [0.08, 0.08, 0.08],
        pauses: { count: 3, avgDurationMs: 400, uniformity: 0.94 }, // Machine uniform
        breathingProxy: 0.05, // No natural breath
        windowType: 'medium',
        timestamp: now
      };
    } else {
      // Natural human micro-jitter, dynamic spectral flux, natural breathing
      return {
        melSpec: [0.45, 0.62, 0.38, 0.71, 0.54, 0.29, 0.66, 0.41, 0.58, 0.33],
        cqt: [0.50, 0.65, 0.42, 0.58, 0.39, 0.61],
        mfcc: [0.38, 0.52, 0.24, 0.61, 0.43, 0.28, 0.55, 0.34, 0.49, 0.29, 0.41, 0.33, 0.47],
        f0: [135.4, 141.2, 128.9, 146.5, 138.1, 131.7, 144.3, 137.9, 142.0, 129.5], // Jitter > 4%
        zcr: [0.12, 0.18, 0.09],
        pauses: { count: 2, avgDurationMs: 620, uniformity: 0.38 },
        breathingProxy: 0.82,
        windowType: 'medium',
        timestamp: now
      };
    }
  }
}
