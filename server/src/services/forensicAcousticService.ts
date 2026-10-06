import logger from '../utils/logger.js';

export interface VelmaFrameVerdict {
  startTimeMs: number;
  endTimeMs: number;
  verdict: 'synthetic' | 'non-synthetic' | 'no-content';
  confidence: number;
}

export interface VelmaBatchResponse {
  durationMs: number;
  syntheticFramesCount: number;
  totalFramesCount: number;
  overallVerdict: 'synthetic' | 'non-synthetic' | 'inconclusive';
  maxConfidence: number;
  averageSyntheticConfidence: number;
  frames: VelmaFrameVerdict[];
}

export interface VelmaStreamingSession {
  sessionId: string;
  sendAudioChunk: (chunk: Buffer | ArrayBuffer | Uint8Array) => void;
  close: () => void;
  isConnected: () => boolean;
}

const MODULATE_API_KEY = process.env.MODULATE_API_KEY || '';
const MODULATE_REST_BASE = process.env.MODULATE_REST_BASE || 'https://platform.modulate.ai/api';
const MODULATE_WS_BASE = process.env.MODULATE_WS_BASE || 'wss://platform.modulate.ai/api';

/**
 * Checks if Modulate Velma API Key is configured in environment
 */
export function isModulateConfigured(): boolean {
  const key = process.env.FORENSIC_API_KEY || process.env.MODULATE_API_KEY;
  return Boolean(key && key.trim() !== '');
}

export const isForensicAcousticConfigured = isModulateConfigured;


