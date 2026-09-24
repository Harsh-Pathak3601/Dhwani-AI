import express, { Response, NextFunction } from 'express';
import { z } from 'zod';
import Report from '../models/Report.js';
import { protect, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const createReportSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  callerNumber: z.string().min(10, 'Invalid phone number'),
  summary: z.string().min(1, 'Summary is required'),
  scamType: z.string().min(1, 'Scam type is required'),
  redFlags: z.array(z.string()).default([]),
  psychologicalTactics: z.array(z.string()).default([]),
  evidenceLog: z.array(z.object({
    time: z.string(),
    event: z.string()
  })).default([]),
  recommendedAction: z.string().optional(),
  formalComplaintText: z.string().optional(),
  peakRiskScore: z.number().min(0).max(100),
}).strip();

const investigateSchema = z.object({
  investigationStatus: z.enum(['Suspected', 'Verified', 'Needs Review']),
  investigatorNotes: z.string().optional(),
  reviewerName: z.string().optional(),
}).strip();

// GET /api/reports — List + Filter + Counts
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, role, page: pageStr, limit: limitStr, search } = req.query;
    const page = parseInt(pageStr as string, 10) || 1;
    const limit = parseInt(limitStr as string, 10) || 20;
    const skip = (page - 1) * limit;

    // Build base filter
    const baseFilter: Record<string, unknown> = {};
    const userId = req.user ? req.user._id.toString() : 'anonymous';

    // For investigator/authority/admin roles, show all reports; otherwise scope to user
    if (role === 'investigator' || role === 'authority' || role === 'admin') {
      // No userId filter — show all reports for demo
    } else {
      baseFilter.userId = userId;
    }

    if (search) {
      baseFilter.callerNumber = { $regex: search as string, $options: 'i' };
    }

    // Filter with status for the query
    const queryFilter = { ...baseFilter };
    if (status) {
      queryFilter.investigationStatus = status as string;
    }

    const [reports, total, needsReview, suspected, verified] = await Promise.all([
      Report.find(queryFilter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Report.countDocuments(baseFilter),
      Report.countDocuments({ ...baseFilter, investigationStatus: 'Needs Review' }),
      Report.countDocuments({ ...baseFilter, investigationStatus: 'Suspected' }),
      Report.countDocuments({ ...baseFilter, investigationStatus: 'Verified' }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      reports,
      counts: { total, needsReview, suspected, verified },
      page,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/reports/:id/investigate — Update investigation status
router.patch('/:id/investigate', validate(investigateSchema), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { investigationStatus, investigatorNotes, reviewerName } = req.body;

    const updateData: Record<string, unknown> = {
      investigationStatus,
      reviewedAt: new Date(),
    };
    if (investigatorNotes !== undefined) {
      updateData.investigatorNotes = investigatorNotes;
    }
    if (reviewerName) {
      updateData.reviewedBy = reviewerName;
    }

    const report = await Report.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (report) {
      res.json(report);
    } else {
      res.status(404);
      throw new Error('Report not found');
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/reports/seed-demo — Seed demo data for judging
router.post('/seed-demo', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user ? req.user._id.toString() : 'anonymous';

    const demoReports = [
      {
        userId,
        sessionId: `demo-digital-arrest-${Date.now()}`,
        callerNumber: '+91-9876543210',
        summary: 'Caller impersonated a CBI officer claiming the victim\'s Aadhaar was linked to money laundering. Demanded immediate payment to avoid arrest. Used video call with fake uniform and badge.',
        scamType: 'Digital Arrest',
        redFlags: ['Impersonation of law enforcement', 'Urgency and fear tactics', 'Demand for immediate payment', 'Fake video call setup'],
        psychologicalTactics: ['Authority bias', 'Fear of legal consequences', 'Isolation from family', 'Time pressure'],
        evidenceLog: [
          { time: '00:00:15', event: 'Caller identified as "CBI Officer Sharma"' },
          { time: '00:01:30', event: 'Claimed Aadhaar linked to hawala transactions' },
          { time: '00:03:45', event: 'Threatened immediate arrest if payment not made' },
          { time: '00:05:00', event: 'Demanded ₹2,50,000 via UPI transfer' },
        ],
        recommendedAction: 'File FIR with local police and report to cybercrime.gov.in',
        formalComplaintText: 'Formal complaint regarding digital arrest scam involving impersonation of CBI officer.',
        peakRiskScore: 85,
        investigationStatus: 'Verified' as const,
        investigatorNotes: 'Confirmed scam pattern matching known digital arrest syndicate operating from Jharkhand. Phone number traced to VoIP service. Case forwarded to Cyber Crime Cell.',
        reviewedBy: 'Inv. Priya Mehta',
        reviewedAt: new Date(),
      },
      {
        userId,
        sessionId: `demo-lottery-fraud-${Date.now()}`,
        callerNumber: '+91-8765432109',
        summary: 'Caller claimed the victim won a ₹25 lakh KBC lottery prize. Asked for processing fee and tax payment upfront before releasing winnings.',
        scamType: 'Lottery / Prize Fraud',
        redFlags: ['Unsolicited prize notification', 'Upfront fee demand', 'Too good to be true offer', 'Pressure to act quickly'],
        psychologicalTactics: ['Greed appeal', 'Social proof (fake winner testimonials)', 'Scarcity and urgency'],
        evidenceLog: [
          { time: '00:00:20', event: 'Caller announced KBC lottery win of ₹25,00,000' },
          { time: '00:02:00', event: 'Requested ₹15,000 as "processing fee"' },
          { time: '00:04:10', event: 'Mentioned fake "RBI clearance certificate"' },
        ],
        recommendedAction: 'Block the number and report to consumer helpline 1800-11-4000',
        peakRiskScore: 62,
        investigationStatus: 'Suspected' as const,
        investigatorNotes: '',
      },
    ];

    await Report.insertMany(demoReports);

    res.status(201).json({ message: 'Demo data seeded', count: 2 });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/:sessionId — Get a single report by session ID
router.get('/:sessionId', protect, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }
    const report = await Report.findOne({ 
      sessionId: req.params.sessionId,
      userId: req.user._id.toString()
    });
    
    if (report) {
      res.json(report);
    } else {
      res.status(404);
      throw new Error('Report not found');
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/reports — Create a new report
router.post('/', protect, validate(createReportSchema), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }
    const reportData = req.body;
    reportData.userId = req.user._id.toString();
    
    const report = await Report.create(reportData);
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
});

export default router;
