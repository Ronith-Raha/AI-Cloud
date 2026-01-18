'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, Grid3X3, List, Search, Command, Sparkles, Filter, EyeOff } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MemoryGraph } from '@/components/memory/MemoryGraph';
import { TimelineView } from '@/components/memory/TimelineView';
import { SpotlightSearch, SpotlightTrigger } from '@/components/memory/SpotlightSearch';
import { ViewMode, GraphNode, GraphData, CATEGORY_COLORS } from '@/types/nexus';
import { cn } from '@/lib/utils';
import { useProjectId } from '@/lib/hooks/useProjectId';
import { getGraphView } from '@/lib/api/client';
import { mapGraphViewToGraphData } from '@/lib/api/graph';
import { useSearchParams } from 'next/navigation';

export default function MemoryPage() {
  const { projectId } = useProjectId();
  const searchParams = useSearchParams();
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
    clusters: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('categorical');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshGraph = useCallback(() => {
    let isActive = true;
    if (!projectId) return () => {};
    setIsLoading(true);
    getGraphView(projectId, 0, 50, showDeleted)
      .then((view) => {
        if (!isActive) return;
        setGraphData(mapGraphViewToGraphData(view));
        setLoadError(null);
      })
      .catch((error) => {
        if (!isActive) return;
        setLoadError(error instanceof Error ? error.message : 'Failed to load graph');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [projectId, showDeleted]);

  useEffect(() => refreshGraph(), [refreshGraph]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleNodeSelect = useCallback((node: GraphNode | null) => {
    setSelectedNodeId(node?.id || null);
  }, []);

  useEffect(() => {
    const nodeId = searchParams.get('nodeId');
    if (!nodeId) return;
    const exists = graphData.nodes.some((node) => node.id === nodeId);
    if (exists) {
      setSelectedNodeId(nodeId);
    }
  }, [searchParams, graphData.nodes]);

  // Filter nodes by selected categories
  const filteredData = {
    ...graphData,
    nodes: selectedCategories.length > 0
      ? graphData.nodes.filter((node: GraphNode) => selectedCategories.includes(node.category))
      : graphData.nodes,
  };

  const categories = Object.keys(CATEGORY_COLORS);

  return (
    <MainLayout memoryCount={graphData.nodes.filter((node) => !node.isGroup).length}>
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Memory Cloud</h1>
                <p className="text-sm text-white/50">
                  {graphData.nodes.filter((node) => !node.isGroup).length} memories
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search trigger */}
              <SpotlightTrigger onClick={() => setIsSearchOpen(true)} />

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 border rounded-xl transition-colors',
                  showFilters
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filters</span>
                {selectedCategories.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">
                    {selectedCategories.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowDeleted((prev) => !prev)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 border rounded-xl transition-colors',
                  showDeleted
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                <EyeOff className="w-4 h-4" />
                <span className="text-sm">{showDeleted ? 'Hide deleted' : 'Show deleted'}</span>
              </button>

              {/* View mode toggle */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
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
                className="max-w-7xl mx-auto mt-4 overflow-hidden"
              >
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const isSelected = selectedCategories.includes(category);
                    const color = CATEGORY_COLORS[category];

                    return (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategories((prev: string[]) =>
                            isSelected
                              ? prev.filter((c: string) => c !== category)
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
          <div className="flex-1 p-4">
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
                    onNodeUpdated={refreshGraph}
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
                    nodes={filteredData.nodes.filter((node) => !node.isGroup)}
                    searchQuery={searchQuery}
                    onNodeSelect={handleNodeSelect}
                    selectedNodeId={selectedNodeId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Insights sidebar */}
          <div className="w-80 flex-shrink-0 p-4 border-l border-white/10">
            <div className="h-full overflow-y-auto space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">AI Insights</h2>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50">
                    Insights will appear here as your graph grows.
                  </p>
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white mb-3">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Total Memories</span>
                    <span className="text-white">
                      {graphData.nodes.filter((node) => !node.isGroup).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Categories</span>
                    <span className="text-white">
                      {new Set(
                        graphData.nodes.filter((n) => !n.isGroup).map((n: GraphNode) => n.category)
                      ).size}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">AI Insights</span>
                    <span className="text-white">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Projects</span>
                    <span className="text-white">
                      {new Set(
                        graphData.nodes
                          .filter((n: GraphNode) => !n.isGroup && n.project)
                          .map((n: GraphNode) => n.project)
                      ).size}
                    </span>
                  </div>
                </div>
              </div>
              {isLoading && (
                <p className="text-xs text-white/40">Loading graph...</p>
              )}
              {loadError && (
                <p className="text-xs text-rose-400">{loadError}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spotlight Search */}
      <SpotlightSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleSearch}
        onSelectNode={handleNodeSelect}
        nodes={graphData.nodes.filter((node) => !node.isGroup)}
      />
    </MainLayout>
  );
}
