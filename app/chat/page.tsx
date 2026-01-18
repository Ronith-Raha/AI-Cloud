'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, History, Sparkles, Brain } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AgentSelectorCompact } from '@/components/chat/AgentSelector';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Agent, ChatMessage, GraphNode } from '@/types/nexus';
import type { TurnTranscriptItem } from '@/lib/api/types';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROVIDER_MODELS, agents as baseAgents } from '@/lib/agents';
import { formatRelativeTime, generateId } from '@/lib/utils';
import { useProjectId } from '@/lib/hooks/useProjectId';
import { getGraphView, getTurns } from '@/lib/api/client';
import { mapGraphViewToGraphData } from '@/lib/api/graph';

export default function ChatPage() {
  const { projectId } = useProjectId();
  const [selectedAgent, setSelectedAgent] = useState<Agent>(baseAgents[0]);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>(DEFAULT_PROVIDER);
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [chatSessionKey, setChatSessionKey] = useState(0);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[] | null>(null);
  const [selectedTurnError, setSelectedTurnError] = useState<string | null>(null);
  const [turns, setTurns] = useState<TurnTranscriptItem[]>([]);
  const [sessions, setSessions] = useState<Array<{
    id: string;
    projectId: string;
    startTurnId: string;
    createdAt: string;
  }>>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    let isActive = true;
    if (!projectId) return;
    setIsLoadingGraph(true);
    getGraphView(projectId, 0, 50)
      .then((view) => {
        if (!isActive) return;
        const graphData = mapGraphViewToGraphData(view);
        setGraphNodes(graphData.nodes);
        setGraphError(null);
      })
      .catch((error) => {
        if (!isActive) return;
        setGraphError(error instanceof Error ? error.message : 'Failed to load graph');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoadingGraph(false);
      });

    return () => {
      isActive = false;
    };
  }, [projectId]);

  useEffect(() => {
    let isActive = true;
    if (!projectId) return;
    getTurns(projectId)
      .then((response) => {
        if (!isActive) return;
        setTurns(response.turns);
        if (response.turns.length > 0 && sessions.length === 0) {
          const firstTurn = response.turns[0];
          const seedSession = {
            id: generateId(),
            projectId,
            startTurnId: firstTurn.turnId,
            createdAt: firstTurn.createdAt
          };
          const next = [seedSession];
          setSessions(next);
          persistSessions(next);
          setCurrentSessionId(seedSession.id);
        }
      })
      .catch(() => {
        if (!isActive) return;
        setInitialMessages(null);
      });

    return () => {
      isActive = false;
    };
  }, [projectId, selectedAgent.id, sessions.length]);

  const realNodes = useMemo(() => graphNodes.filter((node) => !node.isGroup), [graphNodes]);

  const agents = useMemo(() => {
    const lastInteraction = realNodes[0]?.createdAt ?? new Date();
    return baseAgents.map((agent) => ({
      ...agent,
      memoryCount: realNodes.length,
      lastInteraction,
      provider,
      model
    }));
  }, [realNodes, provider, model]);

  useEffect(() => {
    if (!agents.find((agent) => agent.id === selectedAgent.id)) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, selectedAgent.id]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!projectId || typeof window === 'undefined') return;
    const raw = window.localStorage.getItem('nexus_chat_sessions');
    if (!raw) {
      setSessions([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Array<{
        id: string;
        projectId: string;
        startTurnId: string;
        createdAt: string;
      }>;
      setSessions(parsed.filter((item) => item.projectId === projectId));
    } catch {
      setSessions([]);
    }
  }, [projectId]);

  const persistSessions = (items: Array<{
    id: string;
    projectId: string;
    startTurnId: string;
    createdAt: string;
  }>) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('nexus_chat_sessions', JSON.stringify(items));
  };

  const derivedSessions = useMemo(() => {
    if (sessions.length > 0) return sessions;
    if (turns.length === 0) return [];
    const gapMs = 10 * 60 * 1000;
    const sortedTurns = turns
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const derived: Array<{ id: string; projectId: string; startTurnId: string; createdAt: string }> = [];
    let currentStart = sortedTurns[0];
    derived.push({
      id: generateId(),
      projectId: projectId ?? "",
      startTurnId: currentStart.turnId,
      createdAt: currentStart.createdAt
    });
    for (let i = 1; i < sortedTurns.length; i += 1) {
      const prev = sortedTurns[i - 1];
      const curr = sortedTurns[i];
      const gap = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
      if (gap > gapMs) {
        derived.push({
          id: generateId(),
          projectId: projectId ?? "",
          startTurnId: curr.turnId,
          createdAt: curr.createdAt
        });
      }
    }
    return derived;
  }, [sessions, turns, projectId]);

  const sessionTurns = useMemo(() => {
    if (pendingSessionId && currentSessionId === pendingSessionId) {
      return [];
    }
    if (!currentSessionId) return turns;
    const sortedSessions = derivedSessions
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const currentIndex = sortedSessions.findIndex((session) => session.id === currentSessionId);
    if (currentIndex === -1) return turns;
    const currentSession = sortedSessions[currentIndex];
    const startIndex = turns.findIndex((turn) => turn.turnId === currentSession.startTurnId);
    if (startIndex === -1) return turns;
    const nextSession = sortedSessions[currentIndex + 1];
    const endIndex = nextSession
      ? turns.findIndex((turn) => turn.turnId === nextSession.startTurnId)
      : turns.length;
    return turns.slice(startIndex, endIndex === -1 ? turns.length : endIndex);
  }, [turns, derivedSessions, currentSessionId, pendingSessionId]);

  const recentConversations = useMemo(() => {
    if (derivedSessions.length === 0) {
      return turns
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((turn) => ({
          id: turn.turnId,
          title: turn.userText || 'Conversation',
          agent: selectedAgent,
          timestamp: new Date(turn.createdAt)
        }));
    }

    return derivedSessions
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((session) => {
        const startIndex = turns.findIndex((turn) => turn.turnId === session.startTurnId);
        const tail = startIndex === -1 ? [] : turns.slice(startIndex);
        const first = tail[0] ?? turns[startIndex] ?? turns[0];
        const latest = tail[tail.length - 1] ?? turns[turns.length - 1];
        return {
          id: session.id,
          title: first?.userText || latest?.userText || 'Conversation',
          agent: selectedAgent,
          timestamp: latest ? new Date(latest.createdAt) : new Date(session.createdAt)
        };
      });
  }, [derivedSessions, turns, selectedAgent]);

  const agentMemories = useMemo(() => realNodes.slice(0, 5), [realNodes]);

  const handleSelectConversation = (sessionId: string) => {
    setSelectedTurnError(null);
    setCurrentSessionId(sessionId);
    setChatSessionKey((prev) => prev + 1);
  };

  const handleNewConversation = () => {
    const nextSessionId = generateId();
    setPendingSessionId(nextSessionId);
    setCurrentSessionId(nextSessionId);
    setInitialMessages([]);
    setSelectedTurnError(null);
    setChatSessionKey((prev) => prev + 1);
  };

  useEffect(() => {
    const transcript: ChatMessage[] = sessionTurns.flatMap((turn) => [
      {
        id: generateId(),
        role: 'user',
        content: turn.userText,
        timestamp: new Date(turn.createdAt),
        agentId: selectedAgent.id,
        turnId: turn.turnId,
        nodeId: turn.nodeId ?? undefined
      },
      {
        id: generateId(),
        role: 'assistant',
        content: turn.assistantText,
        timestamp: new Date(turn.createdAt),
        agentId: selectedAgent.id,
        turnId: turn.turnId,
        nodeId: turn.nodeId ?? undefined
      }
    ]);
    setInitialMessages(transcript);
  }, [sessionTurns, selectedAgent.id]);

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
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              New Conversation
            </button>
          </div>

          {/* Agent selector */}
          <div className="p-4 border-b border-white/10">
              <AgentSelectorCompact
                agents={agents}
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
              {recentConversations.length > 0 ? (
                recentConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
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
                ))
              ) : (
                <p className="text-xs text-white/40 px-2">
                  {isLoadingGraph ? 'Loading conversations…' : 'No conversations yet.'}
                </p>
              )}
            </div>
            {selectedTurnError && (
              <p className="mt-2 text-xs text-rose-400">{selectedTurnError}</p>
            )}
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
            {graphError && (
              <p className="mt-2 text-xs text-rose-400">
                {graphError}
              </p>
            )}
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
                    {realNodes.length} memories
                  </p>
                  <p className="text-xs text-white/40">
                    Last: {isClient ? formatRelativeTime(selectedAgent.lastInteraction) : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-white/50">Active</span>
                </div>
              </div>
            </div>

            {/* Capabilities + model switching */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {selectedAgent.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="px-2 py-1 text-xs rounded-full bg-white/5 text-white/50 border border-white/10"
                >
                  {cap}
                </span>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <select
                  value={provider}
                  onChange={(event) => {
                    const nextProvider = event.target.value;
                    setProvider(nextProvider);
                    const nextModels = PROVIDER_MODELS[nextProvider] ?? [];
                    setModel(nextModels[0] ?? '');
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                >
                  {Object.keys(PROVIDER_MODELS).map((key) => (
                    <option key={key} value={key} className="text-black">
                      {key}
                    </option>
                  ))}
                </select>
                <input
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  list="model-options"
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white min-w-[180px]"
                />
                <datalist id="model-options">
                  {(PROVIDER_MODELS[provider] ?? []).map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Chat interface */}
          <div className="flex-1 min-h-0">
            <ChatInterface
              key={chatSessionKey}
              agent={selectedAgent}
              projectId={projectId}
              memoryNodes={realNodes}
              initialMessages={initialMessages ?? undefined}
              onTurnComplete={(payload) => {
                if (!projectId) return;
                getGraphView(projectId, 0, 50)
                  .then((view) => {
                    const graphData = mapGraphViewToGraphData(view);
                    setGraphNodes(graphData.nodes);
                  })
                  .catch(() => {
                    // silent refresh failure
                  });

                getTurns(projectId)
                  .then((response) => {
                    setTurns(response.turns);
                    const transcript: ChatMessage[] = response.turns.flatMap((turn) => [
                      {
                        id: generateId(),
                        role: 'user',
                        content: turn.userText,
                        timestamp: new Date(turn.createdAt),
                        agentId: selectedAgent.id,
                        turnId: turn.turnId,
                        nodeId: turn.nodeId ?? undefined
                      },
                      {
                        id: generateId(),
                        role: 'assistant',
                        content: turn.assistantText,
                        timestamp: new Date(turn.createdAt),
                        agentId: selectedAgent.id,
                        turnId: turn.turnId,
                        nodeId: turn.nodeId ?? undefined
                      }
                    ]);
                    setInitialMessages(transcript);

                    if (pendingSessionId && response.turns.length > 0) {
                      const firstNew = response.turns.find(
                        (turn) => turn.turnId === payload.turnId
                      );
                      if (firstNew) {
                        const nextSession = {
                          id: pendingSessionId,
                          projectId,
                          startTurnId: firstNew.turnId,
                          createdAt: firstNew.createdAt
                        };
                        const nextSessions = [nextSession, ...sessions].slice(0, 50);
                        setSessions(nextSessions);
                        persistSessions(nextSessions);
                        setCurrentSessionId(nextSession.id);
                        setPendingSessionId(null);
                      }
                    }
                  })
                  .catch(() => {
                    // silent refresh failure
                  });

                if (payload.nodeId) {
                  // session persistence handled via turns + session markers
                }
              }}
            />
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
                {Object.entries(
                  graphNodes.reduce<Record<string, number>>((acc, node) => {
                    acc[node.category] = (acc[node.category] ?? 0) + 1;
                    return acc;
                  }, {})
                )
                  .slice(0, 3)
                  .map(([cat, count]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                  >
                    <span className="text-xs text-white/70">{cat}</span>
                    <span className="text-xs text-white/40">{count} memories</span>
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
