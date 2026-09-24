import express, { Response, NextFunction } from 'express';
import { z } from 'zod';
import CallSession from '../models/CallSession.js';
import { protect, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const createSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  callerNumber: z.string().min(10, 'Invalid phone number'),
});

router.post('/', protect, validate(createSessionSchema), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }
    const { sessionId, callerNumber } = req.body;
    const session = await CallSession.create({
      userId: req.user._id.toString(),
      sessionId,
      callerNumber
    });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
});

router.get('/:sessionId', protect, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }
    const session = await CallSession.findOne({ 
      sessionId: req.params.sessionId,
      userId: req.user._id.toString()
    });
    
    if (session) {
      res.json(session);
    } else {
      res.status(404);
      throw new Error('Session not found');
    }
  } catch (err) {
    next(err);
  }
});

export default router;
