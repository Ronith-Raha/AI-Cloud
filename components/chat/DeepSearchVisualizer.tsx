'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Database, Sparkles, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { SearchPhase, MemoryReference, CATEGORY_COLORS } from '@/types/nexus';
import { mockMemories } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface DeepSearchVisualizerProps {
  phase: SearchPhase;
}

const phaseConfig = {
  idle: { icon: Search, color: 'text-white/40', label: '' },
  searching: { icon: Database, color: 'text-cyan-400', label: 'Searching Memory Bank' },
  found: { icon: Sparkles, color: 'text-purple-400', label: 'Relevant Memories Found' },
  injecting: { icon: Zap, color: 'text-yellow-400', label: 'Injecting Context' },
  generating: { icon: Loader2, color: 'text-emerald-400', label: 'Generating Response' },
  complete: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Complete' },
};

export function DeepSearchVisualizer({ phase }: DeepSearchVisualizerProps) {
  if (phase.status === 'idle' || phase.status === 'complete') {
    return null;
  }

  const config = phaseConfig[phase.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 mx-4 mb-4 rounded-xl bg-gradient-to-br from-black/60 to-black/40 border border-white/10 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn('p-2 rounded-lg bg-white/5', config.color)}>
          <Icon className={cn('w-5 h-5', phase.status === 'generating' && 'animate-spin')} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{config.label}</p>
          {phase.status === 'searching' && (
            <p className="text-xs text-white/50">Query: "{phase.query}"</p>
          )}
        </div>
      </div>

      {/* Progress visualization */}
      <div className="space-y-3">
        {/* Searching animation */}
        {phase.status === 'searching' && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="text-xs text-white/40">Scanning...</span>
          </div>
        )}

        {/* Found memories */}
        {phase.status === 'found' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-xs text-white/50 mb-2">
              Found {phase.count} relevant memories
            </p>
            {phase.memories.slice(0, 3).map((ref, index) => {
              const memory = mockMemories.find((m) => m.id === ref.memoryId);
              if (!memory) return null;
              const categoryColor = CATEGORY_COLORS[memory.category];

              return (
                <motion.div
                  key={ref.memoryId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: categoryColor?.base }}
                  />
                  <span className="text-xs text-white/70 flex-1 truncate">
                    {ref.snippet}
                  </span>
                  <span className="text-xs text-white/40">
                    {Math.round(ref.relevanceScore * 100)}%
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Injecting context */}
        {phase.status === 'injecting' && (
          <motion.div className="space-y-2">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-yellow-400"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
              <span className="text-xs text-white/60">
                Enhancing prompt with {phase.memories.length} memories...
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {phase.memories.map((ref, index) => (
                <motion.div
                  key={ref.memoryId}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.15 }}
                  className="h-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Generating */}
        {phase.status === 'generating' && (
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-emerald-500"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-white/60">
              Generating contextual response...
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Simulates the deep search process
export function useDeepSearch() {
  const [phase, setPhase] = useState<SearchPhase>({ status: 'idle' });

  const startSearch = async (query: string): Promise<MemoryReference[]> => {
    // Phase 1: Searching
    setPhase({ status: 'searching', query });
    await sleep(1500);

    // Phase 2: Found
    const relevantMemories = findRelevantMemories(query);
    setPhase({ status: 'found', count: relevantMemories.length, memories: relevantMemories });
    await sleep(1200);

    // Phase 3: Injecting
    setPhase({ status: 'injecting', memories: relevantMemories });
    await sleep(1000);

    // Phase 4: Generating
    setPhase({ status: 'generating' });
    await sleep(2000);

    // Phase 5: Complete
    setPhase({ status: 'complete' });

    return relevantMemories;
  };

  const reset = () => {
    setPhase({ status: 'idle' });
  };

  return { phase, startSearch, reset };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findRelevantMemories(query: string): MemoryReference[] {
  const lowerQuery = query.toLowerCase();
  const keywords = lowerQuery.split(' ').filter((w) => w.length > 2);

  return mockMemories
    .map((memory) => {
      let score = 0;

      // Check content match
      keywords.forEach((keyword) => {
        if (memory.content.toLowerCase().includes(keyword)) score += 0.3;
        if (memory.summary.toLowerCase().includes(keyword)) score += 0.4;
        if (memory.tags.some((t) => t.toLowerCase().includes(keyword))) score += 0.3;
      });

      // Boost for high importance
      if (memory.importance === 'high') score *= 1.2;
      if (memory.importance === 'critical') score *= 1.5;

      return {
        memoryId: memory.id,
        relevanceScore: Math.min(score, 1),
        snippet: memory.summary,
      };
    })
    .filter((ref) => ref.relevanceScore > 0.1)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
}
