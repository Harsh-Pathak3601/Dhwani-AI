import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import User from '../../src/models/User.js';
import CallSession from '../../src/models/CallSession.js';

describe('Sessions Routes', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    const user = await User.create({
      name: 'Test Session User',
      email: 'sessionuser@example.com',
      password: 'password'
    });
    userId = user._id.toString();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sessionuser@example.com', password: 'password' });
    
    token = loginRes.body.token;
  });

  describe('POST /api/sessions', () => {
    it('should create a new call session', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sessionId: 'new_session_123',
          callerNumber: '9998887777'
        });

      expect(res.status).toBe(201);
      expect(res.body.sessionId).toBe('new_session_123');
      expect(res.body.userId).toBe(userId);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post('/api/sessions').send({});
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/sessions/:sessionId', () => {
    it('should return session if exists', async () => {
      await CallSession.create({
        userId,
        sessionId: 'get_session_123',
        callerNumber: '123'
      });

      const res = await request(app)
        .get('/api/sessions/get_session_123')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBe('get_session_123');
    });

    it('should return 404 if session not found', async () => {
      const res = await request(app)
        .get('/api/sessions/unknown_123')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Session not found');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/sessions/get_session_123');
      expect(res.status).toBe(401);
    });
  });
});
