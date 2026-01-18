'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { Track } from 'livekit-client';
import { CloudShape } from './CloudShape';
import { useSession, AgentState } from '@/lib/livekit';
import { cn } from '@/lib/utils';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceChatProps {
  onStateChange?: (state: VoiceState) => void;
  compact?: boolean;
  agentName?: string;
}

// Map LiveKit agent state to our voice state
function mapAgentStateToVoiceState(agentState: AgentState): VoiceState {
  switch (agentState) {
    case 'listening':
      return 'listening';
    case 'thinking':
      return 'processing';
    case 'speaking':
      return 'speaking';
    default:
      return 'idle';
  }
}

export function VoiceChat({ onStateChange, compact = false, agentName }: VoiceChatProps) {
  const { room, status, agentState, error, connect, disconnect } = useSession({ agentName });
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const voiceState = mapAgentStateToVoiceState(agentState);

  // Analyze audio levels from local microphone
  const analyzeAudio = useCallback(() => {
    if (analyserRef.current && status === 'connected' && !isMuted) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalizedLevel = Math.min(average / 128, 1);
      setAudioLevel(normalizedLevel);

      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [status, isMuted]);

  // Set up audio analysis when room is connected
  useEffect(() => {
    if (room && status === 'connected') {
      const setupAudioAnalysis = async () => {
        try {
          const localParticipant = room.localParticipant;
          const audioTrack = localParticipant.getTrackPublication(Track.Source.Microphone);

          if (audioTrack?.track?.mediaStream) {
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;

            const source = audioContextRef.current.createMediaStreamSource(
              audioTrack.track.mediaStream
            );
            source.connect(analyserRef.current);
            analyzeAudio();
          }
        } catch (err) {
          console.error('Failed to set up audio analysis:', err);
        }
      };

      setupAudioAnalysis();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [room, status, analyzeAudio]);

  // Handle connection
  const handleConnect = async () => {
    if (status === 'disconnected' || status === 'error') {
      await connect();
    } else {
      disconnect();
      setCurrentTranscript('');
      setAudioLevel(0);
    }
  };

  // Handle mute toggle
  const handleMuteToggle = async () => {
    if (room) {
      const newMuted = !isMuted;
      await room.localParticipant.setMicrophoneEnabled(!newMuted);
      setIsMuted(newMuted);
      if (newMuted) {
        setAudioLevel(0);
      }
    }
  };

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(voiceState);
  }, [voiceState, onStateChange]);

  // Listen for transcription events from the room
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const decoder = new TextDecoder();
        const message = JSON.parse(decoder.decode(payload));

        if (message.type === 'transcription') {
          if (message.role === 'user') {
            setCurrentTranscript(message.text);
            if (message.final) {
              setTranscript((prev) => [...prev.slice(-4), `You: ${message.text}`]);
              setCurrentTranscript('');
            }
          } else if (message.role === 'assistant' && message.final) {
            setTranscript((prev) => [...prev.slice(-4), `AI: ${message.text}`]);
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    room.on('dataReceived', handleDataReceived);
    return () => {
      room.off('dataReceived', handleDataReceived);
    };
  }, [room]);

  const connectionState = status === 'connecting' ? 'connecting' : status === 'connected' ? 'connected' : 'disconnected';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 md:gap-8',
        compact ? 'min-h-[400px]' : 'min-h-[600px]'
      )}
    >
      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div
          className={cn(
            'w-3 h-3 rounded-full',
            connectionState === 'connected' && 'bg-emerald-500 animate-pulse',
            connectionState === 'connecting' && 'bg-yellow-500 animate-pulse',
            connectionState === 'disconnected' && 'bg-gray-500'
          )}
        />
        <span className="text-sm text-white/60 capitalize">
          {error
            ? 'Error'
            : connectionState === 'connected'
            ? voiceState === 'listening'
              ? 'Listening...'
              : voiceState === 'processing'
              ? 'Thinking...'
              : voiceState === 'speaking'
              ? 'Speaking...'
              : agentState === 'initializing'
              ? 'Connecting to agent...'
              : 'Connected'
            : connectionState}
        </span>
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-400 text-center max-w-xs"
        >
          {error}
        </motion.p>
      )}

      {/* Cloud animated shape */}
      <div className={cn(compact ? 'scale-75 md:scale-100' : '')}>
        <CloudShape
          isListening={voiceState === 'listening' && !isMuted}
          isSpeaking={voiceState === 'speaking'}
          audioLevel={isMuted ? 0 : audioLevel}
        />
      </div>

      {/* Current transcript */}
      <AnimatePresence mode="wait">
        {currentTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-8 text-center"
          >
            <p className={cn('text-white/80', compact ? 'text-base' : 'text-lg')}>
              {currentTranscript}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control buttons */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mute button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMuteToggle}
          disabled={connectionState !== 'connected'}
          className={cn(
            'rounded-full border transition-all',
            compact ? 'p-3' : 'p-4',
            connectionState !== 'connected'
              ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
              : isMuted
              ? 'bg-red-500/20 border-red-500/50 text-red-400'
              : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
          )}
        >
          {isMuted ? (
            <MicOff className={cn(compact ? 'w-5 h-5' : 'w-6 h-6')} />
          ) : (
            <Mic className={cn(compact ? 'w-5 h-5' : 'w-6 h-6')} />
          )}
        </motion.button>

        {/* Connect/Disconnect button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleConnect}
          className={cn(
            'rounded-full transition-all',
            compact ? 'p-4' : 'p-6',
            connectionState === 'disconnected'
              ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
              : connectionState === 'connecting'
              ? 'bg-yellow-500/20 border-2 border-yellow-500/50 text-yellow-400'
              : 'bg-red-500/20 border-2 border-red-500/50 text-red-400'
          )}
        >
          {connectionState === 'disconnected' ? (
            <Phone className={cn(compact ? 'w-6 h-6' : 'w-8 h-8')} />
          ) : connectionState === 'connecting' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Phone className={cn(compact ? 'w-6 h-6' : 'w-8 h-8')} />
            </motion.div>
          ) : (
            <PhoneOff className={cn(compact ? 'w-6 h-6' : 'w-8 h-8')} />
          )}
        </motion.button>

        {/* Volume/Settings button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all',
            compact ? 'p-3' : 'p-4'
          )}
        >
          <Volume2 className={cn(compact ? 'w-5 h-5' : 'w-6 h-6')} />
        </motion.button>
      </div>

      {/* Transcript history */}
      {!compact && (
        <div className="w-full max-w-md mt-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-h-[120px]">
            <h3 className="text-xs font-semibold uppercase text-white/40 mb-3">Conversation</h3>
            <div className="space-y-2">
              <AnimatePresence>
                {transcript.length === 0 ? (
                  <p className="text-sm text-white/30 text-center py-4">
                    {connectionState === 'connected'
                      ? 'Start speaking to begin...'
                      : 'Press the call button to connect'}
                  </p>
                ) : (
                  transcript.map((line, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'text-sm',
                        line.startsWith('You:') ? 'text-cyan-400' : 'text-purple-400'
                      )}
                    >
                      {line}
                    </motion.p>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
