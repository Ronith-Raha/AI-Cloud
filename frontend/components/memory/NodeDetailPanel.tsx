'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Tag, MessageSquare } from 'lucide-react';
import { GraphNode, CATEGORY_COLORS } from '@/types/nexus';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { getNode } from '@/lib/api/client';
import type { GraphNodeDetailResponse } from '@/lib/api/types';
import { useRouter } from 'next/navigation';

interface NodeDetailPanelProps {
  node: GraphNode;
  projectId: string | null;
  onClose: () => void;
  onNodeUpdated?: (nodeId: string, options?: { deleted?: boolean }) => void;
}

export function NodeDetailPanel({ node, projectId, onClose, onNodeUpdated }: NodeDetailPanelProps) {
  const categoryColor = CATEGORY_COLORS[node.category] || { base: '#ffffff', glow: 'rgba(255,255,255,0.6)' };
  const [detail, setDetail] = useState<GraphNodeDetailResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const currentTitle = detail?.node?.title ?? node.summary;
  const currentContent = detail?.node?.summary2sent ?? node.content;
  const currentPinned = detail?.node?.pinned ?? node.pinned;
  const currentUserEdited = detail?.node?.userEdited ?? node.userEdited;
  const currentDeletedAt = detail?.node?.deletedAt ? new Date(detail.node.deletedAt) : node.deletedAt;
  const isDeleted = useMemo(() => Boolean(currentDeletedAt), [currentDeletedAt]);
  const isGroup = Boolean(node.isGroup);
  const router = useRouter();
  const chatTurnId = node.turnId ?? detail?.turn.id ?? null;
  const isValidId = /^[0-9a-f-]{36}$/i.test(node.id);

  const refreshDetail = async () => {
    if (!isValidId || node.isGroup) return;
    try {
      const response = await getNode(node.id);
      setDetail(response);
    } catch {
      // Ignore detail refresh failures
    }
  };

  useEffect(() => {
    if (node.isGroup || !isValidId) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    let isActive = true;
    getNode(node.id)
      .then((response) => {
        if (!isActive) return;
        setDetail(response);
        setDetailError(null);
      })
      .catch((error) => {
        if (!isActive) return;
        const message =
          error instanceof Error ? error.message : 'Failed to load details';
        if (message.toLowerCase().includes('invalid node id')) {
          setDetailError(null);
          return;
        }
        setDetailError(message);
      });

    return () => {
      isActive = false;
    };
  }, [node.id, node.isGroup]);

  useEffect(() => {
    void refreshDetail();
  }, [node.id]);

  const tagList = Array.from(
    new Set([
      ...node.tags,
      currentUserEdited ? 'edited' : null,
      currentPinned ? 'pinned' : null
    ].filter(Boolean))
  ) as string[];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-4 right-4 bottom-4 w-96 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden z-[100] flex flex-col pointer-events-auto"
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
            <h2 className="text-lg font-semibold text-white">{currentTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action buttons removed */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Full Content */}
        <div>
          <h3 className="text-xs font-semibold uppercase text-white/50 mb-2">Memory Content</h3>
          <p className="text-sm text-white/80 leading-relaxed">{currentContent}</p>
        </div>

        {/* Tags */}
        {tagList.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase text-white/50 mb-2 flex items-center gap-2">
              <Tag className="w-3 h-3" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {tagList.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs rounded-full bg-white/10 text-white/70 hover:bg-white/20 cursor-pointer transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Open Chat */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Open Chat</h3>
          </div>
          {node.isGroup ? (
            <p className="text-xs text-white/40">Group nodes summarize category clusters.</p>
          ) : chatTurnId ? (
            <button
              onClick={() => router.push(`/chat?turnId=${chatTurnId}`)}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs text-white/80 hover:bg-white/10"
            >
              <MessageSquare className="w-3 h-3" />
              View full chat
            </button>
          ) : detailError ? (
            <p className="text-xs text-rose-400">{detailError}</p>
          ) : (
            <p className="text-xs text-white/40">Chat link unavailable.</p>
          )}
        </div>

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
      </div>
    </motion.div>
  );
}

