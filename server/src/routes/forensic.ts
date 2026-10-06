import { Router, Request, Response } from 'express';
import { detectSyntheticVoiceBatch, isForensicAcousticConfigured } from '../services/forensicAcousticService.js';
import logger from '../utils/logger.js';

const router: Router = Router();

/**
 * GET /status
 * Checks status of Forensic Acoustic engine
 */
router.get('/status', (_req: Request, res: Response) => {
  const configured = isForensicAcousticConfigured();
  res.json({
    status: 'ok',
    configured,
    models: {
      streaming: 'forensic-acoustic-streaming',
      batch: 'forensic-acoustic-batch',
    },
    message: configured
      ? 'Forensic Acoustic Synthetic Voice Detection is active'
      : 'API key is not configured in server/.env',
  });
});

/**
 * POST /analyze-batch
 * Accepts base64 audio payload or raw body for batch acoustic analysis
 */
router.post('/analyze-batch', async (req: Request, res: Response) => {
  try {
    if (!isForensicAcousticConfigured()) {
      return res.status(503).json({
        error: 'Forensic Acoustic Engine is not configured. Please supply API key in server/.env',
      });
    }

    const { audioBase64, filename = 'recording.wav', mimeType = 'audio/wav' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 string in request body' });
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const result = await detectSyntheticVoiceBatch(audioBuffer, filename, mimeType);

    res.json({
      success: true,
      result,
    });
  } catch (err: any) {
    logger.error('Error in /analyze-batch', { error: err.message });
    res.status(500).json({ error: err.message || 'Failed to process audio with Forensic Acoustic Engine' });
  }
});

export default router;
