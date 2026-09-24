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
  lastCoachingSent?: string;
}

export const setupCallSocket = (socket: Socket, io: Server) => {
  let rollingTranscript = '';
  let peakRiskScore = 0;
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
    if (!sessionData) return;

    try {
      // 1. Stage 1: Voice Authenticity Analysis (~0-50ms)
      const stage1 = await analyzeVoiceAuthenticity(features);
      latestStage1 = stage1;
      socket.emit('voice:stage1', stage1);

      // 2. Stage 2: Identity & Context Analysis
      const stage2 = await analyzeIdentityAndContext(
        sessionData.callerNumber,
        rollingTranscript,
        stage1.vas,
        stage1.artifacts,
        features.mfcc
      );
      latestStage2 = stage2;
      socket.emit('voice:stage2', stage2);

      // 3. Stage 3: Security Policy Fusion & 5-State Risk Model
      const policy: PolicyDecision = evaluateSecurityPolicy(stage1, stage2, activeLivenessScore);

      // Update Peak Risk Score
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

      // Handle Consequence Escalation: Transaction Hold & Independent Trust Channel
      if (policy.requiresHold && !hasTriggeredHold) {
        hasTriggeredHold = true;
        const oob = triggerOOBVerification(
          sessionData.sessionId,
          sessionData.callerNumber,
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

      // Handle Liveness Challenge trigger if state is Suspicious or High, no challenge active, and cooldown passed
      if (policy.requiresLivenessChallenge && !activeChallengeId && Date.now() > challengeCooldownUntil) {
        const challenge = generateLivenessChallenge();
        activeChallengeId = challenge.challengeId;
        challengeCooldownUntil = Date.now() + 45000;
        socket.emit('liveness:challenge', challenge);
      }

      // Record Tamper-Evident Ledger Entry
      const evidence = recordEvidence(
        sessionData.sessionId,
        maskPhoneNumber(sessionData.callerNumber),
        { vas: stage1.vas, artifacts: stage1.artifacts, model: stage1.model },
        { speakerDeviation: stage2.speakerDeviation, impersonationRisk: stage2.impersonationRisk, transactionKeywords: stage2.transactionKeywords },
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
        isScoring = true;

        turnStartTime = 0;
        lastScoredTranscript = rollingTranscript;

        try {
          const { risk, signal, phase, coaching } = await scoreRisk(rollingTranscript, sessionData!.lastCoachingSent || '');

          if (!sessionData) return;

          if (risk > peakRiskScore) {
            peakRiskScore = risk;
          }

          if (coaching) {
            sessionData.lastCoachingSent = coaching;
          }

          socket.emit('risk:update', { risk, signal, phase, coaching, peakRiskScore });
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
  socket.on('session:end', async () => {
    logger.info('Session ended');

    const activeSessionData = sessionData;
    cleanup();

    if (!activeSessionData) return;
    activeSessionData.peakRiskScore = peakRiskScore;

    try {
      if (peakRiskScore < 40) {
        await handleSessionEnd(activeSessionData, null);
        
        const cleanReport = {
          _id: new mongoose.Types.ObjectId().toString(),
          sessionId: activeSessionData.sessionId,
          userId: activeSessionData.userId,
          callerNumber: activeSessionData.callerNumber,
          summary: rollingTranscript.trim() 
            ? `Call completed with zero fraudulent indicators or acoustic anomalies detected. Monitored ${rollingTranscript.split(/\s+/).filter(Boolean).length} conversational words.`
            : 'Routine call completed safely. No scam patterns or synthetic voice signatures detected during this session.',
          scamType: 'Clean / Verified Safe Call',
          redFlags: [],
          psychologicalTactics: [],
          evidenceLog: [
            { time: '00:00', event: 'Parallel acoustic monitoring tap engaged' },
            { time: 'Session Complete', event: 'Zero synthetic voice anomalies or fraudulent behavioral patterns detected' }
          ],
          recommendedAction: 'No action required. Call parameters were verified as legitimate.',
          formalComplaintText: 'No complaint necessary. This call was evaluated as authentic with normal acoustic prosody.',
          peakRiskScore: peakRiskScore,
          investigationStatus: 'Verified',
          createdAt: new Date()
        };

        socket.emit('session:safe');
        socket.emit('report:ready', {
          requiresConfirmation: false,
          report: cleanReport
        });
      } else {
        const scrubbedTranscript = await scrubPII(rollingTranscript);
        const reportContent = await generateReport(
          scrubbedTranscript,
          peakRiskScore,
          activeSessionData.callerNumber,
          "Unknown"
        );

        const resolvedReport: GeneratedReport = reportContent || {
          summary: `Call exhibited elevated risk patterns with peak score ${peakRiskScore}/100. Parallel acoustic and heuristic analysis triggered security attention.`,
          scamType: peakRiskScore >= 70 ? 'High-Risk Impersonation / Social Engineering' : 'Suspicious Caller Activity',
          redFlags: ['Unusual caller behavioral patterns', 'Acoustic anomalies detected during conversation'],
          psychologicalTactics: ['Urgency / Social Pressure'],
          evidenceLog: [
            { time: '00:00', event: 'Parallel acoustic monitoring tap engaged' },
            { time: 'Alert', event: `Elevated risk threshold reached with score ${peakRiskScore}/100` }
          ],
          recommendedAction: 'Verify caller identity through an official external channel. Do not transfer funds or share OTPs.',
          formalComplaintText: `A suspicious call was received from ${activeSessionData.callerNumber || 'Unknown'} that triggered an elevated risk score of ${peakRiskScore}/100. Further investigation is recommended.`
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
          peakRiskScore: peakRiskScore,
          investigationStatus: 'Needs Review',
          createdAt: new Date()
        };

        socket.emit('report:ready', {
          requiresConfirmation: peakRiskScore < 70,
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
    sessionData = null;
    isScoring = false;
    hasTriggeredHold = false;
    activeChallengeId = null;
    challengeCooldownUntil = 0;
  }
};
