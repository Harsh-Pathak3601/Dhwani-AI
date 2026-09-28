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
  acousticMetrics?: {
    bassRatio: number;
    speechRms: number;
    hfCutoffRatio: number;
    nsdfPeak: number;
    shimmer?: number;
    jitter?: number;
    mfccSmoothness?: number;
    dynamicRangeDb?: number;
    f0Curvature?: number;
  };
  windowType: 'short' | 'medium' | 'long';
  timestamp: number;
}

export type FeatureCallback = (features: AudioFeatures) => void;

export class AudioFeatureExtractor {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private fileSourceNode: AudioBufferSourceNode | null = null;
  private streamDestination: MediaStreamAudioDestinationNode | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private callback: FeatureCallback | null = null;

  // Analysis buffers
  private f0History: number[] = [];
  private mfccHistory: number[] = [];
  private mfccTimeFrames: number[][] = [];
  private energyHistory: number[] = [];
  private lastEmitTime: number = 0;
  private lastPitchTime: number = 0;
  private lastNsdfPeak: number = 0;
  private lastGlottalShimmer: number = 0.045;
  private lastGlottalJitter: number = 0.035;
  private windowCycle: number = 0;

  public start(stream: MediaStream, onFeatures: FeatureCallback) {
    if (this.isRunning) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      // Ensure AudioContext is actively resumed (browsers default to 'suspended' without direct synchronous click)
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(err => console.warn('Initial AudioContext resume deferred:', err));
      }

      // Re-check resume on any user gesture to guarantee capture
      const tryResume = () => {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
      };
      window.addEventListener('click', tryResume, { once: true });
      window.addEventListener('keydown', tryResume, { once: true });

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.6; // Responsive acoustic capture

      this.sourceNode = this.audioCtx.createMediaStreamSource(stream);

      // High-pass filter at 65 Hz to cut out sub-bass electrical rumble while preserving voice harmonics
      const hpFilter = this.audioCtx.createBiquadFilter();
      hpFilter.type = 'highpass';
      hpFilter.frequency.value = 65;
      hpFilter.Q.value = 0.707;

      // 2.5x Gain Boost node: ensures faint audio from an external phone speaker placed near the laptop is clearly captured
      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = 2.5;

      this.sourceNode.connect(hpFilter);
      hpFilter.connect(gainNode);
      gainNode.connect(this.analyser);

      this.callback = onFeatures;
      this.isRunning = true;
      this.lastEmitTime = Date.now();
      this.lastPitchTime = 0;
      this.lastNsdfPeak = 0;

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
    if (this.fileSourceNode) {
      try { this.fileSourceNode.stop(); } catch (_) {}
      this.fileSourceNode.disconnect();
      this.fileSourceNode = null;
    }
    if (this.streamDestination) {
      try { this.streamDestination.disconnect(); } catch (_) {}
      this.streamDestination = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.f0History = [];
    this.mfccHistory = [];
    this.mfccTimeFrames = [];
    this.energyHistory = [];
    this.lastPitchTime = 0;
    this.lastNsdfPeak = 0;
    this.lastGlottalShimmer = 0.045;
    this.lastGlottalJitter = 0.035;
  }

