import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import User from '../../src/models/User.js';
import Report from '../../src/models/Report.js';

describe('Reports Routes', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    const user = await User.create({
      name: 'Test',
      email: 'reportuser@example.com',
      password: 'password'
    });
    userId = user._id.toString();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reportuser@example.com', password: 'password' });
    
    token = loginRes.body.token;
  });

  describe('GET /api/reports/:sessionId', () => {
    it('should return report if exists and belongs to user', async () => {
      await Report.create({
        userId,
        sessionId: 'session_report_123',
        callerNumber: '1234567890',
        summary: 'test',
        scamType: 'test',
        redFlags: [],
        psychologicalTactics: [],
        evidenceLog: [],
        recommendedAction: 'test',
        formalComplaintText: 'test',
        peakRiskScore: 50
      });

      const res = await request(app)
        .get('/api/reports/session_report_123')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBe('session_report_123');
    });

    it('should return 404 if report not found', async () => {
      const res = await request(app)
        .get('/api/reports/unknown_session')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Report not found');
    });

    it('should return 401 if unauthorized', async () => {
      const res = await request(app).get('/api/reports/session_report_123');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/reports', () => {
    it('should create a new report', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sessionId: 'session_post_123',
          callerNumber: '1112223333',
          summary: 'post',
          scamType: 'post',
          redFlags: [],
          psychologicalTactics: [],
          evidenceLog: [],
          recommendedAction: 'post',
          formalComplaintText: 'post',
          peakRiskScore: 60
        });

      expect(res.status).toBe(201);
      expect(res.body.sessionId).toBe('session_post_123');
    });

    it('should return 401 if unauthorized', async () => {
      const res = await request(app)
        .post('/api/reports')
        .send({ sessionId: '123' });
      expect(res.status).toBe(401);
    });
  });
});
