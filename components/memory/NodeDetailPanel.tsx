'use client';

import { motion } from 'framer-motion';
import { X, Calendar, Tag, Link2, Sparkles, Bot } from 'lucide-react';
import { GraphNode, CATEGORY_COLORS, AIInsight } from '@/types/nexus';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { mockInsights, mockAgents, getRelatedMemories } from '@/lib/mockData';

interface NodeDetailPanelProps {
  node: GraphNode;
  onClose: () => void;
}

export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  const categoryColor = CATEGORY_COLORS[node.category] || { base: '#ffffff', glow: 'rgba(255,255,255,0.6)' };
  const sourceAgent = mockAgents.find((a) => a.id === node.sourceAgent);
  const relatedMemories = getRelatedMemories(node.id);
  const nodeInsight = mockInsights.find((i) => i.relatedMemoryIds.includes(node.id));

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-4 right-4 bottom-4 w-96 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden z-30 flex flex-col"
    >
      {/* Header */}
      <div className="relative p-6 border-b border-white/10">
        {/* Glow effect */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(135deg, ${categoryColor.base}40, transparent)`,
          }}
        />

        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: categoryColor.base }}
              />
              <span className="text-sm font-medium" style={{ color: categoryColor.base }}>
                {node.category}
              </span>
              {node.subcategory && (
                <>
                  <span className="text-white/30">→</span>
                  <span className="text-sm text-white/60">{node.subcategory}</span>
                </>
              )}
            </div>
            <h2 className="text-lg font-semibold text-white">{node.summary}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type badge */}
        <div className="mt-3 flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/10 text-white/70 capitalize">
            {node.type}
          </span>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/10 text-white/70 capitalize">
            {node.importance} importance
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Full Content */}
        <div>
          <h3 className="text-xs font-semibold uppercase text-white/50 mb-2">Memory Content</h3>
          <p className="text-sm text-white/80 leading-relaxed">{node.content}</p>
        </div>

        {/* Project */}
        {node.project && (
          <div>
            <h3 className="text-xs font-semibold uppercase text-white/50 mb-2">Project</h3>
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              <span className="text-sm text-white">{node.project}</span>
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <h3 className="text-xs font-semibold uppercase text-white/50 mb-2 flex items-center gap-2">
            <Tag className="w-3 h-3" />
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {node.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded-full bg-white/10 text-white/70 hover:bg-white/20 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* AI Insight */}
        {nodeInsight && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">{nodeInsight.title}</h3>
            </div>
            <p className="text-xs text-white/70">{nodeInsight.description}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-white/40">
                {Math.round(nodeInsight.confidence * 100)}% confidence
              </span>
            </div>
          </div>
        )}

        {/* Source Agent */}
        {sourceAgent && (
          <div>
            <h3 className="text-xs font-semibold uppercase text-white/50 mb-2 flex items-center gap-2">
              <Bot className="w-3 h-3" />
              Source Agent
            </h3>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <span className="text-2xl">{sourceAgent.avatar}</span>
              <div>
                <p className="text-sm font-medium text-white">{sourceAgent.name}</p>
                <p className="text-xs text-white/50">{sourceAgent.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Related Memories */}
        {relatedMemories.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase text-white/50 mb-2 flex items-center gap-2">
              <Link2 className="w-3 h-3" />
              Related Memories ({relatedMemories.length})
            </h3>
            <div className="space-y-2">
              {relatedMemories.slice(0, 3).map((memory) => (
                <div
                  key={memory.id}
                  className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[memory.category]?.base }}
                    />
                    <span className="text-xs text-white/50">{memory.category}</span>
                  </div>
                  <p className="text-sm text-white/80">{memory.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div>
          <h3 className="text-xs font-semibold uppercase text-white/50 mb-2 flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            Timeline
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Created</span>
              <span className="text-white/80">{formatDateTime(node.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Last updated</span>
              <span className="text-white/80">{formatRelativeTime(node.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Confidence */}
        <div>
          <h3 className="text-xs font-semibold uppercase text-white/50 mb-2">Confidence</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${node.metadata.confidence * 100}%`,
                  backgroundColor: categoryColor.base,
                }}
              />
            </div>
            <span className="text-sm text-white/70">
              {Math.round(node.metadata.confidence * 100)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
