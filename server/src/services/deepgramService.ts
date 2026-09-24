import { DeepgramClient } from '@deepgram/sdk';
import logger from '../utils/logger.js';

export const setupDeepgram = async (onTranscript: (transcript: string) => void) => {
  const apiKey = process.env.DEEPGRAM_API_KEY || '';

  if (!apiKey) {
    logger.error('DEEPGRAM_API_KEY is not set in environment variables');
    return null;
  }

  try {
    const deepgram = new DeepgramClient({ apiKey });

    /**
     * Connection options for Deepgram's live transcription WebSocket.
     *
     * - `encoding` is intentionally omitted so Deepgram can auto-detect
     *   the incoming WebM/Opus container from the browser's MediaRecorder.
     *   Passing `encoding: 'webm'` causes a 400 because 'webm' is not a
     *   recognised Deepgram encoding value.
     * - `interim_results` enables partial transcripts during streaming so
     *   the client gets near-real-time updates instead of waiting for
     *   final utterances only.
     */
    const connection = await deepgram.listen.v1.connect({
      model: 'nova-2',
      language: 'en-IN',
      smart_format: 'true',
      interim_results: 'true',
      vad_events: 'true',
      Authorization: `Token ${apiKey}`,
    });

    connection.on('open', () => {
      logger.info('Deepgram WebSocket connection opened');
    });

    connection.on('close', () => {
      logger.info('Deepgram WebSocket connection closed');
    });

    connection.on('message', (data: any) => {
      if (data.type === 'Results') {
        const alt = data.channel?.alternatives?.[0];
        const transcript = alt?.transcript;
        // Only forward non-empty, final transcripts
        if (transcript && data.is_final) {
          onTranscript(transcript);
        }
      }
    });

    connection.on('error', (err: Error) => {
      logger.error('Deepgram WebSocket error', { error: err.message });
    });

    connection.connect();
    await connection.waitForOpen();

    return connection;
  } catch (error: any) {
    logger.error('Failed to setup Deepgram', { error: error.message });
    return null;
  }
};
