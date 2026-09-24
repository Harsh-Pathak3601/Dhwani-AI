import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import CommunityReport from '../models/CommunityReport.js';
import { protect, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

/**
 * ─── COMMUNITY CHECK RATE LIMITER ───
 * Stricter per-IP rate limit to prevent phone number enumeration attacks.
 */
const checkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many lookup requests, please try again later.' }
});

const communityReportSchema = z.object({
  callerNumber: z.string().min(10, 'Invalid phone number'),
  riskScore: z.number().min(0).max(100),
});

router.get('/check/:number', checkLimiter, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { number } = req.params;
    const report = await CommunityReport.findOne({ callerNumber: number });
    
    if (report) {
      res.json({
        flagged: report.reportsCount >= 3 && report.averageRiskScore > 60,
        reportsCount: report.reportsCount,
        averageRiskScore: report.averageRiskScore,
        lastReportedAt: report.lastReportedAt
      });
    } else {
      res.json({ flagged: false, reportsCount: 0 });
    }
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(communityReportSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { callerNumber, riskScore } = req.body;
    
    let report = await CommunityReport.findOne({ callerNumber });
    
    if (report) {
      const newTotalScore = (report.averageRiskScore * report.reportsCount) + riskScore;
      report.reportsCount += 1;
      report.averageRiskScore = newTotalScore / report.reportsCount;
      report.lastReportedAt = new Date();
      await report.save();
    } else {
      report = await CommunityReport.create({
        callerNumber,
        reportsCount: 1,
        averageRiskScore: riskScore
      });
    }
    
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
});

export default router;
