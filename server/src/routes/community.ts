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
    const rawNumber = Array.isArray(req.params.number) ? req.params.number[0] : req.params.number;
    const number = rawNumber || '';
    const clean = number.replace(/\D/g, '').slice(-10);
    const report = await CommunityReport.findOne({
      $or: [
        { callerNumber: number },
        ...(clean ? [
          { callerNumber: clean },
          { callerNumber: `+91${clean}` },
          { callerNumber: `+91 ${clean}` }
        ] : [])
      ]
    });
    
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
    const clean = callerNumber.replace(/\D/g, '').slice(-10);
    
    let report = await CommunityReport.findOne({
      $or: [
        { callerNumber },
        ...(clean ? [{ callerNumber: clean }] : [])
      ]
    });
    
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
