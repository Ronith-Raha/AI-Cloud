'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Settings, Info, ChevronDown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { VoiceChat } from '@/components/voice/VoiceChat';

export default function VoicePage() {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <MainLayout>
      {/* Mobile: Full screen voice interface */}
      <div className="min-h-screen md:h-[calc(100vh-64px)] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        {/* Desktop Header - hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 left-8 hidden md:flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">LiveKit Voice</h1>
            <p className="text-sm text-white/50">Real-time AI conversation</p>
          </div>
        </motion.div>

        {/* Mobile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-0 right-0 px-6 flex md:hidden items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">LiveKit</h1>
              <p className="text-xs text-white/50">
                {voiceState === 'idle' && 'Ready'}
                {voiceState === 'listening' && 'Listening...'}
                {voiceState === 'processing' && 'Thinking...'}
                {voiceState === 'speaking' && 'Speaking...'}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Desktop Settings button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-8 right-8 hidden md:flex p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
        >
          <Settings className="w-5 h-5" />
        </motion.button>

        {/* Main Voice Chat Interface */}
        <div className="relative z-10 w-full max-w-2xl px-4 md:px-8 mt-16 md:mt-0">
          <VoiceChat onStateChange={setVoiceState} compact />
        </div>

        {/* Mobile: Expandable transcript */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-24 left-4 right-4 md:hidden"
        >
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white/50"
          >
            <span className="text-xs">Conversation History</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
          </button>
        </motion.div>

        {/* Desktop Info panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-8 left-8 right-8 hidden md:flex justify-center"
        >
          <div className="flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
            <Info className="w-4 h-4 text-white/50" />
            <p className="text-sm text-white/50">
              {voiceState === 'idle' && 'Press the call button to start a voice conversation'}
              {voiceState === 'listening' && 'Listening to your voice...'}
              {voiceState === 'processing' && 'Processing your request...'}
              {voiceState === 'speaking' && 'AI is responding...'}
            </p>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
