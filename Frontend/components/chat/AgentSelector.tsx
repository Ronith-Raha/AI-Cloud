'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, MessageSquare } from 'lucide-react';
import { Agent } from '@/types/nexus';
import { cn, formatRelativeTime } from '@/lib/utils';

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
}

export function AgentSelector({ agents, selectedAgent, onSelectAgent }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 p-4 rounded-xl border transition-all',
          isOpen
            ? 'bg-white/10 border-white/20'
            : 'bg-white/5 border-white/10 hover:bg-white/10'
        )}
      >
        <span className="text-3xl">{selectedAgent.avatar}</span>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{selectedAgent.name}</span>
            <span className="text-xs text-white/40">
              {selectedAgent.memoryCount} memories
            </span>
          </div>
          <p className="text-sm text-white/50 line-clamp-1">
            {selectedAgent.description}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-white/50 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
          >
            {agents.map((agent) => {
              const isSelected = agent.id === selectedAgent.id;

              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    onSelectAgent(agent);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 transition-colors',
                    isSelected
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  )}
                >
                  <span className="text-2xl">{agent.avatar}</span>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{agent.name}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-white/50">
                      {agent.memoryCount} memories • Last used {formatRelativeTime(agent.lastInteraction)}
                    </p>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: agent.color }}
                  />
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact version for sidebar
export function AgentSelectorCompact({
  agents,
  selectedAgent,
  onSelectAgent,
}: AgentSelectorProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase text-white/50 px-2">
        Select Agent
      </h3>
      <div className="space-y-1">
        {agents.map((agent) => {
          const isSelected = agent.id === selectedAgent.id;

          return (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(agent)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg transition-all',
                isSelected
                  ? 'bg-white/10 border border-white/20'
                  : 'hover:bg-white/5 border border-transparent'
              )}
            >
              <span className="text-xl">{agent.avatar}</span>
              <div className="flex-1 text-left min-w-0">
                <span className="text-sm font-medium text-white block truncate">
                  {agent.name}
                </span>
                <span className="text-xs text-white/40">
                  {agent.memoryCount} memories
                </span>
              </div>
              {isSelected && (
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: agent.color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
