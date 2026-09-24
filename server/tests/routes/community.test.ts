import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import CommunityReport from '../../src/models/CommunityReport.js';

describe('Community Routes', () => {
  describe('GET /api/community/check/:number', () => {
    it('should return not flagged for an unknown number', async () => {
      const res = await request(app).get('/api/community/check/1234567890');
      
      expect(res.status).toBe(200);
      expect(res.body.flagged).toBe(false);
      expect(res.body.reportsCount).toBe(0);
    });

    it('should return flagged as false if reports < 3 or score <= 60', async () => {
      await CommunityReport.create({
        callerNumber: '1234567890',
        reportsCount: 2,
        averageRiskScore: 80
      });

      const res = await request(app).get('/api/community/check/1234567890');
      
      expect(res.status).toBe(200);
      expect(res.body.flagged).toBe(false);
      expect(res.body.reportsCount).toBe(2);
      expect(res.body.averageRiskScore).toBe(80);
    });

    it('should return flagged as true if reports >= 3 and score > 60', async () => {
      await CommunityReport.create({
        callerNumber: '0987654321',
        reportsCount: 3,
        averageRiskScore: 65
      });

      const res = await request(app).get('/api/community/check/0987654321');
      
      expect(res.status).toBe(200);
      expect(res.body.flagged).toBe(true);
      expect(res.body.reportsCount).toBe(3);
      expect(res.body.averageRiskScore).toBe(65);
    });
  });

  describe('POST /api/community/', () => {
    it('should create a new community report if number does not exist', async () => {
      const res = await request(app)
        .post('/api/community/')
        .send({
          callerNumber: '1112223333',
          riskScore: 75
        });

      expect(res.status).toBe(201);
      expect(res.body.callerNumber).toBe('1112223333');
      expect(res.body.reportsCount).toBe(1);
      expect(res.body.averageRiskScore).toBe(75);

      const dbReport = await CommunityReport.findOne({ callerNumber: '1112223333' });
      expect(dbReport).not.toBeNull();
      expect(dbReport?.reportsCount).toBe(1);
    });

    it('should update an existing community report', async () => {
      await CommunityReport.create({
        callerNumber: '5556667777',
        reportsCount: 1,
        averageRiskScore: 50
      });

      const res = await request(app)
        .post('/api/community/')
        .send({
          callerNumber: '5556667777',
          riskScore: 90
        });

      expect(res.status).toBe(201);
      expect(res.body.reportsCount).toBe(2);
      // Average should be (50*1 + 90) / 2 = 70
      expect(res.body.averageRiskScore).toBe(70);

      const dbReport = await CommunityReport.findOne({ callerNumber: '5556667777' });
      expect(dbReport?.reportsCount).toBe(2);
      expect(dbReport?.averageRiskScore).toBe(70);
    });
  });
});
