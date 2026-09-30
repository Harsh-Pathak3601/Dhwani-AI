import { useState, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { AudioFeatureExtractor, AudioFeatures } from '../services/audioFeatureExtractor';

const API_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
  : 'http://localhost:3001';

export const useAudioCapture = (
  socket: Socket | null, 
  setTranscript: (transcript: string) => void,
  language: string = 'hi-IN'
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

  // Web Speech API Fallback Definition (Resilient, auto-restarting on pauses or ambient silence)
  const startWebSpeechFallback = useCallback(() => {
    if (activeRecognitionRef.current) return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language || 'hi-IN';

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            transcriptRef.current += res[0].transcript + ' ';
            const words = transcriptRef.current.split(' ');
            if (words.length > 400) {
              transcriptRef.current = words.slice(words.length - 400).join(' ');
            }
            if (socketRef.current) {
              socketRef.current.emit('transcript:update', transcriptRef.current);
            }
            setTranscript(transcriptRef.current);
          } else {
            interim += res[0].transcript;
          }
        }
        if (interim) {
          setTranscript(transcriptRef.current + interim);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Web Speech status:', e.error);
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
      console.warn('Could not start Web Speech Recognition:', e);
    }
  }, [language, setTranscript, setPermissionError]);

  // Deepgram WebSocket Stream Connector (supports both Mic stream and AudioContext MediaStreamDestination)
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
    const dgTimeout = setTimeout(() => {
      if (!dgConnectedRef.current && isRecordingRef.current && allowWebSpeechFallback) {
        console.info('Deepgram connection taking longer, activating Web Speech Recognition as temporary fallback.');
        startWebSpeechFallback();
      }
    }, 5000);

    try {
      const tokenRes = await fetch(`${API_URL}/api/deepgram/token`, { signal: AbortSignal.timeout(12000) });
      if (tokenRes.ok) {
        const { token } = await tokenRes.json();
        if (token && isRecordingRef.current) {
          const getDgLang = (l: string) => {
            if (l.startsWith('hi')) return 'hi';
            if (l === 'en-IN') return 'en-IN';
            if (l === 'en-US') return 'en-US';
            return 'hi';
          };
          const targetLang = getDgLang(language || 'hi-IN');

          const dgWs = new WebSocket(
            `wss://api.deepgram.com/v1/listen?model=nova-2&language=${targetLang}&smart_format=true&interim_results=true&endpointing=300`,
            ['token', token]
          );
          dgSocketRef.current = dgWs;

          dgWs.onopen = () => {
            clearTimeout(dgTimeout);
            dgConnectedRef.current = true;
            console.info(`Deepgram Nova-2 connected successfully (Language: ${targetLang}).`);

            if (activeRecognitionRef.current) {
              try {
                activeRecognitionRef.current.stop();
              } catch {}
              activeRecognitionRef.current = null;
            }

            if (mediaRecorder && mediaRecorder.state === 'inactive') {
              mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                  if (dgWs.readyState === WebSocket.OPEN) {
                    dgWs.send(event.data);
                  }
                }
              };
              mediaRecorder.start(250);
            }
          };

          dgWs.onmessage = (event) => {
            try {
              const received = JSON.parse(event.data);
              if (received.type === 'Results' && received.channel?.alternatives?.[0]) {
                const text = received.channel.alternatives[0].transcript;
                if (text && received.is_final) {
                  transcriptRef.current += text + ' ';
                  const words = transcriptRef.current.split(' ');
                  if (words.length > 400) {
                    transcriptRef.current = words.slice(words.length - 400).join(' ');
                  }
                  if (socketRef.current) {
                    socketRef.current.emit('transcript:update', transcriptRef.current);
                  }
                  setTranscript(transcriptRef.current);
                } else if (text) {
                  setTranscript(transcriptRef.current + text);
                }
              }
            } catch {}
          };

          dgWs.onerror = () => {
            clearTimeout(dgTimeout);
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
        } else {
          clearTimeout(dgTimeout);
          if (allowWebSpeechFallback) startWebSpeechFallback();
        }
      } else {
        clearTimeout(dgTimeout);
        if (allowWebSpeechFallback) startWebSpeechFallback();
      }
    } catch (dgErr) {
      clearTimeout(dgTimeout);
      console.warn('Deepgram token unreachable:', dgErr);
      if (isRecordingRef.current && allowWebSpeechFallback) {
        startWebSpeechFallback();
      }
    }
  }, [language, setTranscript, startWebSpeechFallback]);

  const startRecording = useCallback(async () => {
    try {
      // 1. Microphone Capture: Parallel Audio Tap (High-fidelity capture for direct speech + external speakers)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,  // Do NOT cancel external speaker audio
            noiseSuppression: false,  // Do NOT suppress acoustic harmonics from other devices
            autoGainControl: true,    // Dynamically boost faint audio from nearby external devices
            channelCount: 1
          } 
        });
      } catch (constraintErr) {
        console.warn('Advanced audio constraints not supported by device, falling back to standard audio:', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      streamRef.current = stream;
      setHasPermission(true);
      setPermissionError(null);
      transcriptRef.current = '';
      isRecordingRef.current = true;
      setIsRecording(true);

      // 2. Initialize Browser DSP Feature Extractor with 16kHz PCM tap for Modulate Velma Streaming
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

      // 3. Connect MediaRecorder & Deepgram WebSocket
      await initDeepgramStream(stream, true);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Microphone access denied.';
      console.error('Error accessing microphone:', err);
      setPermissionError(message);
      setHasPermission(false);
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, [initDeepgramStream]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    dgConnectedRef.current = false;
    setIsRecording(false);

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

  const startFileAnalysis = useCallback(async (file: File, onEnded?: () => void) => {
    try {
      setHasPermission(true);
      setPermissionError(null);
      transcriptRef.current = '';
      isRecordingRef.current = true;
      setIsRecording(true);

      if (featureExtractorRef.current) {
        featureExtractorRef.current.stop();
      }
      featureExtractorRef.current = new AudioFeatureExtractor();
      featureExtractorRef.current.setPcmCallback((pcmBuffer: ArrayBuffer) => {
        if (socketRef.current && isRecordingRef.current) {
          socketRef.current.emit('audio:chunk', pcmBuffer);
        }
      });

      await featureExtractorRef.current.startFile(
        file, 
        (features: AudioFeatures) => {
          const activeSocket = socketRef.current;
          if (activeSocket) {
            activeSocket.emit('audio:features', features);
          }
        },
        onEnded
      );

      // In parallel, inspect audio file via Modulate Velma-2 Batch forensic API
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string)?.split(',')[1];
        if (base64) {
          fetch(`${API_URL}/api/modulate/analyze-batch`, {
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
                console.info('[Modulate Velma-2 Batch] Analysis result:', data.result);
                socketRef.current.emit('modulate:batch_result', data.result);
              }
            })
            .catch(err => console.warn('[Modulate] Batch analysis background notice:', err));
        }
      };
      reader.readAsDataURL(file);

      // 1. Tapped live MediaStream from file playback -> Deepgram WebSocket streaming
      const fileStream = featureExtractorRef.current.getMediaStream();
      if (fileStream) {
        streamRef.current = fileStream;
        initDeepgramStream(fileStream, false);
      }

      // 2. High-accuracy pre-recorded transcription fallback:
      // Calls /api/deepgram/transcribe-file to guarantee spoken words stream at steady tempo
      fetch(`${API_URL}/api/deepgram/transcribe-file`, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'audio/wav' },
        body: file
      }).then(res => res.json()).then(data => {
        if (data.transcript && isRecordingRef.current) {
          // If live WebSocket hasn't already populated transcript:
          if (!transcriptRef.current.trim()) {
            if (data.words && data.words.length > 0) {
              let wIdx = 0;
              const interval = setInterval(() => {
                if (!isRecordingRef.current || wIdx >= data.words.length) {
                  clearInterval(interval);
                  return;
                }
                const chunk = data.words.slice(wIdx, wIdx + 3).map((w: any) => w.word).join(' ');
                wIdx += 3;
                transcriptRef.current += (transcriptRef.current ? ' ' : '') + chunk;
                if (socketRef.current) {
                  socketRef.current.emit('transcript:update', transcriptRef.current);
                }
                setTranscript(transcriptRef.current);
              }, 400);
            } else {
              transcriptRef.current = data.transcript;
              if (socketRef.current) {
                socketRef.current.emit('transcript:update', transcriptRef.current);
              }
              setTranscript(transcriptRef.current);
            }
          }
        }
      }).catch(err => {
        console.warn('Pre-recorded file transcription notice:', err);
      });
    } catch (err: any) {
      console.error('Failed to analyze file:', err);
      setPermissionError(err.message || 'Failed to decode audio file');
    }
  }, [initDeepgramStream, setTranscript]);

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
