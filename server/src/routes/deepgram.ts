import express, { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/token', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY || '';
    if (!apiKey) {
      res.status(500).json({ message: 'Deepgram API key not configured' });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch('https://api.deepgram.com/v1/auth/grant', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl_seconds: 3600 }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const result: any = await response.json();

      if (response.ok && result.access_token) {
        res.json({ token: result.access_token });
      } else if (response.status === 403 || result.err_code === 'FORBIDDEN') {
        res.status(403).json({ 
          message: 'Deepgram API Key lacks sufficient permissions. Please ensure your API key has Admin role.'
        });
      } else {
        logger.error('Failed to create Deepgram temporary token', { status: response.status, data: result });
        res.status(500).json({ message: 'Failed to generate Deepgram token' });
      }
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      logger.error('Network error reaching Deepgram API', { error: fetchErr.message });
      res.status(502).json({ message: 'Backend failed to reach Deepgram API (Network Error)' });
    }
  } catch (err: any) {
    logger.error('Error generating Deepgram token', { error: err.message });
    next(err);
  }
});

export default router;
