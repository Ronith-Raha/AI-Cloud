'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, Paperclip, Mic } from 'lucide-react';
import { Agent, ChatMessage, MemoryReference, CATEGORY_COLORS } from '@/types/nexus';
import { DeepSearchVisualizer, useDeepSearch } from './DeepSearchVisualizer';
import { mockMemories } from '@/lib/mockData';
import { cn, generateId, formatTime } from '@/lib/utils';

interface ChatInterfaceProps {
  agent: Agent;
}

export function ChatInterface({ agent }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm ${agent.name}. I have access to ${agent.memoryCount} memories about you. How can I help you today?`,
      timestamp: new Date(),
      agentId: agent.id,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { phase, startSearch, reset } = useDeepSearch();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, phase]);

  const handleSend = async () => {
    if (!input.trim() || phase.status !== 'idle') return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      agentId: agent.id,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Start deep search
    const relevantMemories = await startSearch(input);

    // Generate response
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: generateResponse(input, relevantMemories, agent),
      timestamp: new Date(),
      agentId: agent.id,
      memoryReferences: relevantMemories,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
    reset();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              agent={agent}
            />
          ))}
        </AnimatePresence>

        {/* Deep Search Visualizer */}
        <AnimatePresence>
          {phase.status !== 'idle' && phase.status !== 'complete' && (
            <DeepSearchVisualizer phase={phase} />
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
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <button className="p-1.5 md:p-2 text-white/40 hover:text-white/70 transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <button className="p-1.5 md:p-2 text-white/40 hover:text-white/70 transition-colors">
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || phase.status !== 'idle'}
            className={cn(
              'p-3 rounded-xl transition-all',
              input.trim() && phase.status === 'idle'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-2 text-xs text-white/30 text-center hidden md:block">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message, agent }: { message: ChatMessage; agent: Agent }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
        <div
          className={cn(
            'px-4 py-3 rounded-2xl',
            isUser
              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/10 rounded-tr-sm'
              : 'bg-white/5 border border-white/10 rounded-tl-sm'
          )}
        >
          <p className="text-sm text-white/90 whitespace-pre-wrap">
            {message.content}
          </p>
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
                const memory = mockMemories.find((m) => m.id === ref.memoryId);
                if (!memory) return null;
                const color = CATEGORY_COLORS[memory.category];

                return (
                  <span
                    key={ref.memoryId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-white/5 text-white/50"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: color?.base }}
                    />
                    {memory.category}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <span className="mt-1 text-xs text-white/30">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

function generateResponse(
  query: string,
  memories: MemoryReference[],
  agent: Agent
): string {
  const lowerQuery = query.toLowerCase();

  // Context-aware responses based on memories and query
  if (lowerQuery.includes('space') || lowerQuery.includes('fruit') || lowerQuery.includes('game')) {
    return `Based on your memories, I can see you're working on the **Space Fruit Game** in Godot! 🚀

Here's what I know:
- You're using pixel art with modern lighting effects
- You love neon glow effects (cyan and magenta are your go-to colors)
- You've implemented orbital gravity mechanics for fruit collection
- You have 5 worlds planned: Nebula Garden, Crystal Caves, Solar Winds, Asteroid Belt, and Black Hole

Your target release is March 2026 on itch.io. Would you like help with any specific aspect of the game?`;
  }

  if (lowerQuery.includes('color') || lowerQuery.includes('neon') || lowerQuery.includes('aesthetic')) {
    return `I've noticed a strong pattern in your preferences! 🎨

You consistently gravitate toward **neon aesthetics** with these characteristics:
- Primary colors: cyan (#00D9FF) and magenta (#FF00FF)
- Influences: Synthwave, Cyberpunk, Blade Runner, Tron
- Application: Both your Space Fruit Game and portfolio website use this style

This isn't just a phase—it's become a defining characteristic of your visual identity. Your portfolio even features animated gradients with dark themes to feel "alive."`;
  }

  if (lowerQuery.includes('rust') || lowerQuery.includes('learning')) {
    return `Looking at your learning journey with Rust! 📚

**Progress so far:**
- Completed Rustlings exercises ✓
- Currently studying lifetimes (the tricky part!)
- You find the borrow checker challenging but rewarding

You've been at this for about 5 months as a hobby language. Based on your current pace, you're making solid progress. Would you like some resources for understanding lifetimes better?`;
  }

  if (lowerQuery.includes('work') || lowerQuery.includes('job')) {
    return `From what I remember about your work situation:

**Current Role:** Frontend developer at a fintech startup
- Primary tech: React for dashboard components
- Challenge: Legacy jQuery code that needs refactoring to React

I sense some frustration with the legacy code situation. That's a common pain point! Would you like to discuss strategies for incremental refactoring, or would you prefer to vent a bit? 😄`;
  }

  // Default response
  const memoryContext = memories
    .slice(0, 2)
    .map((m) => mockMemories.find((mem) => mem.id === m.memoryId)?.summary)
    .filter(Boolean)
    .join(', ');

  return `I found ${memories.length} relevant memories to help answer that.${
    memoryContext ? ` Related context: ${memoryContext}.` : ''
  }

Based on my understanding of you, I'd be happy to elaborate on any of these topics. What would you like to explore further?`;
}
