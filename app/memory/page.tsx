'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, Grid3X3, List, Search, Command, Sparkles, Filter } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MemoryGraph } from '@/components/memory/MemoryGraph';
import { TimelineView } from '@/components/memory/TimelineView';
import { SpotlightSearch, SpotlightTrigger } from '@/components/memory/SpotlightSearch';
import { ViewMode, GraphNode, CATEGORY_COLORS } from '@/types/nexus';
import { graphData, mockInsights, mockClusters } from '@/lib/mockData';
import { cn } from '@/lib/utils';

export default function MemoryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('categorical');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleNodeSelect = useCallback((node: GraphNode | null) => {
    setSelectedNodeId(node?.id || null);
  }, []);

  // Filter nodes by selected categories
  const filteredData = {
    ...graphData,
    nodes: selectedCategories.length > 0
      ? graphData.nodes.filter((node) => selectedCategories.includes(node.category))
      : graphData.nodes,
  };

  const categories = Object.keys(CATEGORY_COLORS);

  return (
    <MainLayout>
      {/* Mobile: full height minus bottom nav (80px), Desktop: full height minus top nav (64px) */}
      <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] flex flex-col overflow-hidden">
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
                  {graphData.nodes.length} memories
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
          <div className="flex-1 p-2 md:p-4">
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

          {/* AI Insights sidebar - hidden on mobile */}
          <div className="hidden md:block w-80 flex-shrink-0 p-4 border-l border-white/10">
            <div className="h-full overflow-y-auto space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">AI Insights</h2>
              </div>

              <div className="space-y-3">
                {mockInsights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs rounded-full capitalize',
                          insight.type === 'pattern' && 'bg-purple-500/20 text-purple-400',
                          insight.type === 'growth' && 'bg-emerald-500/20 text-emerald-400',
                          insight.type === 'connection' && 'bg-cyan-500/20 text-cyan-400',
                          insight.type === 'prediction' && 'bg-yellow-500/20 text-yellow-400',
                          insight.type === 'preference' && 'bg-pink-500/20 text-pink-400'
                        )}
                      >
                        {insight.type}
                      </span>
                      <span className="text-xs text-white/30 ml-auto">
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1">
                      {insight.title}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-3">
                      {insight.description}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-xs text-white/30">
                        {insight.relatedMemoryIds.length} related memories
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick stats */}
              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white mb-3">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Total Memories</span>
                    <span className="text-white">{graphData.nodes.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Categories</span>
                    <span className="text-white">{categories.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">AI Insights</span>
                    <span className="text-white">{mockInsights.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Projects</span>
                    <span className="text-white">
                      {new Set(graphData.nodes.filter((n) => n.project).map((n) => n.project)).size}
                    </span>
                  </div>
                </div>
              </div>
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
      />
    </MainLayout>
  );
}
