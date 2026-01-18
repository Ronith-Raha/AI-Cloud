'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { GraphNode, CATEGORY_COLORS } from '@/types/nexus';
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

function TimelineNode({
  node,
  isSelected,
  isHighlighted,
  onClick,
  index,
}: {
  node: GraphNode;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  index: number;
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

        {/* AI Insight badge */}
        {insight && (
          <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-white/5">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-white/70">{insight.title}</span>
          </div>
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
      {/* Category legend */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
        {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
          <div
            key={category}
            className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.base }}
            />
            <span className="text-xs text-white/70">{category}</span>
          </div>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="h-full overflow-y-auto overflow-x-hidden p-8 pt-16">
        <div className="max-w-3xl mx-auto">
          {/* Timeline header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Memory Timeline</h2>
              <p className="text-sm text-white/50">
                {nodes.length} memories across time
              </p>
            </div>
          </div>

          {/* Timeline content */}
          <div className="space-y-8">
            {filteredGroups.map((group) => (
              <div key={group.date}>
                {/* Month header */}
                <div
                  className={cn(
                    'sticky top-0 z-10 mb-4 flex items-center gap-3 py-2 bg-black/80 backdrop-blur-sm -mx-4 px-4 transition-colors',
                    hoveredMonth === group.date && 'opacity-100'
                  )}
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
    </div>
  );
}
