'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, X } from 'lucide-react';
import { GraphNode, CATEGORY_COLORS } from '@/types/nexus';
import { cn } from '@/lib/utils';

interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  onSelectNode: (node: GraphNode) => void;
  nodes: GraphNode[];
}

export function SpotlightSearch({ isOpen, onClose, onSearch, onSelectNode, nodes }: SpotlightSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GraphNode[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle search
  useEffect(() => {
    if (query.trim()) {
      const searchResults = nodes.filter((node) => !node.isGroup).filter((node) => {
        const haystack = `${node.summary} ${node.content} ${node.tags.join(' ')} ${node.category}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      });
      setResults(searchResults);
      setSelectedIndex(0);
      onSearch(query);
    } else {
      setResults([]);
      onSearch('');
    }
  }, [query, onSearch]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            onSelectNode(results[selectedIndex]);
            onClose();
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    },
    [results, selectedIndex, onSelectNode, onClose]
  );

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/4 z-50 w-full max-w-2xl -translate-x-1/2"
          >
            <div className="mx-4 overflow-hidden rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl">
              {/* Search Input */}
              <div className="flex items-center gap-3 border-b border-white/10 px-4">
                <Search className="h-5 w-5 text-white/50" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search memories..."
                  className="flex-1 bg-transparent py-4 text-lg text-white placeholder-white/40 focus:outline-none"
                />
                <div className="flex items-center gap-1 text-xs text-white/30">
                  <kbd className="rounded bg-white/10 px-1.5 py-0.5">esc</kbd>
                  <span>to close</span>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {results.length > 0 ? (
                  <div className="p-2">
                    {results.map((memory, index) => {
                      const categoryColor = CATEGORY_COLORS[memory.category];
                      return (
                        <button
                          key={memory.id}
                          onClick={() => {
                            onSelectNode(memory);
                            onClose();
                          }}
                          className={cn(
                            'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
                            index === selectedIndex
                              ? 'bg-white/10'
                              : 'hover:bg-white/5'
                          )}
                        >
                          <div
                            className="mt-1 h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: categoryColor?.base }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white">
                                {memory.summary}
                              </span>
                              <span className="text-xs text-white/40 capitalize">
                                {memory.type}
                              </span>
                            </div>
                            <p className="text-xs text-white/60 line-clamp-2">
                              {memory.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {memory.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          {index === selectedIndex && (
                            <span className="text-xs text-white/30">↵</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : query ? (
                  <div className="p-8 text-center">
                    <p className="text-white/50">No memories found for "{query}"</p>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-white/50 mb-4">Start typing to search your memories</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['Memory', 'Pinned', 'Search', 'Project'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setQuery(suggestion)}
                          className="px-3 py-1.5 text-sm text-white/60 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Trigger button component
export function SpotlightTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-colors"
    >
      <Search className="h-4 w-4" />
      <span className="text-sm">Search memories</span>
      <div className="flex items-center gap-1 ml-4">
        <kbd className="flex items-center justify-center w-5 h-5 text-xs bg-white/10 rounded">
          <Command className="w-3 h-3" />
        </kbd>
        <kbd className="flex items-center justify-center w-5 h-5 text-xs bg-white/10 rounded">
          K
        </kbd>
      </div>
    </button>
  );
}
