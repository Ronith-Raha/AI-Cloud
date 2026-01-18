'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight, Sparkles, TrendingUp, X } from 'lucide-react';
import { GraphNode, CATEGORY_COLORS, AIInsight } from '@/types/nexus';
import { mockInsights } from '@/lib/mockData';
import { formatRelativeTime, cn } from '@/lib/utils';

interface TimelineViewProps {
  nodes: GraphNode[];
  searchQuery: string;
  onNodeSelect: (node: GraphNode | null) => void;
  selectedNodeId: string | null;
}

interface TimelineGroup {
  date: string;
  month: string;
  year: number;
  nodes: GraphNode[];
}

// Animated line chart component for insight graphs
function InsightGraph({ insight, onClose }: { insight: AIInsight; onClose: () => void }) {
  // Generate mock data points for the graph
  const dataPoints = useMemo(() => {
    const points = [];
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
    for (let i = 0; i < 6; i++) {
      points.push({
        month: months[i],
        preference: 20 + Math.random() * 60 + i * 8,
        knowledge: 15 + Math.random() * 50 + i * 10,
      });
    }
    return points;
  }, []);

  const maxValue = 100;
  const graphWidth = 400;
  const graphHeight = 200;
  const padding = 40;

  const preferencePath = dataPoints
    .map((p, i) => {
      const x = padding + (i / (dataPoints.length - 1)) * (graphWidth - padding * 2);
      const y = graphHeight - padding - (p.preference / maxValue) * (graphHeight - padding * 2);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const knowledgePath = dataPoints
    .map((p, i) => {
      const x = padding + (i / (dataPoints.length - 1)) * (graphWidth - padding * 2);
      const y = graphHeight - padding - (p.knowledge / maxValue) * (graphHeight - padding * 2);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        className="bg-black/90 border border-white/20 rounded-2xl p-6 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{insight.title}</h3>
              <p className="text-xs text-white/50">AI-generated insight</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <p className="text-sm text-white/70 mb-6">{insight.description}</p>

        {/* Graph */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-xs text-white/60">Preference</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-white/60">Knowledge</span>
            </div>
          </div>

          <svg width={graphWidth} height={graphHeight} className="w-full">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((v) => {
              const y = graphHeight - padding - (v / maxValue) * (graphHeight - padding * 2);
              return (
                <g key={v}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={graphWidth - padding}
                    y2={y}
                    stroke="rgba(255,255,255,0.1)"
                    strokeDasharray="4"
                  />
                  <text x={padding - 8} y={y + 4} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="end">
                    {v}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels */}
            {dataPoints.map((p, i) => {
              const x = padding + (i / (dataPoints.length - 1)) * (graphWidth - padding * 2);
              return (
                <text
                  key={p.month}
                  x={x}
                  y={graphHeight - 15}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {p.month}
                </text>
              );
            })}

            {/* Preference line */}
            <motion.path
              d={preferencePath}
              fill="none"
              stroke="#00D4FF"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />

            {/* Knowledge line */}
            <motion.path
              d={knowledgePath}
              fill="none"
              stroke="#A855F7"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            />

            {/* Data points */}
            {dataPoints.map((p, i) => {
              const x = padding + (i / (dataPoints.length - 1)) * (graphWidth - padding * 2);
              const yPref = graphHeight - padding - (p.preference / maxValue) * (graphHeight - padding * 2);
              const yKnow = graphHeight - padding - (p.knowledge / maxValue) * (graphHeight - padding * 2);
              return (
                <g key={i}>
                  <motion.circle
                    cx={x}
                    cy={yPref}
                    r="4"
                    fill="#00D4FF"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  />
                  <motion.circle
                    cx={x}
                    cy={yKnow}
                    r="4"
                    fill="#A855F7"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
          <TrendingUp className="w-3 h-3" />
          <span>Based on {insight.relatedMemoryIds.length} related memories</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TimelineNode({
  node,
  isSelected,
  isHighlighted,
  onClick,
  index,
  onInsightClick,
}: {
  node: GraphNode;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  index: number;
  onInsightClick: (insight: AIInsight) => void;
}) {
  const categoryColor = CATEGORY_COLORS[node.category] || { base: '#ffffff', glow: 'rgba(255,255,255,0.6)' };
  const insight = mockInsights.find((i) => i.relatedMemoryIds.includes(node.id));

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'relative pl-8 pb-8 group cursor-pointer',
        'before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-px',
        isHighlighted ? 'before:bg-white/40' : 'before:bg-white/10'
      )}
      onClick={onClick}
    >
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-0 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
          isSelected
            ? 'scale-125 border-white bg-white/20'
            : 'border-current bg-black'
        )}
        style={{ borderColor: isHighlighted ? 'white' : categoryColor.base }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: categoryColor.base }}
        />
      </div>

      {/* Content card */}
      <div
        className={cn(
          'p-4 rounded-xl border transition-all',
          isSelected
            ? 'bg-white/10 border-white/30'
            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: categoryColor.base }}
          />
          <span className="text-xs font-medium" style={{ color: categoryColor.base }}>
            {node.category}
          </span>
          {node.subcategory && (
            <>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <span className="text-xs text-white/50">{node.subcategory}</span>
            </>
          )}
          <span className="text-xs text-white/30 ml-auto">
            {formatRelativeTime(node.createdAt)}
          </span>
        </div>

        <h3 className="text-sm font-medium text-white mb-2">{node.summary}</h3>
        <p className="text-xs text-white/60 line-clamp-2">{node.content}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {node.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-white/50"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* AI Insight badge - clickable */}
        {insight && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInsightClick(insight);
            }}
            className="mt-3 w-full flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-white/5 hover:border-white/20 hover:from-purple-500/20 hover:to-cyan-500/20 transition-all group/insight"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-white/70 flex-1 text-left">{insight.title}</span>
            <TrendingUp className="w-3 h-3 text-cyan-400 opacity-0 group-hover/insight:opacity-100 transition-opacity" />
          </button>
        )}

        {/* Project badge */}
        {node.project && (
          <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            <span className="text-xs text-cyan-400">{node.project}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function TimelineView({
  nodes,
  searchQuery,
  onNodeSelect,
  selectedNodeId,
}: TimelineViewProps) {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);

  // Group nodes by month
  const timelineGroups = useMemo(() => {
    const sorted = [...nodes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const groups: TimelineGroup[] = [];
    let currentGroup: TimelineGroup | null = null;

    sorted.forEach((node) => {
      const date = new Date(node.createdAt);
      const month = date.toLocaleString('en-US', { month: 'long' });
      const year = date.getFullYear();
      const groupKey = `${month}-${year}`;

      if (!currentGroup || currentGroup.date !== groupKey) {
        currentGroup = {
          date: groupKey,
          month,
          year,
          nodes: [],
        };
        groups.push(currentGroup);
      }

      currentGroup.nodes.push(node);
    });

    return groups;
  }, [nodes]);

  // Filter nodes based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return timelineGroups;

    const query = searchQuery.toLowerCase();
    return timelineGroups
      .map((group) => ({
        ...group,
        nodes: group.nodes.filter(
          (node) =>
            node.content.toLowerCase().includes(query) ||
            node.summary.toLowerCase().includes(query) ||
            node.tags.some((tag) => tag.toLowerCase().includes(query))
        ),
      }))
      .filter((group) => group.nodes.length > 0);
  }, [timelineGroups, searchQuery]);

  const highlightedIds = useMemo(() => {
    if (!searchQuery) return new Set<string>();
    const query = searchQuery.toLowerCase();
    return new Set(
      nodes
        .filter(
          (node) =>
            node.content.toLowerCase().includes(query) ||
            node.summary.toLowerCase().includes(query) ||
            node.tags.some((tag) => tag.toLowerCase().includes(query))
        )
        .map((n) => n.id)
    );
  }, [nodes, searchQuery]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black/50 rounded-xl">
      {/* Scrollable content - no fixed header anymore */}
      <div className="h-full overflow-y-auto overflow-x-hidden p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Timeline header */}
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-white">Memory Timeline</h2>
              <p className="text-xs md:text-sm text-white/50">
                {nodes.length} memories across time
              </p>
            </div>
          </div>

          {/* Timeline content */}
          <div className="space-y-6 md:space-y-8">
            {filteredGroups.map((group) => (
              <div key={group.date}>
                {/* Month header - NOT sticky, just inline */}
                <div
                  className="mb-4 flex items-center gap-3 py-2"
                  onMouseEnter={() => setHoveredMonth(group.date)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                  <span className="text-sm font-medium text-white/60">
                    {group.month} {group.year}
                  </span>
                  <span className="text-xs text-white/30">
                    {group.nodes.length} memories
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-white/20 to-transparent" />
                </div>

                {/* Nodes in this month */}
                <div>
                  {group.nodes.map((node, index) => (
                    <TimelineNode
                      key={node.id}
                      node={node}
                      isSelected={node.id === selectedNodeId}
                      isHighlighted={searchQuery ? highlightedIds.has(node.id) : false}
                      onClick={() =>
                        onNodeSelect(node.id === selectedNodeId ? null : node)
                      }
                      index={index}
                      onInsightClick={setSelectedInsight}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Calendar className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/50">No memories found</p>
            </div>
          )}
        </div>
      </div>

      {/* Insight Graph Modal */}
      <AnimatePresence>
        {selectedInsight && (
          <InsightGraph
            insight={selectedInsight}
            onClose={() => setSelectedInsight(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
