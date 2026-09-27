import mongoose from 'mongoose';
import Report, { IReport } from '../models/Report.js';
import CallSession from '../models/CallSession.js';
import CommunityReport from '../models/CommunityReport.js';
import logger from '../utils/logger.js';
import { GeneratedReport } from './groqService.js';

interface SessionData {
  sessionId: string;
  userId: string;
  callerNumber: string;
  peakRiskScore: number;
  finalRiskScore?: number;
  livenessScore?: number | null;
}

export const handleSessionEnd = async (sessionData: SessionData, finalReport: GeneratedReport | null): Promise<IReport | null | undefined> => {
  const { sessionId, userId, callerNumber, peakRiskScore } = sessionData;
  const effectiveCaller = (callerNumber && callerNumber.trim()) ? callerNumber.trim() : 'Unknown Caller';
  const effectiveUserId = (userId && userId.trim()) ? userId.trim() : 'anonymous';

  try {
    if (mongoose.connection.readyState === 1) {
      await CallSession.updateOne(
        { sessionId }, 
        { endTime: new Date(), peakRiskScore }
      );

      const effectiveFinal = sessionData.finalRiskScore !== undefined ? sessionData.finalRiskScore : peakRiskScore;
      const livenessPassed = sessionData.livenessScore !== null && sessionData.livenessScore !== undefined && sessionData.livenessScore >= 70;

      // Clean clearance: if final resolved risk is under 40 or cleared by voice liveness challenge
      if (effectiveFinal < 40 || (livenessPassed && effectiveFinal <= 50)) {
        await CallSession.deleteOne({ sessionId });
        return null;
      }

      if (finalReport) {
        const savedReport = await Report.create({
          userId: effectiveUserId,
          sessionId,
          callerNumber: effectiveCaller,
          summary: finalReport.summary,
          scamType: finalReport.scamType,
          redFlags: finalReport.redFlags,
          psychologicalTactics: finalReport.psychologicalTactics,
          evidenceLog: finalReport.evidenceLog,
          recommendedAction: finalReport.recommendedAction,
          formalComplaintText: finalReport.formalComplaintText,
          peakRiskScore,
          finalRiskScore: effectiveFinal,
          livenessScore: sessionData.livenessScore
        });

        if (peakRiskScore >= 70) {
          const cleanCaller = effectiveCaller.replace(/\D/g, '').slice(-10);
          let commReport = await CommunityReport.findOne({ 
            $or: [
              { callerNumber: effectiveCaller },
              ...(cleanCaller ? [{ callerNumber: cleanCaller }] : [])
            ]
          });
          if (commReport) {
            const newTotalScore = (commReport.averageRiskScore * commReport.reportsCount) + peakRiskScore;
            commReport.reportsCount += 1;
            commReport.averageRiskScore = newTotalScore / commReport.reportsCount;
            commReport.lastReportedAt = new Date();
            await commReport.save();
          } else {
            await CommunityReport.create({
              callerNumber: effectiveCaller,
              reportsCount: 1,
              averageRiskScore: peakRiskScore
            });
          }
        }

        return savedReport;
      }
    } else if (peakRiskScore < 40) {
      return null;
    }
  } catch (error: any) {
    logger.error('Error in handleSessionEnd database operation', { error: error.message });
  }

  // Fallback in-memory report if database is temporarily unavailable
  if (finalReport) {
    return {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: effectiveUserId,
      sessionId,
      callerNumber: effectiveCaller,
      summary: finalReport.summary,
      scamType: finalReport.scamType,
      redFlags: finalReport.redFlags,
      psychologicalTactics: finalReport.psychologicalTactics,
      evidenceLog: finalReport.evidenceLog,
      recommendedAction: finalReport.recommendedAction,
      formalComplaintText: finalReport.formalComplaintText,
      peakRiskScore,
      investigationStatus: 'Needs Review',
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;
  }
  return null;
};
