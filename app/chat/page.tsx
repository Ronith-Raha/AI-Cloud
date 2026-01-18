'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, History, Sparkles, Brain } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AgentSelectorCompact } from '@/components/chat/AgentSelector';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Agent } from '@/types/nexus';
import { mockAgents, mockMemories } from '@/lib/mockData';
import { cn, formatRelativeTime } from '@/lib/utils';

export default function ChatPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent>(mockAgents[0]);

  // Get recent conversations (mock data)
  const recentConversations = [
    { id: '1', title: 'Space Fruit Game Progress', agent: mockAgents[0], timestamp: new Date('2026-01-17T10:30:00') },
    { id: '2', title: 'Neon color palette ideas', agent: mockAgents[2], timestamp: new Date('2026-01-16T18:45:00') },
    { id: '3', title: 'React patterns discussion', agent: mockAgents[0], timestamp: new Date('2026-01-15T14:20:00') },
  ];

  // Get agent's recent memories
  const agentMemories = mockMemories
    .filter((m) => m.sourceAgent === selectedAgent.id)
    .slice(0, 5);

  return (
    <MainLayout>
      <div className="h-[calc(100vh-64px)] flex">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-white/10 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-white">Chat</h1>
            </div>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity">
              <Sparkles className="w-4 h-4" />
              New Conversation
            </button>
          </div>

          {/* Agent selector */}
          <div className="p-4 border-b border-white/10">
            <AgentSelectorCompact
              agents={mockAgents}
              selectedAgent={selectedAgent}
              onSelectAgent={setSelectedAgent}
            />
          </div>

          {/* Recent conversations */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-white/50" />
              <h3 className="text-xs font-semibold uppercase text-white/50">
                Recent
              </h3>
            </div>
            <div className="space-y-2">
              {recentConversations.map((conv) => (
                <button
                  key={conv.id}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <span className="text-lg flex-shrink-0">{conv.agent.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{conv.title}</p>
                    <p className="text-xs text-white/40">
                      {formatRelativeTime(conv.timestamp)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Agent's memory context */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-white/50" />
              <h3 className="text-xs font-semibold uppercase text-white/50">
                Agent Context
              </h3>
            </div>
            <div className="space-y-2">
              {agentMemories.slice(0, 3).map((memory) => (
                <div
                  key={memory.id}
                  className="p-2 rounded-lg bg-white/5 border border-white/5"
                >
                  <p className="text-xs text-white/70 line-clamp-2">{memory.summary}</p>
                </div>
              ))}
              {agentMemories.length > 3 && (
                <p className="text-xs text-white/40 text-center">
                  +{agentMemories.length - 3} more memories
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="flex-shrink-0 p-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-xl border border-white/10"
                style={{ backgroundColor: `${selectedAgent.color}20` }}
              >
                <span className="text-2xl">{selectedAgent.avatar}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white">
                  {selectedAgent.name}
                </h2>
                <p className="text-sm text-white/50">{selectedAgent.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-white/70">
                    {selectedAgent.memoryCount} memories
                  </p>
                  <p className="text-xs text-white/40">
                    Last: {formatRelativeTime(selectedAgent.lastInteraction)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-white/50">Active</span>
                </div>
              </div>
            </div>

            {/* Capabilities */}
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedAgent.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="px-2 py-1 text-xs rounded-full bg-white/5 text-white/50 border border-white/10"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Chat interface */}
          <div className="flex-1 min-h-0">
            <ChatInterface agent={selectedAgent} />
          </div>
        </div>

        {/* Right panel - Memory preview on hover (optional) */}
        <div className="w-72 flex-shrink-0 border-l border-white/10 hidden xl:flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Memory Context</h3>
            <p className="text-xs text-white/40 mt-1">
              Memories used to enhance responses
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium text-white">How it works</span>
                </div>
                <p className="text-xs text-white/60">
                  When you send a message, the agent searches your memory bank for relevant context. This context is injected into the prompt to give personalized, accurate responses.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase text-white/50">
                  Top Categories
                </h4>
                {['Tech', 'Art', 'Personal'].map((cat, i) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                  >
                    <span className="text-xs text-white/70">{cat}</span>
                    <span className="text-xs text-white/40">{10 - i * 2} memories</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg border border-dashed border-white/10 text-center">
                <p className="text-xs text-white/40">
                  Start a conversation to see memories in action
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
