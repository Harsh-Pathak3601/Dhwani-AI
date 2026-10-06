import { useState, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { AudioFeatureExtractor, AudioFeatures } from '../services/audioFeatureExtractor';

const API_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
  : 'http://localhost:3001';

// In-memory token pre-warming and caching to eliminate initial 2-3s connection delays
let cachedDeepgramToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getDeepgramToken(): Promise<string | null> {
  if (cachedDeepgramToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedDeepgramToken;
  }
  try {
    const res = await fetch(`${API_URL}/api/deepgram/token`, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const { token } = await res.json();
      if (token) {
        cachedDeepgramToken = token;
        tokenExpiresAt = Date.now() + 50 * 60 * 1000;
        return token;
      }
    }
  } catch (err) {
    console.warn('Deepgram token pre-fetch notice:', err);
  }
  return cachedDeepgramToken;
}

// Pre-warm Deepgram token on client load
if (typeof window !== 'undefined') {
  getDeepgramToken().catch(() => {});
}

export const useAudioCapture = (
  socket: Socket | null, 
  setTranscript: (transcript: string) => void,
  language: string = 'en-IN'
) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const isRecordingRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dgSocketRef = useRef<any>(null);
  const dgConnectedRef = useRef<boolean>(false);
  const transcriptRef = useRef<string>('');
  const featureExtractorRef = useRef<AudioFeatureExtractor | null>(null);
  const activeRecognitionRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(socket);
  socketRef.current = socket;

  const emitThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const lastEmittedRef = useRef<string>('');
  const fileSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Throttled emitter to push streaming transcripts to the backend risk engine
  const emitLiveTranscript = useCallback((text: string) => {
    if (!text || text.trim() === lastEmittedRef.current.trim()) return;
    if (emitThrottleRef.current) clearTimeout(emitThrottleRef.current);
    emitThrottleRef.current = setTimeout(() => {
      lastEmittedRef.current = text;
      if (socketRef.current) {
        socketRef.current.emit('transcript:update', text);
      }
    }, 200);
  }, []);

  // Map user-selected dialect accurately to Deepgram Nova-2 models
  const getDgLang = useCallback((l: string) => {
    if (!l) return 'en-IN';
    const clean = l.toLowerCase().trim();
    if (clean.startsWith('en')) {
      return clean === 'en-us' ? 'en-US' : 'en-IN';
    }
    if (clean.startsWith('hi')) return 'hi';
    if (clean.startsWith('ta')) return 'ta';
    if (clean.startsWith('te')) return 'te';
    if (clean.startsWith('bn')) return 'bn';
    if (clean.startsWith('mr')) return 'mr';
    if (clean.startsWith('gu')) return 'gu';
    return 'en-IN';
  }, []);

  // Instant Web Speech API preview (0ms latency local fallback in browser while WebSocket connects)
  const startWebSpeechFallback = useCallback(() => {
    if (activeRecognitionRef.current) return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language || 'en-IN';

      recognition.onresult = (event: any) => {
        // If Deepgram is already streaming, don't overwrite with Web Speech
        if (dgConnectedRef.current) return;

        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            transcriptRef.current = (transcriptRef.current + ' ' + res[0].transcript).trim() + ' ';
            setTranscript(transcriptRef.current);
            emitLiveTranscript(transcriptRef.current);
          } else {
            interim += res[0].transcript;
          }
        }
        if (interim) {
          const preview = (transcriptRef.current + ' ' + interim).trim();
          setTranscript(preview);
          emitLiveTranscript(preview);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          setPermissionError('Microphone permission blocked by browser.');
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current && !dgConnectedRef.current) {
          try {
            recognition.start();
          } catch {}
        } else {
          activeRecognitionRef.current = null;
        }
      };

      recognition.start();
      activeRecognitionRef.current = recognition;
    } catch (e) {
      console.warn('Web Speech recognition start notice:', e);
    }
  }, [emitLiveTranscript, language, setPermissionError, setTranscript]);

  // Deepgram WebSocket Stream Connector with ultra-low latency chunking & endpointing
  const initDeepgramStream = useCallback(async (stream: MediaStream, allowWebSpeechFallback: boolean = true) => {
    let mediaRecorder: MediaRecorder | null = null;
    try {
      mediaRecorder = new MediaRecorder(stream, { 
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm' 
      });
      mediaRecorderRef.current = mediaRecorder;
    } catch (mrErr) {
      console.warn('MediaRecorder init fallback:', mrErr);
    }

    dgConnectedRef.current = false;

    // Start Web Speech preview immediately on live recording to eliminate initial perception delay
    if (allowWebSpeechFallback && !activeRecognitionRef.current) {
      startWebSpeechFallback();
    }

    try {
      // 0ms cached token retrieval
      const token = await getDeepgramToken();
      if (token && isRecordingRef.current) {
        const targetLang = getDgLang(language);

        // endpointing=150: finalize phrases in 150ms of natural breath/pause instead of 300+ms delay
        // interim_results=true: stream live words as they are pronounced
        const dgWs = new WebSocket(
          `wss://api.deepgram.com/v1/listen?model=nova-2&language=${targetLang}&smart_format=true&interim_results=true&endpointing=150&vad_events=true`,
          ['token', token]
        );
        dgSocketRef.current = dgWs;

        dgWs.onopen = () => {
          dgConnectedRef.current = true;
          console.info(`Deepgram Nova-2 connected in real-time (Language: ${targetLang}).`);

          // Stop browser Web Speech once Deepgram is online
          if (activeRecognitionRef.current) {
            try {
              activeRecognitionRef.current.stop();
            } catch {}
            activeRecognitionRef.current = null;
          }

          if (mediaRecorder && mediaRecorder.state === 'inactive') {
            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0 && dgWs.readyState === WebSocket.OPEN) {
                dgWs.send(event.data);
              }
            };
            // 100ms chunking for 2.5x lower delivery latency than default 250ms
            mediaRecorder.start(100);
          }
        };

        dgWs.onmessage = (event) => {
          try {
            const received = JSON.parse(event.data);
            if (received.type === 'Results' && received.channel?.alternatives?.[0]) {
              const text = received.channel.alternatives[0].transcript;
              if (text) {
                if (received.is_final) {
                  transcriptRef.current = (transcriptRef.current + ' ' + text).trim() + ' ';
                  setTranscript(transcriptRef.current);
                  emitLiveTranscript(transcriptRef.current);
                } else {
                  // Live word preview rendered without waiting for sentence completion
                  const currentPreview = (transcriptRef.current + ' ' + text).trim();
                  setTranscript(currentPreview);
                  emitLiveTranscript(currentPreview);
                }
              }
            }
          } catch {}
        };

        dgWs.onerror = () => {
          dgConnectedRef.current = false;
          if (isRecordingRef.current && allowWebSpeechFallback) {
            startWebSpeechFallback();
          }
        };

        dgWs.onclose = () => {
          if (dgConnectedRef.current && isRecordingRef.current && allowWebSpeechFallback) {
            dgConnectedRef.current = false;
            startWebSpeechFallback();
          }
        };
      }
    } catch (dgErr) {
      console.warn('Deepgram connection error:', dgErr);
      if (isRecordingRef.current && allowWebSpeechFallback) {
        startWebSpeechFallback();
      }
    }
  }, [emitLiveTranscript, getDgLang, language, setTranscript, startWebSpeechFallback]);

  const startRecording = useCallback(async () => {
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: true,
            channelCount: 1
          } 
        });
      } catch (constraintErr) {
        console.warn('Advanced audio constraints not supported, fallback to standard audio:', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      streamRef.current = stream;
      setHasPermission(true);
      setPermissionError(null);
      transcriptRef.current = '';
      setTranscript('');
      isRecordingRef.current = true;
      setIsRecording(true);

      // Initialize Browser DSP Feature Extractor with 16kHz PCM tap for real-time acoustic streaming
      featureExtractorRef.current = new AudioFeatureExtractor();
      featureExtractorRef.current.setPcmCallback((pcmBuffer: ArrayBuffer) => {
        if (socketRef.current && isRecordingRef.current) {
          socketRef.current.emit('audio:chunk', pcmBuffer);
        }
      });
      featureExtractorRef.current.start(stream, (features: AudioFeatures) => {
        const activeSocket = socketRef.current;
        if (activeSocket) {
          activeSocket.emit('audio:features', features);
        }
      });

      // Connect MediaRecorder & Deepgram WebSocket
      await initDeepgramStream(stream, true);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Microphone access denied.';
      console.error('Error accessing microphone:', err);
      setPermissionError(message);
      setHasPermission(false);
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, [initDeepgramStream, setTranscript]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    dgConnectedRef.current = false;
    setIsRecording(false);

    if (fileSyncTimerRef.current) {
      clearInterval(fileSyncTimerRef.current);
      fileSyncTimerRef.current = null;
    }

    if (emitThrottleRef.current) {
      clearTimeout(emitThrottleRef.current);
      emitThrottleRef.current = null;
    }

    if (featureExtractorRef.current) {
      featureExtractorRef.current.stop();
      featureExtractorRef.current = null;
    }

    if (activeRecognitionRef.current) {
      try {
        activeRecognitionRef.current.stop();
      } catch {}
      activeRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (dgSocketRef.current) {
      if (typeof dgSocketRef.current.sendCloseStream === 'function') {
        dgSocketRef.current.sendCloseStream({ type: 'CloseStream' });
      }
      if (dgSocketRef.current.close) {
        dgSocketRef.current.close();
      }
      dgSocketRef.current = null;
    }
  }, []);

  const injectSimulatedAcoustics = useCallback((mode: 'synthetic_attack' | 'authentic_human') => {
    const simulated = AudioFeatureExtractor.generateSimulatedFeatures(mode);
    if (socket) {
      socket.emit('audio:features', simulated);
    }
  }, [socket]);

  /**
   * Starts file analysis with frame-perfect timestamp synchronization between
   * audio playback and transcription text display.
   */
  const startFileAnalysis = useCallback(async (file: File, onEnded?: () => void) => {
    try {
      setHasPermission(true);
      setPermissionError(null);
      transcriptRef.current = '';
      setTranscript('');
      isRecordingRef.current = true;
      setIsRecording(true);

      if (fileSyncTimerRef.current) {
        clearInterval(fileSyncTimerRef.current);
        fileSyncTimerRef.current = null;
      }

      if (featureExtractorRef.current) {
        featureExtractorRef.current.stop();
      }
      featureExtractorRef.current = new AudioFeatureExtractor();
      featureExtractorRef.current.setPcmCallback((pcmBuffer: ArrayBuffer) => {
        if (socketRef.current && isRecordingRef.current) {
          socketRef.current.emit('audio:chunk', pcmBuffer);
        }
      });

      // 1. Kick off high-accuracy pre-recorded word-level transcription in parallel
      const transcribePromise = fetch(`${API_URL}/api/deepgram/transcribe-file?language=${encodeURIComponent(getDgLang(language))}`, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'audio/wav' },
        body: file
      }).then(res => res.json()).catch(err => {
        console.warn('File transcription pre-fetch notice:', err);
        return null;
      });

      // In parallel, inspect audio file via deep forensic acoustic batch API
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string)?.split(',')[1];
        if (base64) {
          fetch(`${API_URL}/api/forensic/analyze-batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64,
              filename: file.name,
              mimeType: file.type || 'audio/wav',
            }),
          })
            .then(res => res.json())
            .then(data => {
              if (data?.result && socketRef.current) {
                socketRef.current.emit('modulate:batch_result', data.result);
              }
            })
            .catch(() => {});
        }
      };
      reader.readAsDataURL(file);

      // Brief wait (~800ms) for pre-transcription to get exact word-level start timestamps
      const fastResult = await Promise.race([
        transcribePromise,
        new Promise(resolve => setTimeout(resolve, 850))
      ]);

      let playbackStartTime = Date.now();

      const syncWordsWithAudio = (words: Array<{ word: string; start: number; end: number; punctuated_word?: string }>) => {
        if (!words || words.length === 0) return;
        if (fileSyncTimerRef.current) {
          clearInterval(fileSyncTimerRef.current);
        }
        let wordPointer = 0;
        fileSyncTimerRef.current = setInterval(() => {
          if (!isRecordingRef.current) {
            clearInterval(fileSyncTimerRef.current!);
            return;
          }
          const currentAudioSec = (Date.now() - playbackStartTime) / 1000;
          while (wordPointer < words.length && words[wordPointer].start <= currentAudioSec) {
            wordPointer++;
          }
          const wordsToShow = words.slice(0, wordPointer).map(w => w.punctuated_word || w.word).join(' ');
          if (wordsToShow !== transcriptRef.current) {
            transcriptRef.current = wordsToShow;
            setTranscript(wordsToShow);
            emitLiveTranscript(wordsToShow);
          }
          if (wordPointer >= words.length) {
            clearInterval(fileSyncTimerRef.current!);
            fileSyncTimerRef.current = null;
          }
        }, 40);
      };

      // Start the audio playback through speaker and acoustic analyser
      playbackStartTime = Date.now();
      await featureExtractorRef.current.startFile(
        file,
        (features: AudioFeatures) => {
          if (socketRef.current) {
            socketRef.current.emit('audio:features', features);
          }
        },
        () => {
          if (fileSyncTimerRef.current) {
            clearInterval(fileSyncTimerRef.current);
            fileSyncTimerRef.current = null;
          }
          if (onEnded) onEnded();
        }
      );

      if (fastResult?.words && fastResult.words.length > 0) {
        // Frame-perfect lockstep alignment from the exact millisecond audio starts!
        syncWordsWithAudio(fastResult.words);
      } else {
        // If transcribePromise took slightly longer, sync immediately upon arrival
        transcribePromise.then(delayedData => {
          if (delayedData?.words && delayedData.words.length > 0 && isRecordingRef.current) {
            syncWordsWithAudio(delayedData.words);
          } else if (delayedData?.transcript && isRecordingRef.current) {
            transcriptRef.current = delayedData.transcript;
            setTranscript(delayedData.transcript);
            emitLiveTranscript(delayedData.transcript);
          }
        });
      }
    } catch (err: any) {
      console.error('Failed to analyze file:', err);
      setPermissionError(err.message || 'Failed to decode audio file');
    }
  }, [emitLiveTranscript, getDgLang, language, setTranscript]);

  return { 
    startRecording, 
    stopRecording, 
    startFileAnalysis,
    injectSimulatedAcoustics,
    isRecording, 
    hasPermission, 
    permissionError 
  };
};
