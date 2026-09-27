import { describe, it, expect } from 'vitest';
import { analyzeVoiceAuthenticity } from '../../src/services/voiceAuthService.js';
import { cosineSimilarity, hashPhoneNumber, maskPhoneNumber, analyzeIdentityAndContext } from '../../src/services/identityContextService.js';
import { evaluateSecurityPolicy } from '../../src/services/policyEngine.js';
import { generateLivenessChallenge, evaluateLivenessResponse } from '../../src/services/livenessService.js';
import { triggerOOBVerification, resolveOOBVerification } from '../../src/services/trustChannelService.js';
import { recordEvidence, verifyRecordIntegrity } from '../../src/services/evidenceService.js';

describe('VoiceShield Core Architecture Tests', () => {

  describe('Module 2: Stage 1 Voice Authenticity Engine', () => {
    it('detects synthetic physical acoustic fingerprints with high VAS and artifacts', async () => {
      const syntheticFeatures = {
        melSpec: [0.82, 0.81, 0.79, 0.78, 0.75, 0.74, 0.72, 0.70, 0.68, 0.65],
        cqt: [0.80, 0.79, 0.78, 0.77],
        mfcc: [0.45, 0.44, 0.43, 0.42, 0.41, 0.40, 0.39, 0.38, 0.37, 0.36, 0.35, 0.34, 0.33],
        f0: [142.1, 142.1, 142.0, 142.1, 142.1, 142.1, 142.1, 142.2, 142.1, 142.1], // Machine-flat F0
        zcr: [0.08],
        pauses: { count: 3, avgDurationMs: 400, uniformity: 0.95 },
        breathingProxy: 0.05,
        timestamp: Date.now()
      };

      const result = await analyzeVoiceAuthenticity(syntheticFeatures);

      expect(result.vas).toBeGreaterThanOrEqual(65);
      expect(result.confidence).toBe('sufficient');
      expect(result.artifacts).toContain('f0_too_regular');
      expect(result.artifacts).toContain('no_breathing_proxy');
    });

    it('validates authentic human voice characteristics with low VAS', async () => {
      const authenticFeatures = {
        melSpec: [0.45, 0.62, 0.38, 0.71, 0.54, 0.29, 0.66, 0.41, 0.58, 0.33],
        cqt: [0.50, 0.65, 0.42],
        mfcc: [0.38, 0.52, 0.24, 0.61, 0.43, 0.28, 0.55, 0.34, 0.49, 0.29, 0.41, 0.33, 0.47],
        f0: [135.4, 141.2, 128.9, 146.5, 138.1, 131.7, 144.3, 137.9, 142.0, 129.5], // Natural micro-jitter
        zcr: [0.12],
        pauses: { count: 2, avgDurationMs: 620, uniformity: 0.35 },
        breathingProxy: 0.85,
        acousticMetrics: {
          bassRatio: 0.38,
          speechRms: 0.05,
          hfCutoffRatio: 0.12,
          nsdfPeak: 0.72,
          shimmer: 0.058,
          jitter: 0.035,
          mfccSmoothness: 0.40,
          dynamicRangeDb: 32
        },
        timestamp: Date.now()
      };

      const result = await analyzeVoiceAuthenticity(authenticFeatures);

      expect(result.vas).toBeLessThan(45);
      expect(result.confidence).toBe('sufficient');
    });

    it('detects commercial expressive AI voice clones (ElevenLabs/CivixShield) with 24kHz shelf & low shimmer', async () => {
      const expressiveAiFeatures = {
        melSpec: [0.15, 0.22, 0.45, 0.88, 0.95, 0.92, 0.85, 0.72, 0.55, 0.40],
        f0: [145.2, 152.4, 138.6, 160.1, 155.0, 142.3, 158.7, 148.9, 152.0], // Expressive pitch variation
        zcr: [0.08],
        pauses: { count: 2, avgDurationMs: 450, uniformity: 0.80 },
        breathingProxy: 0.12,
        acousticMetrics: {
          bassRatio: 0.28,
          speechRms: 0.045,
          hfCutoffRatio: 0.018, // 24kHz vocoder brickwall shelf
          nsdfPeak: 0.58,
          shimmer: 0.012,       // Unnaturally low vocoder glottal shimmer
          jitter: 0.008,
          mfccSmoothness: 0.82, // Smooth neural spline trajectory
          dynamicRangeDb: 16.0  // Studio compressed
        },
        timestamp: Date.now()
      };

      const result = await analyzeVoiceAuthenticity(expressiveAiFeatures);

      expect(result.vas).toBeGreaterThanOrEqual(70);
      expect(result.confidence).toBe('sufficient');
      expect(result.artifacts).toContain('hf_vocoder_phase_shelf');
      expect(result.artifacts).toContain('low_glottal_shimmer_vocoder');
    });

    it('detects manipulated and voice-conversion audio with high synthetic score', async () => {
      const manipulatedFeatures = {
        melSpec: [0.08, 0.12, 0.35, 0.78, 0.85, 0.70, 0.55, 0.40, 0.30, 0.20],
        f0: [130.0, 130.1, 130.0, 130.2, 130.0, 130.1],
        zcr: [0.09],
        pauses: { count: 1, avgDurationMs: 300, uniformity: 0.88 },
        breathingProxy: 0.08,
        acousticMetrics: {
          bassRatio: 0.12,
          speechRms: 0.035,
          hfCutoffRatio: 0.015,
          nsdfPeak: 0.25,
          shimmer: 0.009,
          jitter: 0.005,
          mfccSmoothness: 0.86,
          dynamicRangeDb: 14.0
        },
        timestamp: Date.now()
      };

      const result = await analyzeVoiceAuthenticity(manipulatedFeatures);

      expect(result.vas).toBeGreaterThanOrEqual(75);
      expect(result.confidence).toBe('sufficient');
    });
  });

  describe('Module 3: Stage 2 Identity and Context Engine', () => {
    it('computes cosine similarity accurately between identical and orthogonal vectors', () => {
      const v1 = [1, 2, 3];
      const v2 = [1, 2, 3];
      const v3 = [-1, -2, -3];

      expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0, 4);
      expect(cosineSimilarity(v1, v3)).toBeCloseTo(-1.0, 4);
    });

    it('hashes and masks phone numbers per DPDP Act standards', () => {
      const phone = '+919876543210';
      const hash = hashPhoneNumber(phone);
      const masked = maskPhoneNumber(phone);

      expect(hash).toHaveLength(64); // SHA-256 hex string
      expect(masked).toBe('+91 ****** 3210');
    });
  });

  describe('Module 4: Stage 3 Security Policy Fusion', () => {
    it('escalates to Critical tier and enforces Transaction Hold when high VAS meets consequential transfer', () => {
      const stage1 = {
        vas: 78,
        confidence: 'sufficient' as const,
        artifacts: ['f0_too_regular', 'spectral_smoothness'],
        model: 'aasist' as const,
        processingTimeMs: 45,
        details: { pitchJitter: 0.01, spectralSmoothness: 0.85, mfccSmoothness: 0.8, pauseUniformity: 0.9, breathIndex: 0.05 }
      };

      const stage2 = {
        speakerDeviation: 2.8,
        profileStatus: 'deviated' as const,
        similarity: 0.65,
        impersonationRisk: 82,
        urgencyFlag: true,
        transactionKeywords: ['transfer', 'lakh', 'urgent'],
        historicalFlags: 0,
        signal: 'CFO Impersonation detected',
        recommendedVerification: 'Out-Of-Band Push'
      };

      const policy = evaluateSecurityPolicy(stage1, stage2);

      expect(policy.state).toBe('Critical');
      expect(policy.requiresHold).toBe(true);
      expect(policy.requiresOOB).toBe(true);
      expect(policy.securityRiskIndex).toBeGreaterThanOrEqual(75);
    });
  });

  describe('Module 5: Active Liveness Challenge', () => {
    it('generates randomized verbal challenge prompts across semantic/phonetic axes', () => {
      const challenge = generateLivenessChallenge();

      expect(challenge.challengeId).toBeDefined();
      expect(challenge.prompt.length).toBeGreaterThan(10);
      expect(challenge.expectedToken).toBeDefined();
    });

    it('enforces accessibility safeguard on degraded or delayed audio without penalty', () => {
      const challenge = generateLivenessChallenge();
      const evalResult = evaluateLivenessResponse(challenge.challengeId, 'hesitation...', 15000, 'noisy');

      expect(evalResult.accessibilitySafeguardApplied).toBe(true);
      expect(evalResult.score).toBe(50); // Neutral, routes to secondary channel
    });
  });

  describe('Module 6: Independent Trust Channel (OOB Prevention)', () => {
    it('manages transaction hold lifecycle and fraud prevention denial', () => {
      const oob = triggerOOBVerification('test-session', '+919876543210', 'CFO emergency transfer hold', '₹50,00,000');

      expect(oob.status).toBe('pending');
      expect(oob.transactionRef).toMatch(/^TXN-/);

      const resolved = resolveOOBVerification(oob.oobId, 'denied', 'Account Holder');
      expect(resolved?.status).toBe('denied');
    });
  });

  describe('Module 10: Blockchain Tamper-Evident Evidence Integrity', () => {
    it('creates cryptographic SHA-256 Merkle chain and verifies audit integrity', () => {
      const record = recordEvidence(
        'session-101',
        '+91 ****** 3210',
        { vas: 74, artifacts: ['f0_too_regular'], model: 'aasist' },
        { speakerDeviation: 2.8, impersonationRisk: 81, transactionKeywords: ['transfer', 'lakh'] },
        'Critical',
        88,
        'Transaction HELD by policy'
      );

      expect(record.evidenceHash).toHaveLength(64);
      expect(record.ledgerAnchorBlock).toBeGreaterThan(100000);

      const verification = verifyRecordIntegrity(record.recordId);
      expect(verification.valid).toBe(true);
      expect(verification.record?.evidenceHash).toBe(record.evidenceHash);
    });
  });

});
