'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageSquare, History, Sparkles } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AgentSelectorCompact } from '@/components/chat/AgentSelector';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Agent, ChatMessage, GraphNode } from '@/types/nexus';
import type { TurnTranscriptItem } from '@/lib/api/types';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROVIDER_MODELS, agents as baseAgents } from '@/lib/agents';
import { formatRelativeTime, generateId } from '@/lib/utils';
import { useProjectId } from '@/lib/hooks/useProjectId';
import { createProject, getGraphView, getTurns, listProjects } from '@/lib/api/client';
import { mapGraphViewToGraphData } from '@/lib/api/graph';

export default function ChatPage() {
  const { projectId } = useProjectId();
  const searchParams = useSearchParams();
  const [selectedAgent, setSelectedAgent] = useState<Agent>(baseAgents[0]);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; createdAt: string }>>([]);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>(DEFAULT_PROVIDER);
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [chatSessionKey, setChatSessionKey] = useState(0);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[] | null>(null);
  const [selectedTurnError, setSelectedTurnError] = useState<string | null>(null);
  const [turns, setTurns] = useState<TurnTranscriptItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projectId ?? null);
  const [focusTurnId, setFocusTurnId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [projectTitles, setProjectTitles] = useState<Record<string, string>>({});
  const [emptyProjects, setEmptyProjects] = useState<Record<string, boolean>>({});
  const [projectListReady, setProjectListReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setActiveProjectId(projectId);
  }, [projectId]);

  useEffect(() => {
    const turnId = searchParams.get('turnId');
    if (turnId) {
      setFocusTurnId(turnId);
    }
  }, [searchParams]);

  const refreshProjects = async () => {
    setProjectListReady(false);
    try {
      const response = await listProjects();
      setProjects(response.projects);
      const checks = await Promise.allSettled(
        response.projects.map((project) => getTurns(project.id, 1))
      );
      const nextEmpty: Record<string, boolean> = {};
      checks.forEach((result, index) => {
        const project = response.projects[index];
        if (result.status === 'fulfilled') {
          if (result.value.turns.length === 0) {
            nextEmpty[project.id] = true;
          }
        }
      });
      setEmptyProjects(nextEmpty);
    } catch {
      setProjects([]);
      setEmptyProjects({});
    } finally {
      setProjectListReady(true);
    }
  };

  useEffect(() => {
    void refreshProjects();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem('nexus_project_titles');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      setProjectTitles(parsed);
    } catch {
      setProjectTitles({});
    }
  }, []);

  const persistProjectTitles = (next: Record<string, string>) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('nexus_project_titles', JSON.stringify(next));
  };

  const loadGraph = (id: string) => {
    setIsLoadingGraph(true);
    getGraphView(id, 0, 50)
      .then((view) => {
        const graphData = mapGraphViewToGraphData(view);
        setGraphNodes(graphData.nodes);
        setGraphError(null);
      })
      .catch((error) => {
        setGraphError(error instanceof Error ? error.message : 'Failed to load graph');
      })
      .finally(() => {
        setIsLoadingGraph(false);
      });
  };

  const loadTurns = (id: string) => {
    getTurns(id)
      .then((response) => {
        setTurns(response.turns);
        setEmptyProjects((prev) => {
          const next = { ...prev };
          if (response.turns.length === 0) {
            next[id] = true;
          } else {
            delete next[id];
          }
          return next;
        });
        if (response.turns.length > 0) {
          const firstUserText = response.turns[0]?.userText?.trim();
          if (firstUserText) {
            setProjectTitles((prev) => {
              if (prev[id]) return prev;
              const next = { ...prev, [id]: firstUserText };
              persistProjectTitles(next);
              return next;
            });
          }
        }
        const transcript: ChatMessage[] = response.turns.flatMap((turn) => [
          {
            id: generateId(),
            role: 'user',
            content: turn.userText,
            timestamp: new Date(turn.createdAt),
            agentId: selectedAgent.id,
            turnId: turn.turnId
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
      })
      .catch(() => {
        setInitialMessages([]);
      });
  };

  useEffect(() => {
    if (!activeProjectId) return;
    loadGraph(activeProjectId);
    loadTurns(activeProjectId);
  }, [activeProjectId, selectedAgent.id]);

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
    if (selectedAgent.provider === provider && selectedAgent.model === model) return;
    const next = agents.find((agent) => agent.id === selectedAgent.id) ?? agents[0];
    if (next) {
      setSelectedAgent(next);
    }
  }, [agents, provider, model, selectedAgent.id, selectedAgent.provider, selectedAgent.model]);

  const handleSelectProject = (id: string) => {
    setSelectedTurnError(null);
    setActiveProjectId(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('nexus_project_id', id);
    }
    setChatSessionKey((prev) => prev + 1);
  };

  const handleNewConversation = async () => {
    try {
      const created = await createProject('Conversation');
      setActiveProjectId(created.projectId);
      setEmptyProjects((prev) => ({ ...prev, [created.projectId]: true }));
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('nexus_project_id', created.projectId);
      }
      setInitialMessages([]);
      setTurns([]);
      setGraphNodes([]);
      setSelectedTurnError(null);
      setChatSessionKey((prev) => prev + 1);
      await refreshProjects();
    } catch (error) {
      setSelectedTurnError(error instanceof Error ? error.message : 'Failed to create project');
    }
  };

  const recentProjects = useMemo(() => {
    const ordered = projects
      .filter((project) => project.name !== 'Local Project')
      .filter((project) => !emptyProjects[project.id] || project.id === activeProjectId)
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return ordered.map((project, index) => {
      const explicitTitle = projectTitles[project.id];
      const isGeneric = project.name === 'Conversation' || !project.name;
      const fallback = isGeneric ? `Chat ${index + 1}` : project.name;
      return {
        ...project,
        displayName: explicitTitle || fallback
      };
    });
  }, [projects, projectTitles, emptyProjects, activeProjectId]);

  return (
    <MainLayout>
      {/* Mobile: full height minus bottom nav (80px), Desktop: full height minus top nav (64px) */}
      <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] flex flex-col md:flex-row">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden md:flex w-80 flex-shrink-0 border-r border-white/10 flex-col">
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
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-medium hover:opacity-90 transition-all duration-200 ease-out active:scale-[0.99]"
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
              {projectListReady ? (
                recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelectProject(project.id)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-all duration-200 ease-out text-left"
                  >
                    <span className="text-lg flex-shrink-0">{selectedAgent.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{project.displayName}</p>
                      <p className="text-xs text-white/40">
                        {formatRelativeTime(new Date(project.createdAt))}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-white/40 px-2">
                  {isLoadingGraph ? 'Loading conversations…' : 'No conversations yet.'}
                </p>
              )
              ) : (
                <p className="text-xs text-white/40 px-2">
                  Loading conversations…
                </p>
              )}
            </div>
            {selectedTurnError && (
              <p className="mt-2 text-xs text-rose-400">{selectedTurnError}</p>
            )}
          </div>

          {graphError && (
            <div className="p-4 border-t border-white/10">
              <p className="text-xs text-rose-400">
                {graphError}
              </p>
            </div>
          )}
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat header - compact on mobile */}
          <div className="flex-shrink-0 p-3 md:p-4 border-b border-white/10">
            <div className="flex items-center gap-2 md:gap-4">
              <div
                className="p-2 md:p-3 rounded-xl border border-white/10"
                style={{ backgroundColor: `${selectedAgent.color}20` }}
              >
                <span className="text-xl md:text-2xl">{selectedAgent.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base md:text-lg font-semibold text-white truncate">
                  {selectedAgent.name}
                </h2>
                <p className="text-xs md:text-sm text-white/50 truncate">{selectedAgent.description}</p>
              </div>
              <div className="hidden sm:flex items-center gap-4">
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
              {/* Mobile: just show active status */}
              <div className="sm:hidden flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            {/* Capabilities + model switching */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
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
              projectId={activeProjectId}
              memoryNodes={realNodes}
              initialMessages={initialMessages ?? undefined}
              targetTurnId={focusTurnId}
              onTurnFocusHandled={() => setFocusTurnId(null)}
              onTurnComplete={(payload) => {
                if (!activeProjectId) return;
                loadGraph(activeProjectId);
                loadTurns(activeProjectId);
                setEmptyProjects((prev) => {
                  const next = { ...prev };
                  delete next[activeProjectId];
                  return next;
                });

                if (payload.userText) {
                  setProjectTitles((prev) => {
                    if (prev[activeProjectId]) return prev;
                    const next = { ...prev, [activeProjectId]: payload.userText };
                    persistProjectTitles(next);
                    return next;
                  });
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

