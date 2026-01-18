'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';
import { Room, createLocalAudioTrack } from 'livekit-client';
import { cn } from '@/lib/utils';
import { apiUrl, streamChatTurn } from '@/lib/api/client';
import { useProjectId } from '@/lib/hooks/useProjectId';
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from '@/lib/agents';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';
type LiveKitTextReader = {
  info?: { attributes?: Record<string, string> };
  readAll: () => Promise<string>;
};

export function VoiceBubble() {
  const { projectId } = useProjectId();
  const [isOpen, setIsOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const roomRef = useRef<Room | null>(null);
  const micTrackRef = useRef<MediaStreamTrack | null>(null);
  const processedSegmentsRef = useRef<Set<string>>(new Set());
  const pendingTurnRef = useRef(false);

  // Analyze audio levels
  const analyzeAudio = useCallback(() => {
    if (analyserRef.current && voiceState === 'listening') {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalizedLevel = Math.min(average / 128, 1);
      setAudioLevel(normalizedLevel);

      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [voiceState]);

  const connectLiveKit = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      if (!projectId) {
        throw new Error('No active project');
      }
      const response = await fetch(apiUrl('/api/livekit/connection-details'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch LiveKit connection: ${response.status} ${errorText}`
        );
      }
      const { serverUrl, participantToken } = (await response.json()) as {
        serverUrl: string;
        participantToken: string;
      };

      const room = new Room();
      room.registerTextStreamHandler('lk.transcription', async (reader: LiveKitTextReader) => {
        const isFinal = reader.info?.attributes?.['lk.transcription_final'] === 'true';
        const segmentId = reader.info?.attributes?.['lk.segment_id'] ?? '';
        if (!isFinal || !segmentId || processedSegmentsRef.current.has(segmentId)) {
          return;
        }
        processedSegmentsRef.current.add(segmentId);
        const message = await reader.readAll();
        if (!message.trim()) return;
        setTranscript(message);
        await handleTranscript(message);
      });

      await room.connect(serverUrl, participantToken);
      roomRef.current = room;

      const micTrack = await createLocalAudioTrack();
      micTrackRef.current = micTrack.mediaStreamTrack;
      await room.localParticipant.publishTrack(micTrack);

      const stream = new MediaStream([micTrack.mediaStreamTrack]);
      mediaStreamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      setVoiceState('listening');
      analyzeAudio();
    } catch (error) {
      console.error('Failed to connect LiveKit:', error);
      setVoiceState('idle');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTranscript = async (message: string) => {
    if (!projectId || pendingTurnRef.current) return;
    pendingTurnRef.current = true;
    setVoiceState('processing');
    try {
      let assistantText = '';
      await streamChatTurn({
        payload: {
          projectId,
          provider: DEFAULT_PROVIDER,
          model: DEFAULT_MODEL,
          userText: message,
        },
        onToken: (data) => {
          assistantText += data.text;
        },
        onComplete: () => {
          if (assistantText.trim()) {
            setTranscript(assistantText);
          }
        },
        onError: (data) => {
          console.error('Chat turn error', data.message);
        },
      });
    } finally {
      pendingTurnRef.current = false;
      setVoiceState('listening');
    }
  };

  // Start listening
  const startListening = async () => {
    try {
      await connectLiveKit();
    } catch (error) {
      console.error('Failed to access microphone:', error);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (micTrackRef.current) {
      micTrackRef.current.stop();
      micTrackRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
    setVoiceState('idle');
    setTranscript('');
    processedSegmentsRef.current.clear();
  };

  // Handle bubble click
  const handleBubbleClick = () => {
    if (!isOpen) {
      setIsOpen(true);
      startListening();
    } else if (voiceState === 'idle') {
      startListening();
    } else {
      stopListening();
    }
  };

  // Handle close
  const handleClose = () => {
    stopListening();
    setIsOpen(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  // Generate volume bars
  const volumeBars = Array.from({ length: 5 }, (_, i) => {
    const threshold = (i + 1) / 5;
    const isActive = audioLevel >= threshold * 0.8;
    const height = 8 + i * 4;
    return { height, isActive };
  });

  return (
    <div className="fixed bottom-6 left-6 z-50 hidden md:block">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 left-0 w-72 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    voiceState === 'listening' && 'bg-emerald-500 animate-pulse',
                    voiceState === 'processing' && 'bg-yellow-500 animate-pulse',
                    voiceState === 'speaking' && 'bg-cyan-500 animate-pulse',
                    voiceState === 'idle' && 'bg-gray-500'
                  )}
                />
                <span className="text-sm text-white/70 capitalize">
                  {voiceState === 'idle' ? 'Ready' : voiceState}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            {/* Volume bars visualization */}
            <div className="flex items-end justify-center gap-1 h-16 mb-4">
              {volumeBars.map((bar, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    'w-3 rounded-full transition-colors',
                    bar.isActive ? 'bg-gradient-to-t from-cyan-500 to-purple-500' : 'bg-white/10'
                  )}
                  animate={{
                    height: voiceState === 'listening'
                      ? bar.isActive ? bar.height + audioLevel * 20 : bar.height
                      : bar.height,
                  }}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </div>

            {/* Transcript */}
            {transcript && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-white/80 text-center mb-4"
              >
                {transcript}
              </motion.p>
            )}

            {/* Action button */}
            <button
              onClick={handleBubbleClick}
              className={cn(
                'w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all',
                voiceState === 'listening'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-white/10 hover:border-white/20'
              )}
            >
              {voiceState === 'listening' ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span className="text-sm">Stop Listening</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span className="text-sm">
                    {isConnecting ? 'Connecting...' : 'Start Listening'}
                  </span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main bubble button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg',
          isOpen
            ? 'bg-gradient-to-r from-cyan-500 to-purple-500'
            : 'bg-black/80 border border-white/20 hover:border-white/40'
        )}
      >
        {/* Pulsing ring when listening */}
        {voiceState === 'listening' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-cyan-500"
            animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

        {isOpen ? (
          voiceState === 'speaking' ? (
            <Volume2 className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )
        ) : (
          <Mic className="w-6 h-6 text-white/70" />
        )}
      </motion.button>
    </div>
  );
}
