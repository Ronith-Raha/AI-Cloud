'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, Grid3X3, Filter, Sparkles } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MemoryGraph } from '@/components/memory/MemoryGraph';
import { TimelineView } from '@/components/memory/TimelineView';
import { SpotlightSearch, SpotlightTrigger } from '@/components/memory/SpotlightSearch';
import { NodeDetailPanel } from '@/components/memory/NodeDetailPanel';
import { ViewMode, GraphData, GraphNode, CATEGORY_COLORS } from '@/types/nexus';
import { cn } from '@/lib/utils';
import { useProjectId } from '@/lib/hooks/useProjectId';
import { getGraph, getNode } from '@/lib/api/client';
import { mapGraphViewToGraphData } from '@/lib/api/graph';

const EMPTY_GRAPH: GraphData = { nodes: [], links: [], clusters: [] };

export default function MemoryPage() {
  const { projectId } = useProjectId();
  const [viewMode, setViewMode] = useState<ViewMode>('categorical');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [graphData, setGraphData] = useState<GraphData>(EMPTY_GRAPH);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [clickDebug, setClickDebug] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    getGraph(projectId, 200)
      .then((view) => {
        const data = mapGraphViewToGraphData(view);
        setGraphData(data);
        setGraphError(null);
      })
      .catch((error) => {
        setGraphError(error instanceof Error ? error.message : 'Failed to load graph');
        setGraphData(EMPTY_GRAPH);
      });
  }, [projectId]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleNodeSelect = useCallback((node: GraphNode | null) => {
    setSelectedNodeId(node?.id || null);
    if (process.env.NODE_ENV !== 'production' && node?.id) {
      // eslint-disable-next-line no-console
      console.info('[memory-graph] selectNode', {
        nodeId: node.id,
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'}/api/graph/node/${node.id}`,
      });
    }
  }, []);

  const handleNodeUpdated = useCallback(() => {
    if (!projectId) return;
    getGraph(projectId, 200)
      .then((view) => {
        const data = mapGraphViewToGraphData(view);
        setGraphData(data);
        setGraphError(null);
      })
      .catch((error) => {
        setGraphError(error instanceof Error ? error.message : 'Failed to load graph');
      });
  }, [projectId]);

  const handleNodeMutation = useCallback(
    async (nodeId: string, options?: { deleted?: boolean }) => {
      if (!projectId) return;
      setActionError(null);
      try {
        const view = await getGraph(projectId, 200);
        const data = mapGraphViewToGraphData(view);
        setGraphData(data);
        if (options?.deleted) {
          setSelectedNodeId(null);
          return;
        }
        await getNode(nodeId);
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Failed to update memory');
      }
    },
    [projectId]
  );

  const filteredData: GraphData = {
    ...graphData,
    nodes:
      selectedCategories.length > 0
        ? graphData.nodes.filter((node) => selectedCategories.includes(node.category))
        : graphData.nodes,
  };

  const categories = Object.keys(CATEGORY_COLORS);
  const selectedNode = graphData.nodes.find((node) => node.id === selectedNodeId) ?? null;

  useEffect(() => {
    if (!selectedNode) return;
    const handler = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      const id = target.id ? `#${target.id}` : '';
      const className =
        typeof target.className === 'string' && target.className.length > 0
          ? `.${target.className.split(/\s+/).slice(0, 3).join('.')}`
          : '';
      const role = target.getAttribute('role');
      const label = target.getAttribute('aria-label');
      const info = [
        `target: ${tag}${id}${className}`,
        role ? `role=${role}` : null,
        label ? `aria-label=${label}` : null
      ]
        .filter(Boolean)
        .join(' ');
      setClickDebug(info);
      // eslint-disable-next-line no-console
      console.debug('[memory-click]', info);
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [selectedNode]);

  return (
    <MainLayout>
      {/* Mobile: full height minus bottom nav (80px), Desktop: full height minus top nav (64px) */}
      <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] flex flex-col overflow-hidden relative">
        {/* Header - compact on mobile */}
        <div className="flex-shrink-0 px-3 md:px-6 py-2 md:py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-1.5 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10">
                <Brain className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-white">Memory</h1>
                <p className="text-[10px] md:text-sm text-white/50">
                  {graphData.nodes.filter((node) => !node.isGroup).length} memories
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {/* Search trigger */}
              <SpotlightTrigger onClick={() => setIsSearchOpen(true)} />

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-2 px-3 md:px-4 py-2 border rounded-xl transition-colors',
                  showFilters
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm hidden md:inline">Filters</span>
                {selectedCategories.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
                    {selectedCategories.length}
                  </span>
                )}
              </button>

              {/* View mode toggle - hidden on mobile (mobile always shows timeline) */}
              <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('categorical')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    viewMode === 'categorical'
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:text-white'
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span>Brain</span>
                </button>
                <button
                  onClick={() => setViewMode('chronological')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    viewMode === 'chronological'
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:text-white'
                  )}
                >
                  <Clock className="w-4 h-4" />
                  <span>Timeline</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const isSelected = selectedCategories.includes(category);
                    const color = CATEGORY_COLORS[category];

                    return (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategories((prev) =>
                            isSelected
                              ? prev.filter((c) => c !== category)
                              : [...prev, category]
                          );
                        }}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all',
                          isSelected
                            ? 'bg-white/10 border-white/20'
                            : 'bg-transparent border-white/10 hover:bg-white/5'
                        )}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color.base }}
                        />
                        <span className={cn('text-sm', isSelected ? 'text-white' : 'text-white/60')}>
                          {category}
                        </span>
                      </button>
                    );
                  })}
                  {selectedCategories.length > 0 && (
                    <button
                      onClick={() => setSelectedCategories([])}
                      className="px-3 py-1.5 text-sm text-white/40 hover:text-white transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex min-h-0">
          {/* Visualization area */}
          <div className={cn('flex-1 p-2 md:p-4', selectedNode ? 'pointer-events-none' : '')}>
            {/* Mobile: Always show timeline */}
            <div className="md:hidden h-full">
              <TimelineView
                nodes={filteredData.nodes}
                searchQuery={searchQuery}
                onNodeSelect={handleNodeSelect}
                selectedNodeId={selectedNodeId}
              />
            </div>

            {/* Desktop: Show based on viewMode */}
            <div className="hidden md:block h-full">
              <AnimatePresence mode="wait">
                {viewMode === 'categorical' ? (
                  <motion.div
                    key="categorical"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <MemoryGraph
                      data={filteredData}
                      searchQuery={searchQuery}
                      onNodeSelect={handleNodeSelect}
                      selectedNodeId={selectedNodeId}
                      onNodeUpdated={handleNodeUpdated}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="chronological"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <TimelineView
                      nodes={filteredData.nodes}
                      searchQuery={searchQuery}
                      onNodeSelect={handleNodeSelect}
                      selectedNodeId={selectedNodeId}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Insights sidebar */}
          <div className="hidden md:block w-80 flex-shrink-0 p-4 border-l border-white/10">
            <div className="h-full overflow-y-auto space-y-4">
              {clickDebug && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60">
                  Last click: {clickDebug}
                </div>
              )}
              {actionError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  {actionError}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Insights</h2>
              </div>
              {graphError ? (
                <p className="text-xs text-rose-400">{graphError}</p>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/60">
                    Insights will appear as your memory graph grows.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedNode && (
            <div className="fixed inset-0 z-[90] pointer-events-none">
            <NodeDetailPanel
                node={selectedNode}
              projectId={projectId ?? null}
                onClose={() => setSelectedNodeId(null)}
                onNodeUpdated={handleNodeMutation}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      <SpotlightSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleSearch}
        onSelectNode={(node) => handleNodeSelect(node)}
        nodes={graphData.nodes}
      />
    </MainLayout>
  );
}