export async function detectSyntheticVoiceBatch(
  audioBuffer: Buffer,
  filename: string = 'sample.wav',
  mimeType: string = 'audio/wav'
): Promise<VelmaBatchResponse> {
  const apiKey = process.env.MODULATE_API_KEY || MODULATE_API_KEY;
  if (!apiKey) {
    throw new Error('MODULATE_API_KEY is not configured in environment variables');
  }

  const formData = new FormData();
  const blob = new Blob([audioBuffer as unknown as BlobPart], { type: mimeType });
  formData.append('upload_file', blob, filename);

  const endpoint = `${MODULATE_REST_BASE}/velma-2-synthetic-voice-detection-batch`;
  logger.info(`[Modulate] Calling Velma-2 Batch synthetic voice detection: ${endpoint}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[Modulate] Velma-2 Batch error response', { status: response.status, body: errorText });
    throw new Error(`Modulate Velma-2 Batch failed (${response.status}): ${errorText}`);
  }

  const data: any = await response.json();
  const rawFrames: any[] = data.frames || [];

  let syntheticCount = 0;
  let totalConfidence = 0;
  let maxConf = 0;

  const parsedFrames: VelmaFrameVerdict[] = rawFrames.map((f: any) => {
    const isSynthetic = f.verdict === 'synthetic';
    if (isSynthetic) {
      syntheticCount++;
      totalConfidence += Number(f.confidence || 0);
      if (Number(f.confidence || 0) > maxConf) {
        maxConf = Number(f.confidence || 0);
      }
    }
    return {
      startTimeMs: Number(f.start_time_ms || 0),
      endTimeMs: Number(f.end_time_ms || 0),
      verdict: f.verdict || 'no-content',
      confidence: Number(f.confidence || 0),
    };
  });

  const durationMs = Number(data.duration_ms || 0);
  const avgConfidence = syntheticCount > 0 ? totalConfidence / syntheticCount : 0;

  let overallVerdict: 'synthetic' | 'non-synthetic' | 'inconclusive' = 'non-synthetic';
  if (syntheticCount > 0 && maxConf >= 0.65) {
    overallVerdict = 'synthetic';
  } else if (rawFrames.length === 0) {
    overallVerdict = 'inconclusive';
  }

  return {
    durationMs,
    syntheticFramesCount: syntheticCount,
    totalFramesCount: rawFrames.length,
    overallVerdict,
    maxConfidence: maxConf,
    averageSyntheticConfidence: avgConfidence,
    frames: parsedFrames,
  };
}


export function createVelmaStreamingSession(
  sessionId: string,
  onVerdict: (verdict: VelmaFrameVerdict) => void,
  options: {
    sampleRate?: number;
    numChannels?: number;
    audioFormat?: string;
  } = {}
): VelmaStreamingSession | null {
  const apiKey = process.env.MODULATE_API_KEY || MODULATE_API_KEY;
  if (!apiKey) {
    logger.warn('[Modulate] Cannot start Velma-2 Streaming session: MODULATE_API_KEY is missing');
    return null;
  }

  const sampleRate = options.sampleRate || 16000;
  const numChannels = options.numChannels || 1;
  const audioFormat = options.audioFormat || 's16le';

  const isRawFormat = ['s16le', 's16be', 'f32le', 'f32be', 'alaw', 'mulaw', 'u8', 's8'].includes(audioFormat);
  const queryParams = new URLSearchParams({
    api_key: apiKey,
    audio_format: audioFormat,
  });

  if (isRawFormat) {
    queryParams.append('sample_rate', sampleRate.toString());
    queryParams.append('num_channels', numChannels.toString());
  }

  const wsUrl = `${MODULATE_WS_BASE}/velma-2-synthetic-voice-detection-streaming?${queryParams.toString()}`;

  let ws: WebSocket | null = null;
  let connected = false;
  const pendingBuffer: Uint8Array[] = [];

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      connected = true;
      logger.info(`[Modulate] Velma-2 streaming connected for session: ${sessionId} (format: ${audioFormat}, rate: ${sampleRate}Hz)`);
      // Flush any queued audio packets
      while (pendingBuffer.length > 0) {
        const chunk = pendingBuffer.shift();
        if (chunk && ws && ws.readyState === WebSocket.OPEN) {
          ws.send(chunk as any);
        }
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const raw = typeof event.data === 'string' ? event.data : event.data?.toString();
        if (!raw) return;

        const msg = JSON.parse(raw);
        if (msg.error) {
          logger.error(`[Modulate Velma-2] API error: ${msg.error}`, { sessionId });
        }

        // Modulate returns frames inside msg.frame or at top level
        const frameData = msg.frame || msg;
        if (frameData && frameData.verdict) {
          const parsedVerdict: VelmaFrameVerdict = {
            startTimeMs: Number(frameData.start_time_ms || 0),
            endTimeMs: Number(frameData.end_time_ms || 0),
            verdict: frameData.verdict,
            confidence: Number(frameData.confidence || 0),
          };
          onVerdict(parsedVerdict);
        } else if (msg.type === 'done') {
          logger.info(`[Modulate Velma-2] Stream completed normally for session ${sessionId}`, {
            durationMs: msg.duration_ms,
            frameCount: msg.frame_count,
          });
        }
      } catch (err: any) {
        logger.error('[Modulate] Error parsing streaming verdict frame', { error: err.message });
      }
    };

    ws.onerror = (event: Event) => {
      logger.error('[Modulate] Velma-2 Streaming WebSocket encountered an error', { sessionId });
    };

    ws.onclose = (event: any) => {
      connected = false;
      logger.info(`[Modulate] Velma-2 streaming closed for session: ${sessionId}`, {
        code: event?.code,
        reason: event?.reason,
        wasClean: event?.wasClean,
      });
    };
  } catch (err: any) {
    logger.error('[Modulate] Failed to initialize Velma streaming session', { error: err.message });
    return null;
  }

  return {
    sessionId,
    sendAudioChunk: (chunk: Buffer | ArrayBuffer | Uint8Array) => {
      if (!ws) return;
      const data = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data as any);
      } else if (ws.readyState === WebSocket.CONNECTING) {
        if (pendingBuffer.length < 50) {
          pendingBuffer.push(data);
        }
      }
    },
    close: () => {
      if (!ws) return;
      try {
        if (ws.readyState === WebSocket.OPEN) {
          logger.info(`[Modulate] Sending EOS empty frame for session: ${sessionId}`);
          ws.send('');
          // Allow server up to 1.5s to process remaining audio and send 'done' frame before closing
          setTimeout(() => {
            if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
              ws.close(1000, 'Session ended normally');
            }
          }, 1500);
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      } catch (e: any) {
        logger.warn('[Modulate] Error during streaming session close', { error: e.message });
      }
      connected = false;
    },
    isConnected: () => connected && ws !== null && ws.readyState === WebSocket.OPEN,
  };
}

// Forensic Acoustic export aliases for full compatibility
export type ForensicAcousticFrameVerdict = VelmaFrameVerdict;
export type ForensicAcousticBatchResponse = VelmaBatchResponse;
export type ForensicAcousticStreamingSession = VelmaStreamingSession;
export const createForensicAcousticStreamingSession = createVelmaStreamingSession;


