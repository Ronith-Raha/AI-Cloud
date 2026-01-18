// ============================================
// NEXUS CLOUD - Type Definitions
// The data contract for AI Memory Cloud Platform
// ============================================

// ============================================
// AGENT TYPES
// ============================================

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string; // emoji or icon identifier
  color: string; // hex color for theming
  capabilities: string[];
  memoryCount: number;
  lastInteraction: Date;
  provider?: string;
  model?: string;
}

// ============================================
// MEMORY TYPES
// ============================================

export type MemoryType =
  | 'preference'
  | 'fact'
  | 'project'
  | 'conversation'
  | 'skill'
  | 'relationship';

export type MemoryImportance = 'low' | 'medium' | 'high' | 'critical';

export interface MemoryNode {
  id: string;
  content: string;
  summary: string;
  type: MemoryType;
  importance: MemoryImportance;
  category: string; // e.g., "Tech", "Art", "Personal"
  subcategory?: string; // e.g., "Game Development", "Painting"
  project?: string; // e.g., "Space Fruit Game"
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  sourceAgent: string; // Agent ID
  relatedMemories: string[]; // Memory IDs
  embedding?: number[]; // For semantic search (backend slot)
  pinned?: boolean;
  userEdited?: boolean;
  isGroup?: boolean;
  groupKey?: string;
  deletedAt?: Date | null;
  metadata: {
    conversationId?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    confidence: number; // 0-1
  };
}

// ============================================
// CLUSTER & GRAPH TYPES
// ============================================

export interface Cluster {
  id: string;
  name: string;
  description: string;
  color: string; // neon color for visualization
  glowColor: string; // glow effect color
  memoryIds: string[];
  parentClusterId?: string;
  childClusterIds: string[];
  centroid?: { x: number; y: number }; // For graph positioning
  aiInsight?: AIInsight;
}

export interface GraphNode extends MemoryNode {
  // D3 force simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null; // Fixed x position
  fy?: number | null; // Fixed y position
  radius: number;
  depth: number; // 0 = category, 1 = subcategory, 2 = memory
  turnId?: string;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  strength: number; // 0-1
  type: 'category' | 'semantic' | 'temporal' | 'project';
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  clusters: Cluster[];
}

// ============================================
// AI INSIGHT TYPES
// ============================================

export interface AIInsight {
  id: string;
  type: 'pattern' | 'preference' | 'growth' | 'connection' | 'prediction';
  title: string;
  description: string;
  relatedMemoryIds: string[];
  confidence: number;
  generatedAt: Date;
  icon: string; // lucide icon name
}

// ============================================
// CHAT CONTEXT TYPES
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentId: string;
  memoryReferences?: MemoryReference[];
  turnId?: string;
  nodeId?: string;
  error?: string;
}

export interface MemoryReference {
  memoryId: string;
  relevanceScore: number;
  snippet: string;
  category?: string;
}

export interface ChatContext {
  sessionId: string;
  agentId: string;
  messages: ChatMessage[];
  activeMemories: MemoryReference[];
  searchPhase: SearchPhase;
}

export type SearchPhase =
  | { status: 'idle' }
  | { status: 'searching'; query: string }
  | { status: 'found'; count: number; memories: MemoryReference[] }
  | { status: 'injecting'; memories: MemoryReference[] }
  | { status: 'generating' }
  | { status: 'complete' };

// ============================================
// UI STATE TYPES
// ============================================

export type ViewMode = 'categorical' | 'chronological';

export type ZoomLevel = 1 | 2 | 3;

// ============================================
// RELATIONSHIP THRESHOLD CONSTANTS
// ============================================

export const RELATIONSHIP_THRESHOLDS = {
  ZOOMED_OUT: 0.4,   // Level 1: only strong connections
  BALANCED: 0.25,    // Level 2: moderate filtering
  ZOOMED_IN: 0.15,   // Level 3: show most connections
} as const;

export interface TransitionState {
  phase: 'stable' | 'merging' | 'splitting';
  previousZoomLevel: ZoomLevel;
}

export interface ViewState {
  mode: ViewMode;
  zoomLevel: ZoomLevel;
  selectedNodeId: string | null;
  focusedClusterId: string | null;
  searchQuery: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface CanvasState {
  scale: number;
  translateX: number;
  translateY: number;
}

// ============================================
// FILTER & SEARCH TYPES
// ============================================

export interface MemoryFilter {
  types?: MemoryType[];
  categories?: string[];
  agents?: string[];
  importance?: MemoryImportance[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export interface SearchResult {
  memory: MemoryNode;
  score: number;
  highlights: string[];
}

// ============================================
// THEME TYPES
// ============================================

export interface NexusTheme {
  background: string;
  surface: string;
  surfaceHover: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  glow: {
    tech: string;
    art: string;
    personal: string;
    work: string;
    learning: string;
  };
}

// ============================================
// CATEGORY COLOR MAP
// ============================================

export const CATEGORY_COLORS: Record<string, { base: string; glow: string }> = {
  'Tech': { base: '#00D9FF', glow: 'rgba(0, 217, 255, 0.6)' },
  'Art': { base: '#FF00FF', glow: 'rgba(255, 0, 255, 0.6)' },
  'Personal': { base: '#00FF88', glow: 'rgba(0, 255, 136, 0.6)' },
  'Work': { base: '#FFB800', glow: 'rgba(255, 184, 0, 0.6)' },
  'Learning': { base: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.6)' },
  'Health': { base: '#FF6B6B', glow: 'rgba(255, 107, 107, 0.6)' },
  'Finance': { base: '#4ADE80', glow: 'rgba(74, 222, 128, 0.6)' },
  'Conversation': { base: '#4F46E5', glow: 'rgba(79, 70, 229, 0.6)' },
  'Pinned': { base: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)' },
};

// ============================================
// MEMORY TYPE ICONS
// ============================================

export const MEMORY_TYPE_ICONS: Record<MemoryType, string> = {
  preference: 'Heart',
  fact: 'FileText',
  project: 'Folder',
  conversation: 'MessageSquare',
  skill: 'Zap',
  relationship: 'Users',
};
