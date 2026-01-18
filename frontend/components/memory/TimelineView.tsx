'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';
import { GraphNode, CATEGORY_COLORS } from '@/types/nexus';
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
          <span className="text-xs text-white/50">{node.category}</span>
          <span className="text-xs text-white/30">•</span>
          <span className="text-xs text-white/40">{formatRelativeTime(node.createdAt)}</span>
        </div>
        <h3 className="text-sm font-medium text-white mb-1">{node.summary}</h3>
        <p className="text-xs text-white/60 line-clamp-2">{node.content}</p>

        <div className="mt-3 flex items-center gap-2">
          {node.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
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
  const visibleNodes = useMemo(() => nodes.filter((node) => !node.isGroup), [nodes]);
  const grouped = useMemo(() => {
    const groups = new Map<string, TimelineGroup>();
    const sorted = [...visibleNodes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    sorted.forEach((node) => {
      const date = new Date(node.createdAt);
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      const key = `${month}-${year}`;
      const group = groups.get(key) ?? {
        date: key,
        month,
        year,
        nodes: [],
      };
      group.nodes.push(node);
      groups.set(key, group);
    });

    return Array.from(groups.values());
  }, [visibleNodes]);

  const query = searchQuery.trim().toLowerCase();
  const highlightedIds = new Set(
    visibleNodes
      .filter((node) => {
        if (!query) return true;
        const haystack = `${node.summary} ${node.content} ${node.tags.join(' ')} ${node.category}`.toLowerCase();
        return haystack.includes(query);
      })
      .map((node) => node.id)
  );

  return (
    <div className="h-full overflow-y-auto pr-4">
      {grouped.length === 0 ? (
        <div className="flex items-center justify-center h-full text-white/40">
          No memories yet.
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-3 mb-4 sticky top-0 bg-black/60 backdrop-blur-sm py-2 z-10">
                <div className="p-2 rounded-lg bg-white/5">
                  <Calendar className="w-4 h-4 text-white/60" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {group.month} {group.year}
                  </h3>
                  <p className="text-xs text-white/40">
                    {group.nodes.length} memories
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 ml-auto" />
              </div>

              <div className="space-y-6">
                {group.nodes.map((node, index) => (
                  <TimelineNode
                    key={node.id}
                    node={node}
                    isSelected={node.id === selectedNodeId}
                    isHighlighted={query ? highlightedIds.has(node.id) : false}
                    onClick={() => onNodeSelect(node)}
                    index={index}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

