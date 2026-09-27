import { Stage1AuthResult } from './voiceAuthService.js';
import { Stage2IdentityResult } from './identityContextService.js';

export type PolicyRiskState = 'Insufficient Evidence' | 'Low' | 'Suspicious' | 'High' | 'Critical';

export interface PolicyDecision {
  state: PolicyRiskState;
  securityRiskIndex: number; // 0-100 calibrated decision-support index
  explanation: string[];
  recommendedAction: string;
  isConsequential: boolean;
  requiresHold: boolean;
  requiresLivenessChallenge: boolean;
  requiresOOB: boolean;
}

/**
 * Stage 3: Security Policy Fusion Engine
 * F = f(Stage 1 Voice Authenticity, Stage 2 Identity & Context, Liveness, Consequence)
 * Fuses acoustic synthesis evidence with contextual transaction consequence.
 */
export function evaluateSecurityPolicy(
  stage1: Stage1AuthResult,
  stage2: Stage2IdentityResult,
  livenessScore?: number | null
): PolicyDecision {
  const explanations: string[] = [];

  // Check data sufficiency first
  if (stage1.confidence === 'insufficient' && stage1.artifacts.includes('insufficient_audio_signal')) {
    return {
      state: 'Insufficient Evidence',
      securityRiskIndex: 20,
      explanation: ['Acoustic signal too brief or low SNR to establish confident synthesis verdict.'],
      recommendedAction: 'Continue observation; do not authorize high-stakes transactions without verification.',
      isConsequential: stage2.transactionKeywords.length > 0,
      requiresHold: false,
      requiresLivenessChallenge: false,
      requiresOOB: false
    };
  }

  const hasConsequentialKeyword = stage2.transactionKeywords.length > 0;
  if (hasConsequentialKeyword) {
    explanations.push(`Financial/security keywords detected: ${stage2.transactionKeywords.slice(0, 3).join(', ')}`);
  }

  if (stage1.artifacts.length > 0) {
    explanations.push(`Acoustic anomalies: ${stage1.artifacts.join(', ')}`);
  }

  if (stage2.speakerDeviation && stage2.speakerDeviation > 1.8) {
    explanations.push(`Speaker voiceprint deviates ${stage2.speakerDeviation}σ from historical baseline`);
  }

  // ── Multi-Modal Security Risk Index Fusion ──────────────────────────────
  // Stage 1 (Acoustic Authenticity): primary synthetic-voice signal (VAS)
  // Stage 2 (Identity & Context):    behavioural / transcript impersonation context
  // Artifact Evidence Bonus:         up to +20 — each confirmed artifact adds weight
  // Liveness Adjustment:             ±12–15 — active challenge outcome
  let rawIndex = 0;
  if (stage1.confidence === 'insufficient') {
    rawIndex = stage2.impersonationRisk > 0 ? stage2.impersonationRisk : Math.min(30, stage1.vas);
  } else {
    // When acoustic signal is sufficient, VAS directly reflects synthetic threat.
    // Composite risk is anchored to the primary anomaly signal so a high-confidence
    // voice clone (e.g. VAS 70%) is not artificially deflated by an absent transcript.
    const primaryAcoustic = stage1.vas;
    const primaryImpersonation = stage2.impersonationRisk;

    if (primaryAcoustic >= 40 && primaryImpersonation >= 40) {
      // Cross-modal reinforcement: both acoustic deepfake and impersonation detected
      rawIndex = Math.round((primaryAcoustic * 0.5) + (primaryImpersonation * 0.5) + 10);
    } else {
      // Anchored to the dominant threat modality
      rawIndex = Math.max(primaryAcoustic, primaryImpersonation);
    }
  }

  // Artifact evidence amplifier: multiple independently confirmed synthetic
  // fingerprints (f0_too_regular, mfcc_too_smooth, spectral_smoothness, etc.)
  // are strong corroborating evidence even without transcript context.
  if (stage1.confidence === 'sufficient' && stage1.vas >= 45) {
    const confirmedArtifacts = stage1.artifacts.filter(a =>
      a !== 'heavy_cascade_resolved' &&
      a !== 'insufficient_audio_signal' &&
      a !== 'neural_vocoder_signature_verified'
    ).length;
    const artifactBonus = Math.min(15, confirmedArtifacts * 3);
    rawIndex += artifactBonus;
    if (artifactBonus > 0) {
      explanations.push(`${confirmedArtifacts} confirmed synthetic acoustic fingerprint(s) detected — risk amplified.`);
    }
  }

  if (livenessScore !== undefined && livenessScore !== null) {
    // If biological liveness verified, discount suspicion (-12). Never penalize missing/skipped challenges.
    if (livenessScore > 80) {
      rawIndex -= 12;
      explanations.push('Passive vocal dynamics confirmed biological liveness');
    }
  }

  if (stage2.profileStatus === 'deviated') {
    rawIndex += 10;
  }

  const securityRiskIndex = Math.min(100, Math.max(0, Math.round(rawIndex)));

  // Determine 5-State Risk Tier per voice policy
  let state: PolicyRiskState = 'Low';
  let requiresHold = false;
  const requiresLivenessChallenge = false;
  let requiresOOB = false;
  let recommendedAction = 'Standard monitoring active; no immediate friction required.';

  if (stage1.confidence === 'insufficient') {
    state = 'Insufficient Evidence';
    recommendedAction = 'Insufficient audio signal. Use independent verification for any sensitive action.';
  } else if (securityRiskIndex >= 75 || (securityRiskIndex >= 65 && hasConsequentialKeyword)) {
    // Critical: very high index alone OR elevated index combined with financial demand
    state = 'Critical';
    requiresHold = hasConsequentialKeyword;
    requiresOOB = hasConsequentialKeyword;
    recommendedAction = hasConsequentialKeyword
      ? 'CRITICAL ALERT: Synthetic voice characteristics combined with financial demand. Transaction HELD. Independent Trust Channel required.'
      : 'CRITICAL ALERT: High-confidence synthetic voice detected across multiple acoustic channels. Callback verification recommended.';
    explanations.push('Consequence-scaled protection triggered: Action frozen pending out-of-band clearance.');
  } else if (securityRiskIndex >= 55 || stage1.vas >= 70) {
    state = 'High';
    requiresOOB = hasConsequentialKeyword;
    recommendedAction = 'High voice anomaly detected. Independent secondary verification recommended.';

  } else if (securityRiskIndex >= 40 || stage1.vas >= 45 || stage2.impersonationRisk >= 50) {
    state = 'Suspicious';
    recommendedAction = 'Voice irregularity detected. Exercise heightened vigilance.';
  } else {
    state = 'Low';
    recommendedAction = 'Voice parameters consistent with human speech; routine call monitoring.';
  }

  return {
    state,
    securityRiskIndex,
    explanation: explanations,
    recommendedAction,
    isConsequential: hasConsequentialKeyword,
    requiresHold,
    requiresLivenessChallenge,
    requiresOOB
  };
}