  private processLoop = () => {
    if (!this.isRunning || !this.analyser) return;

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const freqData = new Float32Array(bufferLength);
    const timeData = new Float32Array(this.analyser.fftSize);

    this.analyser.getFloatFrequencyData(freqData);
    this.analyser.getFloatTimeDomainData(timeData);

    const now = Date.now();

    // 2. Zero-Crossing Rate (ZCR) and RMS
    let zcrCount = 0;
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i] >= 0 && timeData[i - 1] < 0) || (timeData[i] < 0 && timeData[i - 1] >= 0)) {
        zcrCount++;
      }
    }
    const zcr = zcrCount / timeData.length;
    const currentRms = Math.sqrt(timeData.reduce((acc, val) => acc + val * val, 0) / timeData.length);
    this.energyHistory.push(currentRms);
    if (this.energyHistory.length > 60) this.energyHistory.shift();

    // 1. Calculate Fundamental Frequency (F0) at ~12Hz cadence (every 80ms) for high precision without freezing UI
    if (now - this.lastPitchTime >= 80) {
      this.lastPitchTime = now;
      const f0 = this.detectPitchAutocorrelation(timeData, this.audioCtx?.sampleRate || 44100);
      if (f0 > 65 && f0 < 450) {
        this.f0History.push(f0);
        this.analyzeGlottalPerturbations(timeData, this.audioCtx?.sampleRate || 44100, f0, currentRms);
      }
      if (this.f0History.length > 25) this.f0History.shift();
    }

    // 3. Spectral Energy & Logarithmic Mel Approximation
    const melBands = this.approximateMelBands(freqData);

    // Approximate MFCCs from Mel bands
    const mfccApprox = this.computeDCT(melBands).slice(0, 13);
    this.mfccHistory.push(...mfccApprox);
    if (this.mfccHistory.length > 39) this.mfccHistory = this.mfccHistory.slice(-39);
    this.mfccTimeFrames.push(Array.from(mfccApprox));
    if (this.mfccTimeFrames.length > 20) this.mfccTimeFrames.shift();

    const elapsed = now - this.lastEmitTime;
    const emitInterval = this.windowCycle === 0 ? 250 : 350;

    // Multi-resolution window cadence:
    // Continuous responsive telemetry cadence (~350ms)
    if (elapsed >= emitInterval) {
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

      // Acoustic physical metrics for phone speaker & vocoder discrimination
      const sampleRate = this.audioCtx ? this.audioCtx.sampleRate : 44100;
      const binHz = (sampleRate / 2) / bufferLength;

      // 1. Mid formant energy (800 Hz to 2500 Hz) in raw linear amplitude
      const bin800 = Math.max(0, Math.floor(800 / binHz));
      const bin2500 = Math.min(freqData.length, Math.ceil(2500 / binHz));
      let midLinSum = 0;
      let midLinCount = 0;
      for (let j = bin800; j < bin2500; j++) {
        const lin = Math.pow(10, freqData[j] / 20);
        if (!isNaN(lin)) {
          midLinSum += lin;
          midLinCount++;
        }
      }
      const midLinAvg = midLinCount > 0 ? (midLinSum / midLinCount) : 1e-4;

      // 2. Glottal bass fundamental (65 Hz to 350 Hz) in raw linear amplitude
      const bin65 = Math.max(0, Math.floor(65 / binHz));
      const bin350 = Math.min(freqData.length, Math.ceil(350 / binHz));
      let bassLinSum = 0;
      let bassLinCount = 0;
      for (let j = bin65; j < bin350; j++) {
        const lin = Math.pow(10, freqData[j] / 20);
        if (!isNaN(lin)) {
          bassLinSum += lin;
          bassLinCount++;
        }
      }
      const bassLinAvg = bassLinCount > 0 ? (bassLinSum / bassLinCount) : 1e-4;
      const bassRatio = bassLinAvg / Math.max(1e-4, midLinAvg);

      // 3. High frequency shelf above 11.5 kHz (24kHz vocoder cutoff compared to upper sibilants)
      const bin3_5k = Math.max(0, Math.floor(3500 / binHz));
      const bin8k = Math.min(freqData.length, Math.ceil(8000 / binHz));
      let sibilantSum = 0;
      let sibilantCount = 0;
      for (let j = bin3_5k; j < bin8k; j++) {
        const lin = Math.pow(10, freqData[j] / 20);
        if (!isNaN(lin)) {
          sibilantSum += lin;
          sibilantCount++;
        }
      }
      const sibilantAvg = sibilantCount > 0 ? (sibilantSum / sibilantCount) : 1e-4;

      const bin11_5k = Math.max(0, Math.floor(11500 / binHz));
      let hfSum = 0;
      let hfCount = 0;
      for (let j = bin11_5k; j < freqData.length; j++) {
        const lin = Math.pow(10, freqData[j] / 20);
        if (!isNaN(lin)) {
          hfSum += lin;
          hfCount++;
        }
      }
      const hfAvg = hfCount > 0 ? hfSum / hfCount : 0;
      const hfCutoffRatio = hfAvg / Math.max(1e-4, sibilantAvg);

      // 4. Temporal MFCC Trajectory Smoothness (vocoders produce mathematically smooth splines)
      let mfccSmoothness = 0.40;
      if (this.mfccTimeFrames.length >= 4) {
        let curvSum = 0;
        let count = 0;
        for (let c = 1; c < 12; c++) {
          for (let t = 1; t < this.mfccTimeFrames.length - 1; t++) {
            const d1 = this.mfccTimeFrames[t][c] - this.mfccTimeFrames[t - 1][c];
            const d2 = this.mfccTimeFrames[t + 1][c] - this.mfccTimeFrames[t][c];
            curvSum += Math.abs(d2 - d1);
            count++;
          }
        }
        const avgCurv = count > 0 ? curvSum / count : 0.5;
        // Human speech typically exhibits avgCurv 0.08 - 0.25 across frames; vocoder splines have avgCurv < 0.015.
        // Exponential mapping maps human natural speech to 0.35 - 0.45 and vocoder splines to 0.88 - 0.95.
        mfccSmoothness = Math.max(0.15, Math.min(0.95, Math.exp(-avgCurv * 8.0)));
      }

      // 5. Dynamic Energy Contrast (studio compressed vocoders exhibit 12-20 dB vs natural 25-40 dB)
      const activeEnergies = this.energyHistory.filter(e => e > 0.001);
      let dynamicRangeDb = 26;
      if (activeEnergies.length >= 4) {
        const maxE = Math.max(...activeEnergies);
        const minE = Math.min(...activeEnergies);
        dynamicRangeDb = 20 * Math.log10(Math.max(1.05, maxE / Math.max(1e-4, minE)));
        dynamicRangeDb = Math.max(8, Math.min(42, dynamicRangeDb));
      }

      // 6. Pitch Curvature
      let f0Curvature = 5.0;
      if (this.f0History.length >= 3) {
        let curvSum = 0;
        for (let i = 1; i < this.f0History.length - 1; i++) {
          curvSum += Math.abs((this.f0History[i + 1] - this.f0History[i]) - (this.f0History[i] - this.f0History[i - 1]));
        }
        f0Curvature = curvSum / (this.f0History.length - 2);
      }

      const features: AudioFeatures = {
        melSpec: Array.from(melBands),
        cqt: Array.from(melBands.slice(0, 16)), // CQT representation proxy
        mfcc: Array.from(mfccApprox),
        f0: this.f0History.slice(-15),
        zcr: [zcr],
        pauses,
        breathingProxy,
        acousticMetrics: {
          bassRatio,
          speechRms: currentRms,
          hfCutoffRatio,
          nsdfPeak: this.lastNsdfPeak,
          shimmer: this.lastGlottalShimmer,
          jitter: this.lastGlottalJitter,
          mfccSmoothness,
          dynamicRangeDb,
          f0Curvature
        },
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
   * Normalized Square Difference Function (NSDF) pitch estimator bounded to human vocal range (65 Hz - 450 Hz).
   * Robust against volume decay, DC bias, and AC electrical hum.
   */
  private detectPitchAutocorrelation(buffer: Float32Array, sampleRate: number): number {
    const SIZE = buffer.length;
    let sumOfSquares = 0;
    for (let i = 0; i < SIZE; i++) {
      sumOfSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumOfSquares / SIZE);
    // Ignore true silence
    if (rms < 0.001) return -1;

    // Human fundamental frequency boundaries: 65 Hz to 450 Hz
    const minLag = Math.floor(sampleRate / 450);
    const maxLag = Math.min(Math.floor(SIZE / 2), Math.ceil(sampleRate / 65));

    let bestLag = -1;
    let maxNsdf = 0;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let numerator = 0;
      let energy1 = 0;
      let energy2 = 0;
      const count = SIZE - lag;

      for (let j = 0; j < count; j++) {
        const x1 = buffer[j];
        const x2 = buffer[j + lag];
        numerator += x1 * x2;
        energy1 += x1 * x1;
        energy2 += x2 * x2;
      }

      const denominator = energy1 + energy2;
      if (denominator > 0) {
        const nsdf = (2 * numerator) / denominator;
        if (nsdf > 0.16 && nsdf > maxNsdf) {
          maxNsdf = nsdf;
          bestLag = lag;
        }
      }
    }

    this.lastNsdfPeak = maxNsdf;

    if (bestLag > minLag && bestLag < maxLag && maxNsdf >= 0.16) {
      // 3-point parabolic interpolation around peak for fractional lag resolution
      const computeNsdfAtLag = (l: number): number => {
        let num = 0;
        let e1 = 0;
        let e2 = 0;
        const cnt = SIZE - l;
        for (let j = 0; j < cnt; j++) {
          const a = buffer[j];
          const b = buffer[j + l];
          num += a * b;
          e1 += a * a;
          e2 += b * b;
        }
        const den = e1 + e2;
        return den > 0 ? (2 * num) / den : 0;
      };

      const y1 = computeNsdfAtLag(bestLag - 1);
      const y2 = maxNsdf;
      const y3 = computeNsdfAtLag(bestLag + 1);

      const denom = 2 * (2 * y2 - y1 - y3);
      let fineLag = bestLag;
      if (Math.abs(denom) > 1e-5) {
        const delta = (y3 - y1) / denom;
        if (Math.abs(delta) <= 1.0) {
          fineLag = bestLag + delta;
        }
      }

      return sampleRate / fineLag;
    }

    if (bestLag > 0 && maxNsdf >= 0.16) {
      return sampleRate / bestLag;
    }
    return -1;
  }

  /**
   * Analyzes cycle-to-cycle peak amplitude shimmer and period jitter.
   * Living human vocal folds naturally exhibit 3.5% - 11% shimmer.
   * Neural vocoders (HiFi-GAN, ElevenLabs) produce unnaturally flat < 1.8% shimmer.
   */
  private analyzeGlottalPerturbations(buffer: Float32Array, sampleRate: number, pitchHz: number, rms: number = 0.03): void {
    if (pitchHz < 65 || pitchHz > 450) return;
    const lag = Math.round(sampleRate / pitchHz);
    if (lag < 15 || lag > buffer.length / 2) return;

    const peaks: number[] = [];
    const peakIndices: number[] = [];
    const minPeak = Math.max(0.0012, rms * 0.20);

    for (let start = 0; start + lag <= buffer.length; start += lag) {
      let maxVal = -1;
      let maxIdx = -1;
      for (let i = start; i < start + lag; i++) {
        const val = Math.abs(buffer[i]);
        if (val > maxVal) {
          maxVal = val;
          maxIdx = i;
        }
      }
      if (maxVal > minPeak) {
        peaks.push(maxVal);
        peakIndices.push(maxIdx);
      }
    }

    if (peaks.length >= 3) {
      // Calculate true cycle-to-cycle amplitude perturbation (glottal shimmer) on steady cycles
      const validShimmers: number[] = [];
      for (let i = 1; i < peaks.length; i++) {
        const p1 = peaks[i - 1];
        const p2 = peaks[i];
        const ratio = p2 / Math.max(1e-4, p1);
        // Exclude syllable attack/decay jumps so we measure true glottal cycle shimmer
        if (ratio >= 0.40 && ratio <= 2.5) {
          const meanVal = (p1 + p2) / 2;
          if (meanVal > minPeak * 0.8) {
            validShimmers.push(Math.abs(p2 - p1) / meanVal);
          }
        }
      }
      if (validShimmers.length >= 2) {
        this.lastGlottalShimmer = validShimmers.reduce((a, b) => a + b, 0) / validShimmers.length;
      }

      // Calculate period-to-period cycle jitter
      const validJitters: number[] = [];
      for (let i = 1; i < peakIndices.length; i++) {
        const p1 = peakIndices[i - 1];
        const p2 = peakIndices[i];
        const period = p2 - p1;
        if (Math.abs(period - lag) < lag * 0.40) {
          validJitters.push(period);
        }
      }
      if (validJitters.length >= 2) {
        let jitterSum = 0;
        for (let i = 1; i < validJitters.length; i++) {
          jitterSum += Math.abs(validJitters[i] - validJitters[i - 1]);
        }
        this.lastGlottalJitter = (jitterSum / (validJitters.length - 1)) / lag;
      }
    }
  }

  /**
   * Directly decodes and analyzes an audio or video file (e.g., MP4/MP3/WAV)
   * Plays the audio through the speaker while computing exact DSP features.
   */
  public async startFile(file: File, onFeatures: FeatureCallback, onEnded?: () => void): Promise<void> {
    this.stop();
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.6;

    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    this.fileSourceNode = source;

    source.connect(this.analyser);
    source.connect(this.audioCtx.destination);

    this.streamDestination = this.audioCtx.createMediaStreamDestination();
    source.connect(this.streamDestination);

    this.callback = onFeatures;
    this.isRunning = true;
    this.lastEmitTime = Date.now();
    this.lastPitchTime = 0;
    this.lastNsdfPeak = 0;
    this.lastGlottalShimmer = 0.012; // Initial vocoder assumption for external files until proven human
    this.lastGlottalJitter = 0.006;
    this.windowCycle = 0;

    source.start(0);
    this.processLoop();

    source.onended = () => {
      this.stop();
      if (onEnded) {
        onEnded();
      }
    };
  }

  /**
   * Returns the MediaStream from file playback for streaming transcription (Deepgram/SpeechRec).
   */
  public getMediaStream(): MediaStream | null {
    return this.streamDestination ? this.streamDestination.stream : null;
  }

  /**
   * Approximates 20 logarithmic Mel-filterbank energies, peak-normalized to 0-1.
   * Maps fundamental chest warmth bands (65-260 Hz) into bands 0-2,
   * speech formants & loudspeaker passband (350-1800 Hz) into bands 4-9,
   * and high-frequency sibilants into bands 15-19.
   */
  private approximateMelBands(freqData: Float32Array): Float32Array {
    const numBands = 20;
    const bands = new Float32Array(numBands);
    const sampleRate = this.audioCtx ? this.audioCtx.sampleRate : 44100;
    const nyquist = sampleRate / 2;
    const binHz = nyquist / freqData.length;

    // Mel scale formula: mel = 2595 * log10(1 + f / 700)
    const fMin = 65;
    const fMax = Math.min(8500, nyquist);
    const melMin = 2595 * Math.log10(1 + fMin / 700);
    const melMax = 2595 * Math.log10(1 + fMax / 700);
    const melStep = (melMax - melMin) / numBands;

    for (let i = 0; i < numBands; i++) {
      const melStart = melMin + i * melStep;
      const melEnd = melMin + (i + 1) * melStep;
      const fStart = 700 * (Math.pow(10, melStart / 2595) - 1);
      const fEnd = 700 * (Math.pow(10, melEnd / 2595) - 1);

      const binStart = Math.max(0, Math.floor(fStart / binHz));
      const binEnd = Math.max(binStart + 1, Math.min(freqData.length, Math.ceil(fEnd / binHz)));

      let sum = 0;
      let count = 0;
      for (let j = binStart; j < binEnd; j++) {
        const linear = Math.pow(10, freqData[j] / 20);
        if (!isNaN(linear)) {
          sum += linear;
          count++;
        }
      }
      bands[i] = count > 0 ? sum / count : 0;
    }

    // Peak-normalize to 0-1 range so detection thresholds are scale-invariant.
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
    const silenceThreshold = 0.0015;
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
    let uniformity = 0.35;
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
    if (energySeries.length < 8) return 0.25;
    const maxEnergy = Math.max(...energySeries);
    if (maxEnergy < 0.003) return 0.08; // Silence/ambient

    // Look for genuine pre-onset aspiration breath (quiet energy 0.0025-0.012 preceding speech burst)
    let breathLikeCount = 0;
    for (let i = 2; i < energySeries.length - 1; i++) {
      const prev = energySeries[i - 2];
      const cur = energySeries[i];
      const next = energySeries[i + 1];
      if (prev < 0.002 && cur >= 0.0025 && cur <= 0.012 && next > 0.025) {
        breathLikeCount++;
      }
    }
    return breathLikeCount > 0 ? Math.min(1.0, 0.65 + breathLikeCount * 0.15) : 0.12;
  }

  /**
   * Demo Scenario Feature Generator
   * Injects simulated acoustic physical fingerprints matching the SIH 2026 CFO Clone attack
   */
  public static generateSimulatedFeatures(mode: 'synthetic_attack' | 'authentic_human'): AudioFeatures {
    const now = Date.now();
    if (mode === 'synthetic_attack') {
      // Machine-perfect F0 curve, phone transducer cutoff (<0.20 bassRatio), uniform pauses, zero breathing proxy
      return {
        melSpec: [0.08, 0.09, 0.11, 0.35, 0.82, 0.95, 0.91, 0.88, 0.74, 0.65, 0.55, 0.45, 0.35, 0.25, 0.18, 0.12, 0.08, 0.05, 0.02, 0.01],
        cqt: [0.10, 0.12, 0.35, 0.85, 0.92, 0.89],
        mfcc: [0.45, 0.44, 0.43, 0.42, 0.41, 0.40, 0.39, 0.38, 0.37, 0.36, 0.35, 0.34, 0.33],
        f0: [142.1, 142.2, 142.0, 142.1, 142.3, 142.1, 142.2, 142.1, 142.2, 142.1], // Jitter < 0.2%
        zcr: [0.08, 0.08, 0.08],
        pauses: { count: 3, avgDurationMs: 400, uniformity: 0.94 }, // Machine uniform
        breathingProxy: 0.05, // No natural breath
        acousticMetrics: {
          bassRatio: 0.11,
          speechRms: 0.045,
          hfCutoffRatio: 0.01,
          nsdfPeak: 0.22,
          shimmer: 0.008,
          jitter: 0.004,
          mfccSmoothness: 0.85,
          dynamicRangeDb: 16.0,
          f0Curvature: 0.5
        },
        windowType: 'medium',
        timestamp: now
      };
    } else {
      // Natural human micro-jitter, rich chest fundamental warmth, dynamic spectral flux, natural breathing
      return {
        melSpec: [0.88, 0.92, 0.78, 0.65, 0.54, 0.48, 0.52, 0.41, 0.38, 0.33, 0.29, 0.25, 0.22, 0.19, 0.16, 0.14, 0.12, 0.10, 0.08, 0.06],
        cqt: [0.85, 0.90, 0.75, 0.60, 0.50, 0.45],
        mfcc: [0.38, 0.52, 0.24, 0.61, 0.43, 0.28, 0.55, 0.34, 0.49, 0.29, 0.41, 0.33, 0.47],
        f0: [135.4, 141.2, 128.9, 146.5, 138.1, 131.7, 144.3, 137.9, 142.0, 129.5], // Jitter > 4%
        zcr: [0.12, 0.18, 0.09],
        pauses: { count: 2, avgDurationMs: 620, uniformity: 0.38 },
        breathingProxy: 0.82,
        acousticMetrics: {
          bassRatio: 0.38,
          speechRms: 0.055,
          hfCutoffRatio: 0.12,
          nsdfPeak: 0.72,
          shimmer: 0.058,
          jitter: 0.035,
          mfccSmoothness: 0.42,
          dynamicRangeDb: 30.0,
          f0Curvature: 6.2
        },
        windowType: 'medium',
        timestamp: now
      };
    }
  }
}
