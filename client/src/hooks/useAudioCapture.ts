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

      // 2. Initialize Browser DSP Feature Extractor (Parallel Tap — 0ms conversational latency)
      featureExtractorRef.current = new AudioFeatureExtractor();
      featureExtractorRef.current.start(stream, (features: AudioFeatures) => {
        const activeSocket = socketRef.current;
        if (activeSocket) {
          activeSocket.emit('audio:features', features);
        }
      });

      // 3. Setup MediaRecorder for audio streaming
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

      // 4. Web Speech API Fallback Definition (Resilient, auto-restarting on pauses or ambient silence)
      const startWebSpeechFallback = () => {
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
                if (socket) {
                  socket.emit('transcript:update', transcriptRef.current);
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
            // For 'no-speech' or 'aborted' or 'network', let onend restart it automatically
          };

          recognition.onend = () => {
            // Auto-restart if call is still active and Deepgram is not taking over
            if (isRecordingRef.current && !dgConnectedRef.current) {
              try {
                recognition.start();
              } catch {
                // Already running or restart in progress
              }
            } else {
              activeRecognitionRef.current = null;
            }
          };

          recognition.start();
          activeRecognitionRef.current = recognition;
        } catch (e) {
          console.warn('Could not start Web Speech Recognition:', e);
        }
      };

      // 5. Try Deepgram WebSocket, or seamlessly use Web Speech
      dgConnectedRef.current = false;
      const dgTimeout = setTimeout(() => {
        // If Deepgram has not connected within 5 seconds, activate Web Speech immediately so no words are missed
        if (!dgConnectedRef.current && isRecordingRef.current) {
          console.info('Deepgram connection taking longer, activating Web Speech Recognition as temporary fallback.');
          startWebSpeechFallback();
        }
      }, 5000);

      try {
        const tokenRes = await fetch(`${API_URL}/api/deepgram/token`, { signal: AbortSignal.timeout(12000) });
        if (tokenRes.ok) {
          const { token } = await tokenRes.json();
          if (token && isRecordingRef.current) {
            // Map UI language to Deepgram's optimal language codes
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

              // If Web Speech was temporarily active while waiting, stop it cleanly
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
                    if (socket) {
                      socket.emit('transcript:update', transcriptRef.current);
                    }
                    setTranscript(transcriptRef.current);
                  } else if (text) {
                    setTranscript(transcriptRef.current + text);
                  }
                }
              } catch {
                // ignore parsing error
              }
            };

            dgWs.onerror = () => {
              clearTimeout(dgTimeout);
              dgConnectedRef.current = false;
              if (isRecordingRef.current) {
                startWebSpeechFallback();
              }
            };

            dgWs.onclose = () => {
              if (dgConnectedRef.current && isRecordingRef.current) {
                dgConnectedRef.current = false;
                startWebSpeechFallback();
              }
            };
          } else {
            clearTimeout(dgTimeout);
            startWebSpeechFallback();
          }
        } else {
          clearTimeout(dgTimeout);
          startWebSpeechFallback();
        }
      } catch (dgErr) {
        clearTimeout(dgTimeout);
        console.warn('Deepgram token unreachable, using Web Speech API:', dgErr);
        if (isRecordingRef.current) {
          startWebSpeechFallback();
        }
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Microphone access denied.';
      console.error('Error accessing microphone:', err);
      setPermissionError(message);
      setHasPermission(false);
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, [socket, setTranscript, language]);

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
    } catch (err: any) {
      console.error('Failed to analyze file:', err);
      setPermissionError(err.message || 'Failed to decode audio file');
    }
  }, [socket]);

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
