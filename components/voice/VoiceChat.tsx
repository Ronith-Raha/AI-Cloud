'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { CloudShape } from './CloudShape';
import { cn } from '@/lib/utils';

type ConnectionState = 'disconnected' | 'connecting' | 'connected';
type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceChatProps {
  onStateChange?: (state: VoiceState) => void;
  compact?: boolean; // Mobile compact mode
}

export function VoiceChat({ onStateChange, compact = false }: VoiceChatProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Simulate audio level analysis
  const analyzeAudio = useCallback(() => {
    if (analyserRef.current && voiceState !== 'idle') {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average level
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalizedLevel = Math.min(average / 128, 1);
      setAudioLevel(normalizedLevel);

      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [voiceState]);

  // Start audio capture
  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyzeAudio();
    } catch (error) {
      console.error('Failed to access microphone:', error);
    }
  };

  // Stop audio capture
  const stopAudioCapture = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  };

  // Handle connection
  const handleConnect = async () => {
    if (connectionState === 'disconnected') {
      setConnectionState('connecting');

      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await startAudioCapture();
      setConnectionState('connected');
      setVoiceState('listening');
    } else {
      stopAudioCapture();
      setConnectionState('disconnected');
      setVoiceState('idle');
      setCurrentTranscript('');
    }
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // Toggle (if was muted, enable)
      });
    }
  };

  // Simulate voice interaction cycle
  useEffect(() => {
    if (connectionState !== 'connected') return;

    const simulateConversation = () => {
      // Simulate listening -> processing -> speaking cycle
      const cycle = async () => {
        // Listening phase (3-5 seconds)
        setVoiceState('listening');
        setCurrentTranscript('');

        // Simulate user speaking
        const userPhrases = [
          'Tell me about the weather today',
          'What meetings do I have scheduled?',
          'Play some relaxing music',
          'Set a reminder for tomorrow',
        ];
        const randomPhrase = userPhrases[Math.floor(Math.random() * userPhrases.length)];

        // Gradually show transcript
        for (let i = 0; i <= randomPhrase.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          setCurrentTranscript(randomPhrase.slice(0, i));
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Processing phase
        setVoiceState('processing');
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Speaking phase
        setVoiceState('speaking');
        setTranscript((prev) => [...prev.slice(-4), `You: ${randomPhrase}`]);
        setCurrentTranscript('');

        // Simulate AI response
        const responses = [
          "I'd be happy to help with that!",
          'Let me check that for you.',
          'Sure, processing your request now.',
          "I've got the information you need.",
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        await new Promise((resolve) => setTimeout(resolve, 2000));
        setTranscript((prev) => [...prev.slice(-4), `AI: ${randomResponse}`]);

        // Back to listening
        setVoiceState('listening');
      };

      const interval = setInterval(cycle, 8000);
      cycle(); // Start immediately

      return () => clearInterval(interval);
    };

    const cleanup = simulateConversation();
    return cleanup;
  }, [connectionState]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(voiceState);
  }, [voiceState, onStateChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioCapture();
    };
  }, []);

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-4 md:gap-8",
      compact ? "min-h-[400px]" : "min-h-[600px]"
    )}>
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
          {connectionState === 'connected'
            ? voiceState === 'listening'
              ? 'Listening...'
              : voiceState === 'processing'
              ? 'Processing...'
              : voiceState === 'speaking'
              ? 'Speaking...'
              : 'Connected'
            : connectionState}
        </span>
      </motion.div>

      {/* Cloud animated shape - smaller on mobile */}
      <div className={cn(compact ? "scale-75 md:scale-100" : "")}>
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
            <p className={cn(
              "text-white/80",
              compact ? "text-base" : "text-lg"
            )}>{currentTranscript}</p>
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
          {isMuted ? <MicOff className={cn(compact ? "w-5 h-5" : "w-6 h-6")} /> : <Mic className={cn(compact ? "w-5 h-5" : "w-6 h-6")} />}
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
            <Phone className={cn(compact ? "w-6 h-6" : "w-8 h-8")} />
          ) : connectionState === 'connecting' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Phone className={cn(compact ? "w-6 h-6" : "w-8 h-8")} />
            </motion.div>
          ) : (
            <PhoneOff className={cn(compact ? "w-6 h-6" : "w-8 h-8")} />
          )}
        </motion.button>

        {/* Volume/Settings button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all",
            compact ? 'p-3' : 'p-4'
          )}
        >
          <Volume2 className={cn(compact ? "w-5 h-5" : "w-6 h-6")} />
        </motion.button>
      </div>

      {/* Transcript history - hidden on mobile compact mode */}
      {!compact && (
        <div className="w-full max-w-md mt-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-h-[120px]">
            <h3 className="text-xs font-semibold uppercase text-white/40 mb-3">
              Conversation
            </h3>
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
