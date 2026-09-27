import logger from '../utils/logger.js';
import { classifyVoiceAcousticML } from './voiceMlClassifier.js';

export interface AudioFeaturesPayload {
  melSpec?: number[];
  cqt?: number[];
  mfcc?: number[];
  f0?: number[];
  zcr?: number[];
  pauses?: {
    count: number;
    avgDurationMs: number;
    uniformity: number; // 0 to 1, higher = machine uniform
  };
  breathingProxy?: number; // 0 to 1, higher = natural breath detected
  acousticMetrics?: {
    bassRatio?: number;
    speechRms?: number;
    hfCutoffRatio?: number;
    nsdfPeak?: number;
    shimmer?: number;
    jitter?: number;
    mfccSmoothness?: number;
    dynamicRangeDb?: number;
    f0Curvature?: number;
  };
  windowType?: 'short' | 'medium' | 'long';
  timestamp?: number;
}

export interface Stage1AuthResult {
  vas: number; // 0-100 (Voice Authenticity Score, higher = synthetic/spoof)
  confidence: 'sufficient' | 'insufficient';
  artifacts: string[];
  model: 'heuristic' | 'aasist' | 'wav2vec2_xlsr';
  processingTimeMs: number;
  isStale?: boolean;
  details?: {
    pitchJitter: number;
    spectralSmoothness: number;
    mfccSmoothness: number;
    pauseUniformity: number;
    breathIndex: number;
  };
}

export const createDefaultStage1Result = (): Stage1AuthResult => ({
  vas: 0,
  confidence: 'insufficient',
  artifacts: [],
  model: 'heuristic',
  processingTimeMs: 0,
  details: {
    pitchJitter: 0,
    spectralSmoothness: 0,
    mfccSmoothness: 0,
    pauseUniformity: 0,
    breathIndex: 0
  }
});

export const DEFAULT_STAGE1_RESULT: Stage1AuthResult = createDefaultStage1Result();


/**
 * Calculates standard deviation of a number array
 */
function stdDev(values: number[]): number {
  if (!values || values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculates relative jitter (cycle-to-cycle variation) for F0 series
 */
function calculateJitter(f0: number[]): number {
  const voiced = f0.filter(v => v > 60 && v < 500);
  if (voiced.length < 4) return 0.05; // Default normal human baseline if unvoiced

  let sumDiff = 0;
  for (let i = 1; i < voiced.length; i++) {
    sumDiff += Math.abs(voiced[i] - voiced[i - 1]);
  }
  const mean = voiced.reduce((sum, v) => sum + v, 0) / voiced.length;
  return mean > 0 ? (sumDiff / (voiced.length - 1)) / mean : 0.05;
}

/**
 * Calculates delta trajectory smoothness of MFCC or spectral coefficients
 */
function calculateDeltaSmoothness(series: number[]): number {
  if (!series || series.length < 4) return 0.5;
  let secondDerivSum = 0;
  for (let i = 1; i < series.length - 1; i++) {
    const d1 = series[i] - series[i - 1];
    const d2 = series[i + 1] - series[i];
    secondDerivSum += Math.abs(d2 - d1);
  }
  // Low second derivative means unnaturally smooth trajectory (typical of vocoders)
  const avgCurvature = secondDerivSum / (series.length - 2);
  // Normalize to 0-1 where 1 is hyper-smooth
  return Math.max(0, Math.min(1, 1 - (avgCurvature * 2)));
}

/**
 * Stage 1: Voice Authenticity Engine
 * Analyzes acoustic feature vectors for physical artifacts of neural vocoders & TTS.
 * Latency budget: strictly under 450ms.
 */
export async function analyzeVoiceAuthenticity(features: AudioFeaturesPayload): Promise<Stage1AuthResult> {
  const startTime = Date.now();

  // 1. Stage 1 Neural ML Classifier Execution (AASIST / Acoustic MLP)
  const mlResult = classifyVoiceAcousticML(features);

  return {
    vas: mlResult.vas,
    confidence: mlResult.confidence,
    artifacts: mlResult.artifacts,
    model: mlResult.model,
    processingTimeMs: Math.max(1, Date.now() - startTime),
    details: {
      pitchJitter: mlResult.metrics.pitchJitter,
      spectralSmoothness: mlResult.metrics.spectralFlatness,
      mfccSmoothness: mlResult.metrics.mfccSmoothness,
      pauseUniformity: mlResult.metrics.pauseUniformity,
      breathIndex: mlResult.metrics.breathIndex
    }
  };
}
