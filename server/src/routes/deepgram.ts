import express, { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

let cachedToken: string | null = null;
let cacheExpiresAt: number = 0;

async function fetchTokenFromDeepgram(apiKey: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15 seconds generous network timeout

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
      cachedToken = result.access_token;
      cacheExpiresAt = Date.now() + ((result.expires_in || 3600) * 1000);
      logger.info('Deepgram temporary token successfully generated and cached');
      return cachedToken;
    } else {
      logger.warn('Deepgram token grant returned non-ok status', { status: response.status, result });
      return null;
    }
  } catch (err: any) {
    clearTimeout(timeout);
    logger.warn('Deepgram token grant attempt failed or timed out', { error: err.message });
    return null;
  }
}

// Pre-warm token immediately on server start
setTimeout(() => {
  const key = process.env.DEEPGRAM_API_KEY || '';
  if (key) {
    fetchTokenFromDeepgram(key).catch(() => {});
  }
}, 1000);

router.get('/token', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Return cached token if valid for at least another 2 minutes
    if (cachedToken && Date.now() < cacheExpiresAt - 120000) {
      res.json({ token: cachedToken, cached: true });
      return;
    }

    const apiKey = process.env.DEEPGRAM_API_KEY || '';
    if (!apiKey) {
      res.status(503).json({ message: 'Deepgram API key not configured, use browser speech fallback' });
      return;
    }

    const token = await fetchTokenFromDeepgram(apiKey);
    if (token) {
      res.json({ token });
    } else {
      res.status(503).json({ message: 'Deepgram API unreachable, falling back to Web Speech API' });
    }
  } catch (err: any) {
    logger.error('Error generating Deepgram token', { error: err.message });
    next(err);
  }
});

/**
 * POST /api/deepgram/transcribe-file
 * Directly transcribes uploaded test audio/video files (MP3, WAV, WebM, MP4) via Deepgram Nova-2
 */
router.post('/transcribe-file', express.raw({ type: '*/*', limit: '40mb' }), async (req: Request, res: Response): Promise<void> => {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY || '';
    if (!apiKey) {
      res.status(503).json({ error: 'Deepgram API key not configured' });
      return;
    }

    const audioBuffer = req.body;
    if (!audioBuffer || !(audioBuffer instanceof Buffer) || audioBuffer.length === 0) {
      res.status(400).json({ error: 'Empty or invalid audio payload' });
      return;
    }

    const contentType = req.headers['content-type'] || 'audio/wav';

    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': contentType,
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.warn('Deepgram file transcription returned non-200', { status: response.status, body: errBody });
      res.status(response.status).json({ error: 'Deepgram transcription failed', details: errBody });
      return;
    }

    const data: any = await response.json();
    const alt = data?.results?.channels?.[0]?.alternatives?.[0];
    const transcript = alt?.transcript || '';
    const words = alt?.words || [];

    res.json({ transcript, words });
  } catch (err: any) {
    logger.error('Error in /api/deepgram/transcribe-file', { error: err.message });
    res.status(500).json({ error: 'File transcription failed' });
  }
});

export default router;
