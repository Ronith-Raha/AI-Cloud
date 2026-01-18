'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, MessageSquare, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

const features = [
  {
    icon: Brain,
    title: 'Memory Cloud',
    description: 'Visualize your documented mind with an interactive, living brain map of all your memories.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: MessageSquare,
    title: 'Multi-Agent Chat',
    description: 'Chat with specialized AI agents that understand your context and preferences.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Sparkles,
    title: 'AI Insights',
    description: 'Discover patterns, growth trends, and connections in your knowledge base.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Zap,
    title: 'Deep Search',
    description: 'Watch as AI searches and injects relevant memories into every conversation.',
    color: 'from-emerald-500 to-teal-500',
  },
];

export default function Home() {
  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 py-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/5 border border-white/10"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/70">Centralized Memory Cloud for AI Agents</span>
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Nexus Cloud
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto">
            Your AI agents remember everything. Visualize your documented mind, chat with context-aware agents, and discover insights about yourself.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              href="/memory"
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-semibold hover:opacity-90 transition-all"
            >
              <Brain className="w-5 h-5" />
              Explore Memory Cloud
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-semibold hover:bg-white/10 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              Start Chatting
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/[0.07]"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-0.5 mb-4`}
                >
                  <div className="w-full h-full rounded-xl bg-black flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Demo Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-20 max-w-5xl mx-auto w-full"
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-1">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10" />
            <div className="relative rounded-xl bg-black/60 backdrop-blur-sm p-8">
              {/* Mock visualization preview */}
              <div className="flex items-center justify-center h-64 relative">
                {/* Animated nodes */}
                {[
                  { x: '20%', y: '30%', size: 60, color: '#00D9FF', delay: 0 },
                  { x: '50%', y: '20%', size: 80, color: '#FF00FF', delay: 0.1 },
                  { x: '75%', y: '40%', size: 50, color: '#00FF88', delay: 0.2 },
                  { x: '35%', y: '60%', size: 70, color: '#FFB800', delay: 0.3 },
                  { x: '65%', y: '70%', size: 45, color: '#8B5CF6', delay: 0.4 },
                ].map((node, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + node.delay, type: 'spring' }}
                    className="absolute"
                    style={{ left: node.x, top: node.y }}
                  >
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: node.delay * 2,
                      }}
                      className="relative"
                    >
                      {/* Glow */}
                      <div
                        className="absolute inset-0 rounded-full blur-xl opacity-40"
                        style={{
                          backgroundColor: node.color,
                          width: node.size,
                          height: node.size,
                        }}
                      />
                      {/* Node */}
                      <div
                        className="rounded-full border-2"
                        style={{
                          width: node.size,
                          height: node.size,
                          borderColor: node.color,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                        }}
                      />
                    </motion.div>
                  </motion.div>
                ))}

                {/* Connection lines (simplified) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <motion.line
                    x1="20%" y1="30%" x2="50%" y2="20%"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                  />
                  <motion.line
                    x1="50%" y1="20%" x2="75%" y2="40%"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.6, duration: 0.5 }}
                  />
                  <motion.line
                    x1="35%" y1="60%" x2="65%" y2="70%"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.7, duration: 0.5 }}
                  />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className="text-center"
                  >
                    <p className="text-white/40 text-sm">Interactive Memory Visualization</p>
                    <p className="text-white/20 text-xs mt-1">Click to explore your documented mind</p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-20 flex flex-wrap items-center justify-center gap-12"
        >
          {[
            { value: '20+', label: 'Memories' },
            { value: '5', label: 'AI Agents' },
            { value: '7', label: 'Categories' },
            { value: '5', label: 'AI Insights' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-sm text-white/40">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </MainLayout>
  );
}
