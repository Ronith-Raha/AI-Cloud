'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Tag, Sparkles, Pencil, Save, Trash2, Pin, PinOff, RotateCcw } from 'lucide-react';
import { GraphNode, CATEGORY_COLORS } from '@/types/nexus';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { deleteGraphNode, editGraphNode, getGraphNode, restoreGraphNode } from '@/lib/api/client';
import type { GraphNodeDetailResponse } from '@/lib/api/types';

interface NodeDetailPanelProps {
  node: GraphNode;
  onClose: () => void;
  onNodeUpdated?: () => void;
}

export function NodeDetailPanel({ node, onClose, onNodeUpdated }: NodeDetailPanelProps) {
  const categoryColor = CATEGORY_COLORS[node.category] || { base: '#ffffff', glow: 'rgba(255,255,255,0.6)' };
  const [detail, setDetail] = useState<GraphNodeDetailResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(node.summary);
  const [draftSummary, setDraftSummary] = useState(node.content);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isDeleted = useMemo(() => Boolean(node.deletedAt), [node.deletedAt]);

  useEffect(() => {
    if (node.isGroup || !/^[0-9a-f-]{36}$/i.test(node.id)) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    let isActive = true;
    getGraphNode(node.id)
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
    setDraftTitle(node.summary);
    setDraftSummary(node.content);
  }, [node.summary, node.content]);

  const handleSave = async () => {
    setIsSaving(true);
    setActionError(null);
    try {
      await editGraphNode(node.id, {
        title: draftTitle.trim() || undefined,
        summary2sent: draftSummary.trim() || undefined
      });
      setIsEditing(false);
      onNodeUpdated?.();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePin = async () => {
    setIsSaving(true);
    setActionError(null);
    try {
      await editGraphNode(node.id, {
        pinned: !node.pinned
      });
      onNodeUpdated?.();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update pin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    setActionError(null);
    try {
      await deleteGraphNode(node.id);
      onNodeUpdated?.();
      onClose();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to delete');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async () => {
    setIsSaving(true);
    setActionError(null);
    try {
      await restoreGraphNode(node.id);
      onNodeUpdated?.();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to restore');
    } finally {
      setIsSaving(false);
    }
  };

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
            {isEditing ? (
              <input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            ) : (
              <h2 className="text-lg font-semibold text-white">{node.summary}</h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsEditing((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/70 hover:bg-white/10"
          >
            <Pencil className="w-3 h-3" />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={handleTogglePin}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
          >
            {node.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
            {node.pinned ? 'Unpin' : 'Pin'}
          </button>
          {isDeleted ? (
            <button
              onClick={handleRestore}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-xs text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              Restore
            </button>
          ) : (
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 text-xs text-rose-200 hover:bg-rose-500/30 disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}
          {isEditing && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-xs text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
          )}
          {actionError && <span className="text-xs text-rose-300">{actionError}</span>}
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
          {isEditing ? (
            <textarea
              value={draftSummary}
              onChange={(event) => setDraftSummary(event.target.value)}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          ) : (
            <p className="text-sm text-white/80 leading-relaxed">{node.content}</p>
          )}
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
            {Array.from(
              new Set(
                [...node.tags, node.userEdited ? 'edited' : null, node.pinned ? 'pinned' : null]
                  .filter(Boolean)
                  .map(String)
              )
            ).map((tag) => (
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
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Turn Details</h3>
          </div>
          {node.isGroup ? (
            <p className="text-xs text-white/40">Group nodes summarize category clusters.</p>
          ) : detail ? (
            <div className="space-y-3 text-xs text-white/70">
              <div>
                <p className="text-white/40 mb-1">User</p>
                <p className="text-white/80">{detail.turn.userText}</p>
              </div>
              <div>
                <p className="text-white/40 mb-1">Assistant</p>
                <p className="text-white/80">{detail.turn.assistantText}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Model</span>
                <span className="text-white/80">{detail.turn.provider} / {detail.turn.model}</span>
              </div>
            </div>
          ) : detailError ? (
            <p className="text-xs text-rose-400">{detailError}</p>
          ) : (
            <p className="text-xs text-white/40">Loading turn details...</p>
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
