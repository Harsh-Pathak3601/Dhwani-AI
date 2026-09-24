import { describe, it, expect, beforeEach } from 'vitest';
import { handleSessionEnd } from '../../src/services/reportService.js';
import CallSession from '../../src/models/CallSession.js';
import Report from '../../src/models/Report.js';
import CommunityReport from '../../src/models/CommunityReport.js';
import mongoose from 'mongoose';

describe('Report Service - handleSessionEnd', () => {
  const mockSessionData = {
    sessionId: 'session_123',
    userId: new mongoose.Types.ObjectId().toString(),
    callerNumber: '1234567890',
    peakRiskScore: 50
  };

  const mockFinalReport = {
    summary: 'A scam call',
    scamType: 'Tech Support',
    redFlags: ['Urgency', 'Asking for money'],
    psychologicalTactics: ['Fear'],
    evidenceLog: [],
    recommendedAction: 'Block number',
    formalComplaintText: 'I received a scam call...'
  };

  beforeEach(async () => {
    // create a CallSession so we can test updating/deleting it
    await CallSession.create({
      sessionId: mockSessionData.sessionId,
      userId: mockSessionData.userId,
      callerNumber: mockSessionData.callerNumber,
      startTime: new Date()
    });
  });

  it('should delete session and return null if peakRiskScore < 40', async () => {
    const res = await handleSessionEnd(
      { ...mockSessionData, peakRiskScore: 30 },
      mockFinalReport
    );

    expect(res).toBeNull();
    const session = await CallSession.findOne({ sessionId: mockSessionData.sessionId });
    expect(session).toBeNull();
  });

  it('should update session and create report if peakRiskScore >= 40', async () => {
    const res = await handleSessionEnd(mockSessionData, mockFinalReport);

    expect(res).not.toBeNull();
    expect(res?.sessionId).toBe(mockSessionData.sessionId);
    expect(res?.summary).toBe(mockFinalReport.summary);

    const session = await CallSession.findOne({ sessionId: mockSessionData.sessionId });
    expect(session).not.toBeNull();
    expect(session?.peakRiskScore).toBe(50);
    expect(session?.endTime).toBeDefined();

    const report = await Report.findOne({ sessionId: mockSessionData.sessionId });
    expect(report).not.toBeNull();
    
    // Community report should NOT be created since score < 70
    const commReport = await CommunityReport.findOne({ callerNumber: mockSessionData.callerNumber });
    expect(commReport).toBeNull();
  });

  it('should create community report if peakRiskScore >= 70 and not exists', async () => {
    await handleSessionEnd(
      { ...mockSessionData, peakRiskScore: 80 },
      mockFinalReport
    );

    const commReport = await CommunityReport.findOne({ callerNumber: mockSessionData.callerNumber });
    expect(commReport).not.toBeNull();
    expect(commReport?.reportsCount).toBe(1);
    expect(commReport?.averageRiskScore).toBe(80);
  });

  it('should update community report if peakRiskScore >= 70 and exists', async () => {
    await CommunityReport.create({
      callerNumber: mockSessionData.callerNumber,
      reportsCount: 1,
      averageRiskScore: 60
    });

    await handleSessionEnd(
      { ...mockSessionData, peakRiskScore: 80 },
      mockFinalReport
    );

    const commReport = await CommunityReport.findOne({ callerNumber: mockSessionData.callerNumber });
    expect(commReport).not.toBeNull();
    expect(commReport?.reportsCount).toBe(2);
    // Average: (60 * 1 + 80) / 2 = 70
    expect(commReport?.averageRiskScore).toBe(70);
  });
});
