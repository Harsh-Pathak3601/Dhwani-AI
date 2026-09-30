import { Router, Request, Response } from 'express';
import { detectSyntheticVoiceBatch, isModulateConfigured } from '../services/modulateService.js';
import logger from '../utils/logger.js';

const router: Router = Router();

/**
 * GET /api/modulate/status
 * Check if Modulate.ai Velma API key is active
 */
router.get('/status', (_req: Request, res: Response) => {
  const configured = isModulateConfigured();
  res.json({
    status: 'ok',
    configured,
    models: {
      streaming: 'velma-2-synthetic-voice-detection-streaming',
      batch: 'velma-2-synthetic-voice-detection-batch',
    },
    message: configured
      ? 'Modulate Velma-2 Synthetic Voice Detection is active'
      : 'MODULATE_API_KEY is not set. Add it in server/.env to enable Velma models.',
  });
});

/**
 * POST /api/modulate/analyze-batch
 * Accepts base64 audio payload or raw body for batch deepfake analysis
 */
router.post('/analyze-batch', async (req: Request, res: Response) => {
  try {
    if (!isModulateConfigured()) {
      return res.status(503).json({
        error: 'Modulate.ai is not configured. Please supply MODULATE_API_KEY in server/.env',
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
    logger.error('Error in /api/modulate/analyze-batch', { error: err.message });
    res.status(500).json({ error: err.message || 'Failed to process audio with Velma-2 Batch' });
  }
});

export default router;
