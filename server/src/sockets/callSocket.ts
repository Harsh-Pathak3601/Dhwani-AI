import { Socket, Server } from 'socket.io';
import mongoose from 'mongoose';
import { scoreRisk, generateReport, scrubPII, GeneratedReport } from '../services/groqService.js';
import { handleSessionEnd } from '../services/reportService.js';
import { analyzeVoiceAuthenticity, AudioFeaturesPayload, Stage1AuthResult, createDefaultStage1Result } from '../services/voiceAuthService.js';
import { analyzeIdentityAndContext, Stage2IdentityResult, maskPhoneNumber } from '../services/identityContextService.js';
import { evaluateSecurityPolicy, PolicyDecision } from '../services/policyEngine.js';
import { generateLivenessChallenge, evaluateLivenessResponse } from '../services/livenessService.js';
import { triggerOOBVerification, resolveOOBVerification, getActiveHold } from '../services/trustChannelService.js';
import { recordEvidence } from '../services/evidenceService.js';
import logger from '../utils/logger.js';

interface SessionData {
  callerNumber: string;
  sessionId: string;
  userId: string;
  peakRiskScore: number;
  finalRiskScore?: number;
  livenessScore?: number | null;
  lastCoachingSent?: string;
}

export const setupCallSocket = (socket: Socket, io: Server) => {
  let rollingTranscript = '';
  let peakRiskScore = 0;
  let latestRiskIndex = 0;
  let sessionData: SessionData | null = null;
  let turnStartTime = 0;
  let isScoring = false;

  let lastScoredTranscript = '';
  let lastReceivedTranscript = '';
  let turnTimer: NodeJS.Timeout | null = null;

  // VoiceShield 3-Stage State
  let latestStage1: Stage1AuthResult = createDefaultStage1Result();
  let latestStage2: Stage2IdentityResult = {
    speakerDeviation: null,
    profileStatus: 'no_profile',
    similarity: null,
    impersonationRisk: 0,
    urgencyFlag: false,
    transactionKeywords: [],
    historicalFlags: 0,
    signal: 'Awaiting sufficient audio/context',
    recommendedVerification: 'Monitoring'
  };
  let activeLivenessScore: number | null = null;
  let activeChallengeId: string | null = null;
  let challengeCooldownUntil = 0;
  let hasTriggeredHold = false;

  socket.on('session:start', ({ callerNumber, sessionId, userId }) => {
    logger.info(`Session started: ${sessionId}`);
    cleanup();

    const normalizedCaller = (typeof callerNumber === 'string' && callerNumber.trim()) 
      ? callerNumber.trim() 
      : 'Unknown Caller';
    const normalizedUserId = (typeof userId === 'string' && userId.trim())
      ? userId.trim()
      : 'anonymous';

    sessionData = { 
      callerNumber: normalizedCaller, 
      sessionId: sessionId || crypto.randomUUID(), 
      userId: normalizedUserId, 
      peakRiskScore: 0 
    };
    rollingTranscript = '';
    lastScoredTranscript = '';
    lastReceivedTranscript = '';
    peakRiskScore = 0;
    latestRiskIndex = 0;
    turnStartTime = 0;
    isScoring = false;
    activeLivenessScore = null;
    activeChallengeId = null;
    hasTriggeredHold = false;
    latestStage1 = createDefaultStage1Result();
    latestStage2 = {
      speakerDeviation: null,
      profileStatus: 'no_profile',
      similarity: null,
      impersonationRisk: 0,
      urgencyFlag: false,
      transactionKeywords: [],
      historicalFlags: 0,
      signal: 'Awaiting sufficient audio/context',
      recommendedVerification: 'Monitoring'
    };

    if (turnTimer) {
      clearTimeout(turnTimer);
      turnTimer = null;
    }
  });

  /**
   * ─── VOICE INTELLIGENCE: REAL-TIME DSP FEATURE HANDLER ───
   * Receives extracted acoustic feature vectors from browser Web Audio API parallel tap
   */
  socket.on('audio:features', async (features: AudioFeaturesPayload) => {
    if (!sessionData) {
      sessionData = {
        callerNumber: 'Live Audio Stream',
        sessionId: crypto.randomUUID(),
        userId: 'anonymous',
        peakRiskScore: 0
      };
    }
    const currentSession = sessionData;

    try {
      // 1. Stage 1: Ultra-Fast Voice Authenticity ML (<0.1ms)
      const stage1 = await analyzeVoiceAuthenticity(features);
      if (!sessionData) return;
      latestStage1 = stage1;
      socket.emit('voice:stage1', stage1);

      // 2. Stage 3: Immediate Security Policy Fusion & 5-State Risk Model (<0.1ms)
      // Fused immediately with latestStage2 so risk:state is emitted INSTANTLY without network/DB delay!
      const policy: PolicyDecision = evaluateSecurityPolicy(stage1, latestStage2, activeLivenessScore);

      logger.info(`[Voice Telemetry] Stage1 VAS: ${stage1.vas}%, Conf: ${stage1.confidence}, Artifacts: [${stage1.artifacts.join(', ')}], Policy State: ${policy.state}, SRI: ${policy.securityRiskIndex}`);

      // Update Current and Peak Risk Score
      latestRiskIndex = policy.securityRiskIndex;
      if (policy.securityRiskIndex > peakRiskScore) {
        peakRiskScore = policy.securityRiskIndex;
      }

      socket.emit('risk:state', {
        state: policy.state,
        index: policy.securityRiskIndex,
        explanation: policy.explanation,
        recommendedAction: policy.recommendedAction,
        isConsequential: policy.isConsequential,
        requiresHold: policy.requiresHold
      });

      // 3. Stage 2: Identity & Context Analysis (Runs asynchronously / non-blocking in background)
      analyzeIdentityAndContext(
        currentSession.callerNumber,
        rollingTranscript,
        stage1.vas,
        stage1.artifacts,
        features.mfcc
      ).then(stage2 => {
        if (!sessionData) return;
        latestStage2 = stage2;
        socket.emit('voice:stage2', stage2);
      }).catch(err => {
        logger.warn('Stage 2 context analysis background error', { error: err.message });
      });

      // Handle Consequence Escalation: Transaction Hold & Independent Trust Channel
      if (policy.requiresHold && !hasTriggeredHold) {
        hasTriggeredHold = true;
        const oob = triggerOOBVerification(
          currentSession.sessionId,
          currentSession.callerNumber,
          policy.recommendedAction,
          '₹50,00,000'
        );

        socket.emit('action:hold', {
          transactionRef: oob.transactionRef,
          reason: 'Emergency ₹50 Lakh Transfer Requested on Suspicious Synthetic Voice',
          heldAmount: oob.amountFormatted,
          oobId: oob.oobId,
          targetDevice: oob.targetDevice,
          timestamp: oob.initiatedAt
        });

        socket.emit('oob:triggered', {
          method: oob.method,
          targetDevice: oob.targetDevice,
          oobId: oob.oobId
        });
      }

      // Liveness challenge modal disabled to prevent intrusive false positives
      // Liveness is evaluated 100% passively via vocal fold dynamics and respiration acoustic metrics

      // Record Tamper-Evident Ledger Entry
      const evidence = recordEvidence(
        currentSession.sessionId,
        maskPhoneNumber(currentSession.callerNumber),
        { vas: stage1.vas, artifacts: stage1.artifacts, model: stage1.model },
        { speakerDeviation: latestStage2.speakerDeviation, impersonationRisk: latestStage2.impersonationRisk, transactionKeywords: latestStage2.transactionKeywords },
        policy.state,
        policy.securityRiskIndex,
        policy.recommendedAction
      );

      socket.emit('evidence:anchored', {
        recordId: evidence.recordId,
        evidenceHash: evidence.evidenceHash,
        ledgerAnchorBlock: evidence.ledgerAnchorBlock
      });

    } catch (err: any) {
      logger.error('Error in audio:features pipeline', { error: err.message });
    }
  });

  /**
   * ─── ACTIVE LIVENESS VERIFICATION HANDLER ───
   */
  socket.on('liveness:respond', ({ challengeId, spokenText, latencyMs }) => {
    if (!sessionData) return;

    const evaluation = evaluateLivenessResponse(challengeId, spokenText || '', latencyMs || 1800);
    activeLivenessScore = evaluation.score;
    activeChallengeId = null;

    socket.emit('liveness:result', evaluation);

    // Re-evaluate Stage 3 with updated liveness evidence
    const updatedPolicy = evaluateSecurityPolicy(latestStage1, latestStage2, activeLivenessScore);
    latestRiskIndex = updatedPolicy.securityRiskIndex;
    socket.emit('risk:state', {
      state: updatedPolicy.state,
      index: updatedPolicy.securityRiskIndex,
      explanation: updatedPolicy.explanation,
      recommendedAction: updatedPolicy.recommendedAction,
      isConsequential: updatedPolicy.isConsequential,
      requiresHold: updatedPolicy.requiresHold
    });
  });

  /**
   * ─── OUT-OF-BAND (INDEPENDENT TRUST CHANNEL) RESOLUTION ───
   */
  socket.on('oob:resolve', ({ oobId, decision, reviewer }) => {
    const resolved = resolveOOBVerification(oobId, decision, reviewer || 'Account Holder');
    if (resolved) {
      socket.emit('oob:status', resolved);

      if (decision === 'denied') {
        socket.emit('action:hold', {
          transactionRef: resolved.transactionRef,
          status: 'prevented',
          reason: 'FRAUD PREVENTED: Transaction denied by authorized account holder via Independent Trust Channel.',
          heldAmount: resolved.amountFormatted,
          timestamp: new Date()
        });
      } else {
        socket.emit('action:hold', {
          transactionRef: resolved.transactionRef,
          status: 'cleared',
          reason: 'Transaction verified and approved via secondary trust device.',
          heldAmount: resolved.amountFormatted,
          timestamp: new Date()
        });
      }
    }
  });

  /**
   * ─── TRANSCRIPT UPDATE & BEHAVIORAL SCAM SCORING ───
   */
  socket.on('transcript:update', async (newTranscript: string) => {
    if (!sessionData) return;

    if (newTranscript.trim() === lastReceivedTranscript.trim()) {
      return;
    }

    lastReceivedTranscript = newTranscript;
    rollingTranscript = newTranscript;

    if (turnTimer) {
      clearTimeout(turnTimer);
    }

    const isTranscriptChanged = rollingTranscript.trim() !== lastScoredTranscript.trim();

    if (rollingTranscript.trim().length > 10 && isTranscriptChanged) {
      const now = Date.now();
      if (turnStartTime === 0) {
        turnStartTime = now;
      }

      const triggerScore = async () => {
        if (isScoring) return;
        if (!sessionData) return;
        isScoring = true;

        turnStartTime = 0;
        lastScoredTranscript = rollingTranscript;

        try {
          const { risk, signal, phase, coaching } = await scoreRisk(rollingTranscript, sessionData?.lastCoachingSent || '');

          if (!sessionData) return;

          const currentAcousticRisk = latestStage1?.vas || 0;
          // Acoustic risk only overrides conversational risk if genuinely anomalous (>= 60%)
          const effectiveRisk = currentAcousticRisk >= 60 ? Math.max(risk, currentAcousticRisk) : risk;
          latestRiskIndex = effectiveRisk;

          if (effectiveRisk > peakRiskScore) {
            peakRiskScore = effectiveRisk;
          }

          if (coaching) {
            sessionData.lastCoachingSent = coaching;
          }

          socket.emit('risk:update', { 
            risk: effectiveRisk, 
            signal: signal || (currentAcousticRisk >= 60 ? `Synthetic Voice Anomaly (${currentAcousticRisk}% VAS)` : ''), 
            phase, 
            coaching, 
            peakRiskScore 
          });
        } catch (e: any) {
          logger.error('Error scoring risk', { error: e.message });
        } finally {
          isScoring = false;
        }
      };

      const newText = rollingTranscript.substring(lastScoredTranscript.length).toLowerCase();
      const criticalKeywords = ['arrest', 'police', 'money', 'rupees', 'account', 'otp', 'password', 'transfer', 'security', 'cbi', 'customs', 'illegal', 'warrant', 'lakh'];
      const hasCriticalKeyword = criticalKeywords.some(kw => newText.includes(kw));

      if (turnStartTime > 0 && (now - turnStartTime > 1500) && !isScoring) {
        triggerScore();
      } else if (hasCriticalKeyword && !isScoring) {
        turnTimer = setTimeout(triggerScore, 800);
      } else {
        turnTimer = setTimeout(triggerScore, 1500);
      }
    }
  });

  /**
   * ─── SESSION FINALIZATION ───
   */
  socket.on('session:end', async (payload?: { peakRiskScore?: number }) => {
    logger.info('Session ended', { payload });

    const activeSessionData = sessionData;
    cleanup();

    if (!activeSessionData) return;
    const livenessPassed = activeLivenessScore !== null && activeLivenessScore >= 70;

    // Deepfake Forensics Latching Rule:
    // Spliced or manipulated audio often concludes with natural speech or humanized outro audio.
    // In audio/video forensics, if synthetic voice manipulation was detected anywhere in the session,
    // the evidence is latched to the maximum detected threat.
    const maxPeak = Math.max(
      peakRiskScore,
      payload?.peakRiskScore || 0,
      activeSessionData.peakRiskScore || 0
    );

    // If liveness passed AND no critical synthetic anomaly was ever detected (maxPeak < 50),
    // then it can resolve down to safe.
    // BUT if synthetic voice was detected (maxPeak >= 40), it MUST NOT be cleared as safe.
    const finalRiskScore = (livenessPassed && maxPeak < 50)
      ? Math.min(latestRiskIndex, 30)
      : Math.max(latestRiskIndex, maxPeak);

    // Recording is ONLY cleared if NO synthetic anomalies or scam patterns were detected throughout
    const isCleared = (maxPeak < 40) && (finalRiskScore < 40);

    activeSessionData.peakRiskScore = maxPeak;
    activeSessionData.finalRiskScore = finalRiskScore;
    activeSessionData.livenessScore = activeLivenessScore;

    try {
      if (isCleared) {
        await handleSessionEnd(activeSessionData, null);
        
        const cleanReport = {
          _id: new mongoose.Types.ObjectId().toString(),
          sessionId: activeSessionData.sessionId,
          userId: activeSessionData.userId,
          callerNumber: activeSessionData.callerNumber,
          summary: livenessPassed
            ? `Call verified authentic. Active voice liveness challenge was successfully completed (score: ${activeLivenessScore}/100), verifying natural human vocal fold dynamics and clearing unverified threat alerts. Final risk resolved to ${finalRiskScore}/100 (Safe).`
            : rollingTranscript.trim() 
              ? `Call completed with zero fraudulent indicators or acoustic anomalies detected. Monitored ${rollingTranscript.split(/\s+/).filter(Boolean).length} conversational words. Final risk: ${finalRiskScore}/100.`
              : 'Routine call completed safely. No scam patterns or synthetic voice signatures detected during this session.',
          scamType: livenessPassed ? 'Clean / Verified Safe Call (Liveness Passed)' : 'Clean / Verified Safe Call',
          redFlags: [],
          psychologicalTactics: [],
          evidenceLog: [
            { time: '00:00', event: 'Parallel acoustic monitoring tap engaged' },
            ...(maxPeak >= 60 ? [{ time: 'Peak Alert', event: `Unverified pre-challenge risk peaked at ${maxPeak}/100` }] : []),
            ...(livenessPassed ? [{ time: 'Voice Test', event: `Active liveness challenge completed with human prosody (${activeLivenessScore}/100)` }] : []),
            { time: 'Session Complete', event: `Voice authenticity verified. Final risk resolved to ${finalRiskScore}/100 (Safe)` }
          ],
          recommendedAction: 'No action required. Call parameters were verified as legitimate.',
          formalComplaintText: 'No complaint necessary. This call was evaluated as authentic with normal acoustic prosody.',
          peakRiskScore: maxPeak,
          finalRiskScore: finalRiskScore,
          livenessScore: activeLivenessScore,
          investigationStatus: 'Verified',
          createdAt: new Date()
        };

        socket.emit('report:ready', {
          requiresConfirmation: false,
          report: cleanReport
        });
        socket.emit('session:safe');
      } else {
        const scrubbedTranscript = await scrubPII(rollingTranscript);
        const reportContent = await generateReport(
          scrubbedTranscript,
          maxPeak,
          activeSessionData.callerNumber,
          "Unknown",
          finalRiskScore,
          activeLivenessScore
        );

        const resolvedReport: GeneratedReport = reportContent || {
          summary: `Audio/Video recording contained AI-generated or manipulated voice segments peaking at ${maxPeak}/100 risk. Synthetic speech artifacts or vocoder anomalies were detected during playback.`,
          scamType: maxPeak >= 70 ? 'AI Voice Cloning / Manipulated Voice' : 'Suspicious Caller Activity / Synthetic Anomaly',
          redFlags: [
            `Synthetic voice anomaly detected during playback (Peak Risk: ${maxPeak}/100)`,
            'Discontinuity between synthetic speech segments and natural human audio',
            ...(latestStage1.artifacts?.length ? latestStage1.artifacts.map(a => `Acoustic anomaly: ${a}`) : ['Acoustic spectral anomalies'])
          ],
          psychologicalTactics: ['Voice Manipulation / Impersonation'],
          evidenceLog: [
            { time: '00:00', event: 'Parallel acoustic monitoring tap engaged' },
            { time: 'Playback Alert', event: `Synthetic voice anomalies detected: Peak Risk ${maxPeak}/100` },
            ...(activeLivenessScore ? [{ time: 'Voice Test', event: `Active liveness score: ${activeLivenessScore}/100` }] : []),
            { time: 'Session Complete', event: `Session concluded. Latched forensic risk: ${finalRiskScore}/100 (Synthetic Voice Detected).` }
          ],
          recommendedAction: 'Treat audio as synthetic/manipulated. Do not act on instructions from this voice without separate out-of-band verification.',
          formalComplaintText: `AI-generated or manipulated voice was detected during analysis of caller/media (${activeSessionData.callerNumber || 'Unknown'}). Peak forensic risk reached ${maxPeak}/100.`
        };

        const savedReport = await handleSessionEnd(activeSessionData, resolvedReport);

        const effectiveReport = savedReport || {
          _id: new mongoose.Types.ObjectId().toString(),
          sessionId: activeSessionData.sessionId,
          userId: activeSessionData.userId,
          callerNumber: activeSessionData.callerNumber,
          summary: resolvedReport.summary,
          scamType: resolvedReport.scamType,
          redFlags: resolvedReport.redFlags,
          psychologicalTactics: resolvedReport.psychologicalTactics,
          evidenceLog: resolvedReport.evidenceLog,
          recommendedAction: resolvedReport.recommendedAction,
          formalComplaintText: resolvedReport.formalComplaintText,
          peakRiskScore: maxPeak,
          finalRiskScore: finalRiskScore,
          livenessScore: activeLivenessScore,
          investigationStatus: 'Needs Review',
          createdAt: new Date()
        };

        socket.emit('report:ready', {
          requiresConfirmation: maxPeak < 70,
          report: effectiveReport
        });
      }
    } catch (e: any) {
      logger.error('Error during session:end processing', { error: e.message });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
    cleanup();
  });

  function cleanup() {
    if (turnTimer) {
      clearTimeout(turnTimer);
      turnTimer = null;
    }
    sessionData = null;
    isScoring = false;
    hasTriggeredHold = false;
    activeChallengeId = null;
    challengeCooldownUntil = 0;
  }
};
