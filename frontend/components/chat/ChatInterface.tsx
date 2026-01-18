'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Square, Pencil, Save, X } from 'lucide-react';
import { Agent, ChatMessage, GraphNode, CATEGORY_COLORS } from '@/types/nexus';
import { DeepSearchVisualizer, useDeepSearch } from './DeepSearchVisualizer';
import { cn, generateId, formatTime } from '@/lib/utils';
import { editChatTurn, getInjectedContext, streamChatTurn } from '@/lib/api/client';
import type { ChatTurnCompleteEvent, ChatTurnErrorEvent } from '@/lib/api/types';
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from '@/lib/agents';

interface ChatInterfaceProps {
  agent: Agent;
  projectId: string | null;
  memoryNodes: GraphNode[];
  initialMessages?: ChatMessage[];
  onTurnComplete?: (payload: ChatTurnCompleteEvent & { userText: string }) => void;
  targetTurnId?: string | null;
  onTurnFocusHandled?: () => void;
}

export function ChatInterface({
  agent,
  projectId,
  memoryNodes,
  initialMessages,
  onTurnComplete,
  targetTurnId,
  onTurnFocusHandled
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const base: ChatMessage[] = [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm ${agent.name}. What would you like to work on today?`,
        timestamp: new Date(),
        agentId: agent.id,
      },
    ];
    return initialMessages ? [...base, ...initialMessages] : base;
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [highlightTurnId, setHighlightTurnId] = useState<string | null>(null);
  const [injectedByTurnId, setInjectedByTurnId] = useState<Record<string, string>>({});
  const [injectingTurnId, setInjectingTurnId] = useState<string | null>(null);
  const [injectErrors, setInjectErrors] = useState<Record<string, string>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { phase, startSearch, reset } = useDeepSearch(memoryNodes);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, phase]);

  useEffect(() => {
    if (!initialMessages) return;
    const base: ChatMessage[] = [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm ${agent.name}. What would you like to work on today?`,
        timestamp: new Date(),
        agentId: agent.id,
      },
    ];
    setMessages([...base, ...initialMessages]);
  }, [initialMessages, agent.id, agent.name, agent.memoryCount]);

  useEffect(() => {
    if (!targetTurnId) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-turn-id="${targetTurnId}"]`) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightTurnId(targetTurnId);
    const timer = window.setTimeout(() => {
      setHighlightTurnId(null);
      onTurnFocusHandled?.();
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [targetTurnId, messages.length, onTurnFocusHandled]);

  const handleInjectedContext = async (turnId: string) => {
    if (injectedByTurnId[turnId] || injectingTurnId === turnId) return;
    setInjectingTurnId(turnId);
    try {
      const response = await getInjectedContext(turnId);
      setInjectedByTurnId((prev) => ({ ...prev, [turnId]: response.injectedContextText }));
      setInjectErrors((prev) => {
        const next = { ...prev };
        delete next[turnId];
        return next;
      });
    } catch (error) {
      setInjectErrors((prev) => ({
        ...prev,
        [turnId]: error instanceof Error ? error.message : 'Failed to load context'
      }));
    } finally {
      setInjectingTurnId((prev) => (prev === turnId ? null : prev));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || phase.status !== 'idle' || isStreaming || !projectId) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      agentId: agent.id,
    };

    const assistantMessageId = generateId();
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        agentId: agent.id,
      }
    ]);
    setInput('');

    const searchPromise = startSearch(input);
    setIsTyping(true);
    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    const provider = agent.provider ?? DEFAULT_PROVIDER;
    const model = agent.model ?? DEFAULT_MODEL;
    if (!model.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: 'Please select a model before sending a message.',
          timestamp: new Date(),
          agentId: agent.id,
          error: 'Missing model'
        }
      ]);
      setIsTyping(false);
      setIsStreaming(false);
      reset();
      return;
    }

    try {
      await streamChatTurn({
        payload: {
          projectId,
          provider: provider as 'openai' | 'anthropic' | 'gemini',
          model,
          userText: input
        },
        signal: controller.signal,
        onToken: (data) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    content: message.content + data.text
                  }
                : message
            )
          );
        },
        onComplete: (data) => {
          setMessages((prev) =>
            prev.map((message) => {
              if (message.id === assistantMessageId) {
                return {
                  ...message,
                  turnId: data.turnId,
                  nodeId: data.nodeId
                };
              }
              if (message.id === userMessage.id) {
                return { ...message, turnId: data.turnId };
              }
              return message;
            })
          );
          onTurnComplete?.({ ...data, userText: input });
        },
        onError: (data: ChatTurnErrorEvent) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    error: data.message,
                    content: message.content || `Error: ${data.message}`
                  }
                : message
            )
          );
        }
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        const message = error instanceof Error ? error.message : 'Stream failed';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, error: message, content: message }
              : msg
          )
        );
      }
    } finally {
      abortRef.current = null;
      setIsTyping(false);
      setIsStreaming(false);
    }

    const relevantMemories = await searchPromise;
    if (relevantMemories.length > 0) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? { ...message, memoryReferences: relevantMemories }
            : message
        )
      );
    }
    reset();
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const handleEditStart = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditDraft(message.content);
    setEditErrors((prev) => {
      const next = { ...prev };
      delete next[message.id];
      return next;
    });
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditDraft('');
  };

  const handleEditSave = async (message: ChatMessage) => {
    if (message.role !== 'user') return;
    if (!message.turnId) return;
    const trimmed = editDraft.trim();
    if (!trimmed) {
      setEditErrors((prev) => ({ ...prev, [message.id]: 'Message cannot be empty.' }));
      return;
    }
    setSavingEditId(message.id);
    try {
      await editChatTurn(message.turnId, { userText: trimmed });
      setMessages((prev) =>
        prev.map((msg) => (msg.id === message.id ? { ...msg, content: trimmed } : msg))
      );
      setEditingMessageId(null);
      setEditDraft('');
    } catch (error) {
      setEditErrors((prev) => ({
        ...prev,
        [message.id]: error instanceof Error ? error.message : 'Failed to save edits.'
      }));
    } finally {
      setSavingEditId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              agent={agent}
              memoryNodes={memoryNodes}
              highlight={Boolean(message.turnId && message.turnId === highlightTurnId)}
              injectedText={message.turnId ? injectedByTurnId[message.turnId] : undefined}
              injectedError={message.turnId ? injectErrors[message.turnId] : undefined}
              injectedLoading={message.turnId === injectingTurnId}
              onShowInjected={message.turnId ? () => { void handleInjectedContext(message.turnId!); } : undefined}
              canEdit={Boolean(message.turnId && message.id !== 'welcome' && message.role === 'user')}
              isEditing={editingMessageId === message.id}
              editDraft={editDraft}
              editError={editErrors[message.id]}
              editSaving={savingEditId === message.id}
              onEditStart={() => handleEditStart(message)}
              onEditCancel={handleEditCancel}
              onEditDraftChange={setEditDraft}
              onEditSave={() => { void handleEditSave(message); }}
            />
          ))}
        </AnimatePresence>

        {/* Deep Search Visualizer */}
        <AnimatePresence>
          {phase.status !== 'idle' && phase.status !== 'complete' && (
            <DeepSearchVisualizer phase={phase} memoryNodes={memoryNodes} />
          )}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10">
              <span className="text-lg">{agent.avatar}</span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-white/40"
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 md:p-4 border-t border-white/10">
        <div className="flex items-end gap-2 md:gap-3">
          <div className="flex-1 relative">
            <textarea
              id="chat-input"
              name="chatInput"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${agent.name}...`}
              rows={1}
              className="w-full px-3 md:px-4 py-3 pr-20 md:pr-24 bg-white/5 border border-white/10 rounded-xl text-sm md:text-base text-white placeholder-white/40 resize-none focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
              style={{ minHeight: '48px', maxHeight: '150px' }}
            />
          </div>
          {isStreaming ? (
            <button
              onClick={handleCancel}
              className="p-3 rounded-xl transition-all duration-200 ease-out bg-white/5 text-white/70 hover:bg-white/10"
            >
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || phase.status !== 'idle' || !projectId}
              className={cn(
                'p-3 rounded-xl transition-all duration-200 ease-out',
                input.trim() && phase.status === 'idle' && projectId
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-white/30 text-center hidden md:block">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  agent,
  memoryNodes,
  highlight,
  injectedText,
  injectedError,
  injectedLoading,
  onShowInjected,
  canEdit,
  isEditing,
  editDraft,
  editError,
  editSaving,
  onEditStart,
  onEditCancel,
  onEditDraftChange,
  onEditSave
}: {
  message: ChatMessage;
  agent: Agent;
  memoryNodes: GraphNode[];
  highlight: boolean;
  injectedText?: string;
  injectedError?: string;
  injectedLoading?: boolean;
  onShowInjected?: () => void;
  canEdit: boolean;
  isEditing: boolean;
  editDraft: string;
  editError?: string;
  editSaving: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditDraftChange: (value: string) => void;
  onEditSave: () => void;
}) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-turn-id={message.turnId}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10'
            : 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white/70" />
        ) : (
          <span className="text-lg">{agent.avatar}</span>
        )}
      </div>

      {/* Message content */}
      <div className={cn('flex flex-col max-w-[85%] md:max-w-[70%]', isUser && 'items-end')}>
        <div className={cn('flex items-center gap-2', isUser && 'justify-end')}>
          {canEdit && !isEditing && (
            <button
              onClick={onEditStart}
              aria-label="Edit message"
              title="Edit message"
              className="text-white/40 hover:text-white/70 inline-flex items-center justify-center transition-all duration-200 ease-out"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <div
            className={cn(
              'px-4 py-3 rounded-2xl',
              isUser
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/10 rounded-tr-sm'
                : 'bg-white/5 border border-white/10 rounded-tl-sm',
              highlight && 'ring-1 ring-cyan-400/70 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
            )}
          >
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editDraft}
                onChange={(event) => onEditDraftChange(event.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
              <div className={cn('flex items-center gap-2', isUser && 'justify-end')}>
                <button
                  onClick={onEditCancel}
                  disabled={editSaving}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 ease-out"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
                <button
                  onClick={onEditSave}
                  disabled={editSaving}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-cyan-200 hover:text-cyan-100 hover:bg-white/10 transition-all duration-200 ease-out"
                >
                  <Save className="w-3 h-3" />
                  {editSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
              {editError && <p className="text-xs text-rose-300">{editError}</p>}
            </div>
          ) : (
            <p className="text-sm text-white/90 whitespace-pre-wrap">
              {message.content}
            </p>
          )}
          </div>
        </div>

        {/* Memory references */}
        {message.memoryReferences && message.memoryReferences.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-white/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Based on {message.memoryReferences.length} memories
            </p>
            <div className="flex flex-wrap gap-1">
              {message.memoryReferences.slice(0, 3).map((ref) => {
                const memory = memoryNodes.find((m) => m.id === ref.memoryId);
                if (!memory && !ref.category) return null;
                const color = CATEGORY_COLORS[ref.category ?? memory?.category ?? 'Conversation'];

                return (
                  <span
                    key={ref.memoryId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-white/5 text-white/50"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: color?.base }}
                    />
                    {ref.category ?? memory?.category ?? 'Conversation'}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {!isUser && message.turnId && (
          <div className="mt-2 space-y-2">
            <button
              onClick={onShowInjected}
              disabled={injectedLoading}
              className="text-xs text-cyan-300 hover:text-cyan-200 disabled:opacity-50 transition-all duration-200 ease-out"
            >
              {injectedLoading ? 'Loading injected context…' : 'View injected context'}
            </button>
            {injectedError && (
              <p className="text-xs text-rose-400">{injectedError}</p>
            )}
            {injectedText && (
              <pre className="whitespace-pre-wrap text-xs text-white/70 bg-white/5 border border-white/10 rounded-lg p-2">
{injectedText}
              </pre>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className={cn('mt-1 flex items-center gap-2', isUser && 'justify-end')}>
          <span className="text-xs text-white/30">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

