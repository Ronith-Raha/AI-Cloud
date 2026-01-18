'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, Grid3X3, List, Search, Command, Sparkles, Filter, PanelRightClose, PanelRightOpen } from 'lucide-react';
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
  const [insightsOpen, setInsightsOpen] = useState(true);

  // ========== MOCK DATA FOR TESTING (DO NOT COMMIT) ==========
  const MOCK_GRAPH_DATA: GraphData = {
    nodes: [
      {
        id: '1',
        content: 'User prefers TypeScript over JavaScript for larger projects due to type safety',
        summary: 'Prefers TypeScript for large projects',
        type: 'preference',
        importance: 'high',
        category: 'Tech',
        subcategory: 'Programming Languages',
        project: 'Web Development',
        tags: ['typescript', 'javascript', 'programming'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        sourceAgent: 'claude',
        relatedMemories: ['2', '3'],
        radius: 35,
        depth: 2,
        metadata: { confidence: 0.95, sentiment: 'positive' },
      },
      {
        id: '2',
        content: 'Working on a React-based memory visualization dashboard with D3.js force graphs',
        summary: 'Building memory visualization dashboard',
        type: 'project',
        importance: 'critical',
        category: 'Tech',
        subcategory: 'Web Development',
        project: 'Nexus Cloud',
        tags: ['react', 'd3', 'visualization', 'dashboard'],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        sourceAgent: 'claude',
        relatedMemories: ['1', '4'],
        radius: 40,
        depth: 2,
        metadata: { confidence: 0.98, sentiment: 'positive' },
      },
      {
        id: '3',
        content: 'Enjoys learning about machine learning and neural networks in free time',
        summary: 'Interested in ML/AI learning',
        type: 'preference',
        importance: 'medium',
        category: 'Learning',
        subcategory: 'AI/ML',
        tags: ['machine-learning', 'ai', 'neural-networks'],
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-12'),
        sourceAgent: 'claude',
        relatedMemories: ['1'],
        radius: 30,
        depth: 2,
        metadata: { confidence: 0.85, sentiment: 'positive' },
      },
      {
        id: '4',
        content: 'Uses Tailwind CSS as the primary styling solution for rapid UI development',
        summary: 'Uses Tailwind CSS for styling',
        type: 'fact',
        importance: 'medium',
        category: 'Tech',
        subcategory: 'CSS Frameworks',
        project: 'Web Development',
        tags: ['tailwind', 'css', 'styling', 'ui'],
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-08'),
        sourceAgent: 'claude',
        relatedMemories: ['2'],
        radius: 28,
        depth: 2,
        metadata: { confidence: 0.9, sentiment: 'neutral' },
      },
      {
        id: '5',
        content: 'Practices meditation every morning for 20 minutes to improve focus',
        summary: 'Daily morning meditation practice',
        type: 'preference',
        importance: 'high',
        category: 'Health',
        subcategory: 'Mental Health',
        tags: ['meditation', 'mindfulness', 'routine'],
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
        sourceAgent: 'claude',
        relatedMemories: ['6'],
        radius: 32,
        depth: 2,
        metadata: { confidence: 0.92, sentiment: 'positive' },
      },
      {
        id: '6',
        content: 'Currently reading "Atomic Habits" by James Clear for productivity improvement',
        summary: 'Reading Atomic Habits book',
        type: 'fact',
        importance: 'low',
        category: 'Personal',
        subcategory: 'Books',
        tags: ['books', 'productivity', 'habits'],
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-14'),
        sourceAgent: 'claude',
        relatedMemories: ['5'],
        radius: 25,
        depth: 2,
        metadata: { confidence: 0.88, sentiment: 'positive' },
      },
      {
        id: '7',
        content: 'Working on a side project to build an AI-powered note-taking app',
        summary: 'Building AI note-taking app',
        type: 'project',
        importance: 'high',
        category: 'Work',
        subcategory: 'Side Projects',
        project: 'AI Notes',
        tags: ['ai', 'notes', 'productivity', 'side-project'],
        createdAt: new Date('2024-01-11'),
        updatedAt: new Date('2024-01-17'),
        sourceAgent: 'claude',
        relatedMemories: ['3', '2'],
        radius: 36,
        depth: 2,
        metadata: { confidence: 0.91, sentiment: 'positive' },
      },
      {
        id: '8',
        content: 'Prefers dark mode interfaces across all applications and IDEs',
        summary: 'Prefers dark mode UI',
        type: 'preference',
        importance: 'medium',
        category: 'Tech',
        subcategory: 'UI Preferences',
        tags: ['dark-mode', 'ui', 'preferences'],
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
        sourceAgent: 'claude',
        relatedMemories: ['4'],
        radius: 26,
        depth: 2,
        metadata: { confidence: 0.95, sentiment: 'neutral' },
      },
      {
        id: '9',
        content: 'Learning Rust programming language for systems programming',
        summary: 'Learning Rust language',
        type: 'skill',
        importance: 'medium',
        category: 'Learning',
        subcategory: 'Programming',
        tags: ['rust', 'systems-programming', 'learning'],
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
        sourceAgent: 'claude',
        relatedMemories: ['1', '3'],
        radius: 30,
        depth: 2,
        metadata: { confidence: 0.78, sentiment: 'positive' },
      },
      {
        id: '10',
        content: 'Has a weekly call with the design team every Tuesday at 2pm',
        summary: 'Weekly design team meeting',
        type: 'fact',
        importance: 'low',
        category: 'Work',
        subcategory: 'Meetings',
        tags: ['meetings', 'design', 'schedule'],
        createdAt: new Date('2024-01-09'),
        updatedAt: new Date('2024-01-09'),
        sourceAgent: 'claude',
        relatedMemories: [],
        radius: 22,
        depth: 2,
        metadata: { confidence: 0.99, sentiment: 'neutral' },
      },
      {
        id: '11',
        content: 'Enjoys hiking on weekends, especially mountain trails',
        summary: 'Weekend hiking hobby',
        type: 'preference',
        importance: 'medium',
        category: 'Personal',
        subcategory: 'Hobbies',
        tags: ['hiking', 'outdoors', 'weekends'],
        createdAt: new Date('2024-01-07'),
        updatedAt: new Date('2024-01-07'),
        sourceAgent: 'claude',
        relatedMemories: ['5'],
        radius: 28,
        depth: 2,
        metadata: { confidence: 0.87, sentiment: 'positive' },
      },
      {
        id: '12',
        content: 'Invested in a diversified portfolio of index funds and some tech stocks',
        summary: 'Investment in index funds and tech',
        type: 'fact',
        importance: 'high',
        category: 'Finance',
        subcategory: 'Investments',
        tags: ['investing', 'stocks', 'index-funds'],
        createdAt: new Date('2024-01-04'),
        updatedAt: new Date('2024-01-04'),
        sourceAgent: 'claude',
        relatedMemories: [],
        radius: 34,
        depth: 2,
        metadata: { confidence: 0.82, sentiment: 'neutral' },
      },
    ],
    links: [
      { source: '1', target: '2', strength: 0.8, type: 'semantic' },
      { source: '1', target: '3', strength: 0.6, type: 'semantic' },
      { source: '2', target: '4', strength: 0.7, type: 'project' },
      { source: '3', target: '7', strength: 0.75, type: 'semantic' },
      { source: '5', target: '6', strength: 0.5, type: 'semantic' },
      { source: '5', target: '11', strength: 0.4, type: 'category' },
      { source: '7', target: '2', strength: 0.65, type: 'semantic' },
      { source: '8', target: '4', strength: 0.55, type: 'category' },
      { source: '9', target: '1', strength: 0.7, type: 'semantic' },
      { source: '9', target: '3', strength: 0.6, type: 'category' },
      { source: '1', target: '8', strength: 0.5, type: 'category' },
    ],
    clusters: [],
  };
  // ========== END MOCK DATA ==========

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
    // ========== USING MOCK DATA FOR TESTING (DO NOT COMMIT) ==========
    setIsLoading(true);
    // Simulate a small delay like a real API call
    setTimeout(() => {
      setGraphData(MOCK_GRAPH_DATA);
      setLoadError(null);
      setIsLoading(false);
    }, 300);
    return () => {};
    // ========== ORIGINAL API CALL (UNCOMMENT WHEN DONE TESTING) ==========
    // let isActive = true;
    // if (!projectId) return () => {};
    // setIsLoading(true);
    // getGraphView(projectId, 0, 50, false)
    //   .then((view) => {
    //     if (!isActive) return;
    //     setGraphData(mapGraphViewToGraphData(view));
    //     setLoadError(null);
    //   })
    //   .catch((error) => {
    //     if (!isActive) return;
    //     setLoadError(error instanceof Error ? error.message : 'Failed to load graph');
    //   })
    //   .finally(() => {
    //     if (!isActive) return;
    //     setIsLoading(false);
    //   });
    // return () => {
    //   isActive = false;
    // };
  }, [MOCK_GRAPH_DATA]);

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
          <motion.div
            initial={false}
            animate={{ width: insightsOpen ? 256 : 48 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex-shrink-0 border-l border-white/10 overflow-hidden"
          >
            <div className="h-full flex flex-col p-4">
              {/* Header with toggle */}
              <div className="flex items-center justify-between mb-4">
                <AnimatePresence mode="wait">
                  {insightsOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h2 className="text-lg font-semibold text-white whitespace-nowrap">AI Insights</h2>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setInsightsOpen((prev) => !prev)}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title={insightsOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  {insightsOpen ? (
                    <PanelRightClose className="w-5 h-5" />
                  ) : (
                    <PanelRightOpen className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Content - only show when open */}
              <AnimatePresence>
                {insightsOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 overflow-y-auto space-y-4"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
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
