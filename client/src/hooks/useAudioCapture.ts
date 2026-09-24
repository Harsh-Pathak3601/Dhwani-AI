import { useState, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { DeepgramClient } from '@deepgram/sdk';
import { AudioFeatureExtractor, AudioFeatures } from '../services/audioFeatureExtractor';

const API_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
  : 'http://localhost:3001';

export const useAudioCapture = (socket: Socket | null, setTranscript: (transcript: string) => void) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dgSocketRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const featureExtractorRef = useRef<AudioFeatureExtractor | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // 1. Microphone Capture: Parallel Audio Tap (Start immediately)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      setPermissionError(null);
      transcriptRef.current = '';
      setIsRecording(true);

      // 2. Initialize Browser DSP Feature Extractor (Parallel Tap — 0ms conversational latency)
      featureExtractorRef.current = new AudioFeatureExtractor();
      featureExtractorRef.current.start(stream, (features: AudioFeatures) => {
        if (socket) {
          socket.emit('audio:features', features);
        }
      });

      // 3. MediaRecorder for audio streaming
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

      // 4. Try Deepgram Native WebSocket Connection
      let deepgramConnected = false;
      try {
        const tokenRes = await fetch(`${API_URL}/api/deepgram/token`, { signal: AbortSignal.timeout(4000) });
        if (tokenRes.ok) {
          const { token } = await tokenRes.json();
          if (token) {
            const dgWs = new WebSocket(
              'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true',
              ['token', token]
            );
            dgSocketRef.current = dgWs;

            dgWs.onopen = () => {
              deepgramConnected = true;
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
              initWebSpeechFallback();
            };

            dgWs.onclose = () => {
              if (!deepgramConnected) {
                initWebSpeechFallback();
              }
            };
          } else {
            initWebSpeechFallback();
          }
        } else {
          initWebSpeechFallback();
        }
      } catch (dgErr) {
        console.warn('Deepgram unavailable, activating browser speech recognition fallback:', dgErr);
        initWebSpeechFallback();
      }

      function initWebSpeechFallback() {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec && !dgSocketRef.current?.webSpeechActive) {
          try {
            const recognition = new SpeechRec();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
              let interim = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                  transcriptRef.current += event.results[i][0].transcript + ' ';
                  if (socket) {
                    socket.emit('transcript:update', transcriptRef.current);
                  }
                  setTranscript(transcriptRef.current);
                } else {
                  interim += event.results[i][0].transcript;
                }
              }
              if (interim) {
                setTranscript(transcriptRef.current + interim);
              }
            };

            recognition.onerror = (e: any) => {
              console.warn('Web Speech error:', e);
            };

            recognition.start();
            dgSocketRef.current = { 
              webSpeechActive: true, 
              close: () => { try { recognition.stop(); } catch {} } 
            };
          } catch (e) {
            console.warn('Web Speech fallback unavailable:', e);
          }
        }
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Microphone access denied.';
      console.error('Error accessing microphone:', err);
      setPermissionError(message);
      setHasPermission(false);
    }
  }, [socket, setTranscript]);

  const stopRecording = useCallback(() => {
    if (featureExtractorRef.current) {
      featureExtractorRef.current.stop();
      featureExtractorRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    
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

  return { 
    startRecording, 
    stopRecording, 
    injectSimulatedAcoustics,
    isRecording, 
    hasPermission, 
    permissionError 
  };
};
