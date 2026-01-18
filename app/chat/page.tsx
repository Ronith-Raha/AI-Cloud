'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, History, Sparkles, Brain } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AgentSelectorCompact } from '@/components/chat/AgentSelector';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Agent, ChatMessage, GraphNode } from '@/types/nexus';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROVIDER_MODELS, agents as baseAgents } from '@/lib/agents';
import { formatRelativeTime, generateId } from '@/lib/utils';
import { useProjectId } from '@/lib/hooks/useProjectId';
import { getGraphNode, getGraphView } from '@/lib/api/client';
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
  const [recentChats, setRecentChats] = useState<Array<{
    nodeId: string;
    title: string;
    timestamp: string;
    projectId: string;
  }>>([]);
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
    const raw = window.localStorage.getItem('nexus_recent_chats');
    if (!raw) {
      setRecentChats([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Array<{
        nodeId: string;
        title: string;
        timestamp: string;
        projectId: string;
      }>;
      setRecentChats(parsed.filter((item) => item.projectId === projectId));
    } catch {
      setRecentChats([]);
    }
  }, [projectId]);

  const persistRecentChats = (items: Array<{
    nodeId: string;
    title: string;
    timestamp: string;
    projectId: string;
  }>) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('nexus_recent_chats', JSON.stringify(items));
  };

  const recentConversations = useMemo(() => {
    if (recentChats.length > 0) {
      return recentChats
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)
        .map((item) => ({
          id: item.nodeId,
          title: item.title,
          agent: selectedAgent,
          timestamp: new Date(item.timestamp)
        }));
    }

    return [...realNodes]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((node) => ({
        id: node.id,
        title: node.summary,
        agent: selectedAgent,
        timestamp: node.createdAt
      }));
  }, [recentChats, realNodes, selectedAgent]);

  const agentMemories = useMemo(() => realNodes.slice(0, 5), [realNodes]);

  const handleSelectConversation = async (nodeId: string, title: string) => {
    const isUuid = /^[0-9a-f-]{36}$/i.test(nodeId);
    const resolveAndOpen = async (resolvedId: string) => {
      const detail = await getGraphNode(resolvedId);
      setInitialMessages([
        {
          id: generateId(),
          role: 'user',
          content: detail.turn.userText,
          timestamp: new Date(detail.turn.createdAt),
          agentId: selectedAgent.id
        },
        {
          id: generateId(),
          role: 'assistant',
          content: detail.turn.assistantText,
          timestamp: new Date(detail.turn.createdAt),
          agentId: selectedAgent.id,
          turnId: detail.turn.id,
          nodeId: detail.node.id
        }
      ]);
      setSelectedTurnError(null);
      setChatSessionKey((prev) => prev + 1);
    };

    try {
      if (!isUuid) {
        throw new Error('Invalid conversation id');
      }
      await resolveAndOpen(nodeId);
    } catch (error) {
      try {
        if (!projectId) {
          throw error;
        }
        const view = await getGraphView(projectId, 0, 50);
        const graphData = mapGraphViewToGraphData(view);
        const match = graphData.nodes.find((node) => node.summary === title);
        if (match && /^[0-9a-f-]{36}$/i.test(match.id)) {
          await resolveAndOpen(match.id);
          return;
        }
      } catch {
        // fall through to error handling
      }
      setSelectedTurnError(
        error instanceof Error ? error.message : 'Failed to load conversation'
      );
    }
  };

  const handleNewConversation = () => {
    setInitialMessages(null);
    setSelectedTurnError(null);
    setChatSessionKey((prev) => prev + 1);
  };

  return (
    <MainLayout memoryCount={realNodes.length}>
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
                    onClick={() => handleSelectConversation(conv.id, conv.title)}
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
                    {selectedAgent.memoryCount} memories
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

                getGraphNode(payload.nodeId)
                  .then((detail) => {
                    const entry = {
                      nodeId: payload.nodeId,
                      title: detail.turn.userText || payload.userText || 'Conversation',
                      timestamp: detail.turn.createdAt,
                      projectId
                    };
                    setRecentChats((prev) => {
                      const next = [entry, ...prev.filter((item) => item.nodeId !== entry.nodeId)]
                        .slice(0, 20);
                      persistRecentChats(next);
                      return next;
                    });
                  })
                  .catch(() => {
                    const entry = {
                      nodeId: payload.nodeId,
                      title: payload.userText || 'Conversation',
                      timestamp: new Date().toISOString(),
                      projectId
                    };
                    setRecentChats((prev) => {
                      const next = [entry, ...prev.filter((item) => item.nodeId !== entry.nodeId)]
                        .slice(0, 20);
                      persistRecentChats(next);
                      return next;
                    });
                  });
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
