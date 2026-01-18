// ============================================
// CLOUDI - Mock Data
// Rich fake data for immediate UI development
// ============================================

import {
  Agent,
  MemoryNode,
  Cluster,
  AIInsight,
  GraphNode,
  GraphLink,
  GraphData,
  CATEGORY_COLORS,
} from '@/types/nexus';

// ============================================
// AGENTS
// ============================================

export const mockAgents: Agent[] = [
  {
    id: 'coding-assistant',
    name: 'Coding Assistant',
    description: 'Your AI pair programmer for all development tasks',
    avatar: '💻',
    color: '#00D9FF',
    capabilities: ['code-review', 'debugging', 'architecture', 'testing'],
    memoryCount: 156,
    lastInteraction: new Date('2026-01-16T14:30:00'),
  },
  {
    id: 'voice-car-agent',
    name: 'Voice Car Agent',
    description: 'Your intelligent driving companion',
    avatar: '🚗',
    color: '#FF6B6B',
    capabilities: ['navigation', 'music', 'calls', 'reminders'],
    memoryCount: 89,
    lastInteraction: new Date('2026-01-17T08:15:00'),
  },
  {
    id: 'creative-muse',
    name: 'Creative Muse',
    description: 'Inspiration for art, design, and creative projects',
    avatar: '🎨',
    color: '#FF00FF',
    capabilities: ['brainstorming', 'color-theory', 'design-critique', 'mood-boards'],
    memoryCount: 73,
    lastInteraction: new Date('2026-01-15T20:45:00'),
  },
  {
    id: 'life-coach',
    name: 'Life Coach',
    description: 'Personal growth and wellness guidance',
    avatar: '🌟',
    color: '#4ADE80',
    capabilities: ['goal-setting', 'habits', 'mindfulness', 'productivity'],
    memoryCount: 42,
    lastInteraction: new Date('2026-01-14T07:00:00'),
  },
  {
    id: 'research-analyst',
    name: 'Research Analyst',
    description: 'Deep dives into any topic you need to understand',
    avatar: '🔬',
    color: '#8B5CF6',
    capabilities: ['research', 'summarization', 'fact-checking', 'citations'],
    memoryCount: 234,
    lastInteraction: new Date('2026-01-17T11:20:00'),
  },
];

// ============================================
// MEMORY NODES
// ============================================

export const mockMemories: MemoryNode[] = [
  // Tech - Space Fruit Game Project
  {
    id: 'mem-001',
    content: 'User is building a space-themed fruit collecting game using Godot Engine. They prefer a retro pixel art style with modern lighting effects.',
    summary: 'Space Fruit Game - Godot project with retro aesthetics',
    type: 'project',
    importance: 'high',
    category: 'Tech',
    subcategory: 'Game Development',
    project: 'Space Fruit Game',
    tags: ['godot', 'game-dev', 'pixel-art', 'space-theme'],
    createdAt: new Date('2025-11-15T10:00:00'),
    updatedAt: new Date('2026-01-10T15:30:00'),
    sourceAgent: 'coding-assistant',
    relatedMemories: ['mem-002', 'mem-003', 'mem-004'],
    metadata: { confidence: 0.95, sentiment: 'positive' },
  },
  {
    id: 'mem-002',
    content: 'User wants the space fruits to have a neon glow effect. They specifically mentioned cyan and magenta as preferred colors for the glow.',
    summary: 'Neon glow preference - cyan and magenta',
    type: 'preference',
    importance: 'medium',
    category: 'Tech',
    subcategory: 'Game Development',
    project: 'Space Fruit Game',
    tags: ['visual-effects', 'neon', 'colors', 'glow'],
    createdAt: new Date('2025-11-20T14:20:00'),
    updatedAt: new Date('2025-11-20T14:20:00'),
    sourceAgent: 'coding-assistant',
    relatedMemories: ['mem-001', 'mem-005'],
    metadata: { confidence: 0.98, sentiment: 'positive' },
  },
  {
    id: 'mem-003',
    content: 'Implemented a gravity system where fruits orbit around planets. User loved the physics-based collection mechanic.',
    summary: 'Orbital gravity mechanics implemented',
    type: 'fact',
    importance: 'high',
    category: 'Tech',
    subcategory: 'Game Development',
    project: 'Space Fruit Game',
    tags: ['physics', 'gravity', 'mechanics', 'gameplay'],
    createdAt: new Date('2025-12-01T09:45:00'),
    updatedAt: new Date('2025-12-01T09:45:00'),
    sourceAgent: 'coding-assistant',
    relatedMemories: ['mem-001', 'mem-004'],
    metadata: { confidence: 0.92, sentiment: 'positive' },
  },
  {
    id: 'mem-004',
    content: 'User struggles with GDScript async patterns. Provided multiple examples of signals and coroutines.',
    summary: 'GDScript async learning - signals & coroutines',
    type: 'skill',
    importance: 'medium',
    category: 'Tech',
    subcategory: 'Game Development',
    project: 'Space Fruit Game',
    tags: ['gdscript', 'async', 'learning', 'signals'],
    createdAt: new Date('2025-12-10T16:30:00'),
    updatedAt: new Date('2026-01-05T11:00:00'),
    sourceAgent: 'coding-assistant',
    relatedMemories: ['mem-001', 'mem-003'],
    metadata: { confidence: 0.88, sentiment: 'neutral' },
  },
  {
    id: 'mem-005',
    content: 'User consistently asks about neon color palettes across multiple projects. This is a strong aesthetic preference.',
    summary: 'Strong preference for neon aesthetics',
    type: 'preference',
    importance: 'high',
    category: 'Art',
    subcategory: 'Color Theory',
    tags: ['neon', 'colors', 'aesthetic', 'preference'],
    createdAt: new Date('2025-10-05T12:00:00'),
    updatedAt: new Date('2026-01-15T09:20:00'),
    sourceAgent: 'creative-muse',
    relatedMemories: ['mem-002', 'mem-010'],
    metadata: { confidence: 0.97, sentiment: 'positive' },
  },
  // Tech - Web Development
  {
    id: 'mem-006',
    content: 'User prefers React with TypeScript for web projects. They use Next.js as their go-to framework.',
    summary: 'Tech stack: React + TypeScript + Next.js',
    type: 'preference',
    importance: 'high',
    category: 'Tech',
    subcategory: 'Web Development',
    tags: ['react', 'typescript', 'nextjs', 'frontend'],
    createdAt: new Date('2025-08-20T10:00:00'),
    updatedAt: new Date('2026-01-17T14:00:00'),
    sourceAgent: 'coding-assistant',
    relatedMemories: ['mem-007'],
    metadata: { confidence: 0.99, sentiment: 'positive' },
  },
  {
    id: 'mem-007',
    content: 'User built a portfolio website with a dark theme and animated gradients. They mentioned wanting it to feel "alive".',
    summary: 'Portfolio site - dark theme, animated gradients',
    type: 'project',
    importance: 'medium',
    category: 'Tech',
    subcategory: 'Web Development',
    project: 'Portfolio Website',
    tags: ['portfolio', 'animations', 'dark-theme', 'gradients'],
    createdAt: new Date('2025-09-15T08:30:00'),
    updatedAt: new Date('2025-10-20T16:45:00'),
    sourceAgent: 'coding-assistant',
    relatedMemories: ['mem-006', 'mem-005'],
    metadata: { confidence: 0.91, sentiment: 'positive' },
  },
  // Art
  {
    id: 'mem-008',
    content: 'User is learning digital painting. They use Procreate on iPad and are interested in concept art.',
    summary: 'Digital art journey - Procreate, concept art focus',
    type: 'skill',
    importance: 'medium',
    category: 'Art',
    subcategory: 'Digital Art',
    tags: ['procreate', 'digital-painting', 'concept-art', 'learning'],
    createdAt: new Date('2025-07-10T19:00:00'),
    updatedAt: new Date('2026-01-12T21:30:00'),
    sourceAgent: 'creative-muse',
    relatedMemories: ['mem-009', 'mem-010'],
    metadata: { confidence: 0.85, sentiment: 'positive' },
  },
  {
    id: 'mem-009',
    content: 'User drew character concepts for the Space Fruit Game. Main character is an astronaut with a fruit basket jetpack.',
    summary: 'Space Fruit character design - astronaut concept',
    type: 'project',
    importance: 'medium',
    category: 'Art',
    subcategory: 'Character Design',
    project: 'Space Fruit Game',
    tags: ['character-design', 'astronaut', 'concept-art', 'game-art'],
    createdAt: new Date('2025-11-25T20:15:00'),
    updatedAt: new Date('2025-11-25T20:15:00'),
    sourceAgent: 'creative-muse',
    relatedMemories: ['mem-001', 'mem-008'],
    metadata: { confidence: 0.90, sentiment: 'positive' },
  },
  {
    id: 'mem-010',
    content: 'User loves synthwave and cyberpunk aesthetics. They often reference Blade Runner and Tron as visual inspirations.',
    summary: 'Aesthetic influences: synthwave, cyberpunk, Blade Runner',
    type: 'preference',
    importance: 'high',
    category: 'Art',
    subcategory: 'Aesthetics',
    tags: ['synthwave', 'cyberpunk', 'blade-runner', 'tron', 'inspiration'],
    createdAt: new Date('2025-06-01T15:00:00'),
    updatedAt: new Date('2026-01-08T18:40:00'),
    sourceAgent: 'creative-muse',
    relatedMemories: ['mem-005', 'mem-007'],
    metadata: { confidence: 0.96, sentiment: 'positive' },
  },
  // Personal
  {
    id: 'mem-011',
    content: 'User wakes up at 6:30 AM on weekdays. They prefer to code in the morning and do creative work in the evening.',
    summary: 'Schedule: coding mornings, creative evenings',
    type: 'preference',
    importance: 'medium',
    category: 'Personal',
    subcategory: 'Routine',
    tags: ['schedule', 'routine', 'productivity', 'time-management'],
    createdAt: new Date('2025-09-01T06:30:00'),
    updatedAt: new Date('2026-01-16T06:35:00'),
    sourceAgent: 'life-coach',
    relatedMemories: ['mem-012'],
    metadata: { confidence: 0.94, sentiment: 'positive' },
  },
  {
    id: 'mem-012',
    content: 'User set a goal to release the Space Fruit Game by March 2026. They want to publish on itch.io first.',
    summary: 'Goal: Space Fruit Game release March 2026 on itch.io',
    type: 'fact',
    importance: 'high',
    category: 'Personal',
    subcategory: 'Goals',
    project: 'Space Fruit Game',
    tags: ['goals', 'deadline', 'game-release', 'itch-io'],
    createdAt: new Date('2025-11-01T10:00:00'),
    updatedAt: new Date('2025-11-01T10:00:00'),
    sourceAgent: 'life-coach',
    relatedMemories: ['mem-001', 'mem-011'],
    metadata: { confidence: 0.93, sentiment: 'positive' },
  },
  {
    id: 'mem-013',
    content: 'User mentioned their friend Alex is also a game developer. They sometimes collaborate on game jams.',
    summary: 'Friend Alex - game dev collaborator',
    type: 'relationship',
    importance: 'low',
    category: 'Personal',
    subcategory: 'Relationships',
    tags: ['friends', 'collaboration', 'game-jams', 'alex'],
    createdAt: new Date('2025-10-15T14:00:00'),
    updatedAt: new Date('2025-10-15T14:00:00'),
    sourceAgent: 'coding-assistant',
    relatedMemories: ['mem-001'],
    metadata: { confidence: 0.80, sentiment: 'positive' },
  },
  // Work
  {
    id: 'mem-014',
    content: 'User works as a frontend developer at a fintech startup. They use React and handle the dashboard components.',
    summary: 'Job: Frontend dev at fintech startup',
    type: 'fact',
    importance: 'high',
    category: 'Work',
    subcategory: 'Career',
    tags: ['job', 'frontend', 'fintech', 'startup', 'react'],
    createdAt: new Date('2025-05-10T09:00:00'),
    updatedAt: new Date('2026-01-10T09:00:00'),
    sourceAgent: 'coding-assistant',
    relatedMemories: ['mem-006', 'mem-015'],
    metadata: { confidence: 0.98, sentiment: 'neutral' },
  },
  {
    id: 'mem-015',
    content: 'User is frustrated with legacy code at work. They want to refactor the old jQuery components to React.',
    summary: 'Work frustration: legacy jQuery needs React refactor',
    type: 'conversation',
    importance: 'medium',
    category: 'Work',
    subcategory: 'Challenges',
    tags: ['legacy-code', 'jquery', 'refactoring', 'frustration'],
    createdAt: new Date('2025-12-20T17:30:00'),
    updatedAt: new Date('2025-12-20T17:30:00'),
    sourceAgent: 'coding-assistant',
    relatedMemories: ['mem-014', 'mem-006'],
    metadata: { confidence: 0.87, sentiment: 'negative' },
  },
  // Learning
  {
    id: 'mem-016',
    content: 'User is learning Rust as a hobby language. They find the borrow checker challenging but rewarding.',
    summary: 'Learning Rust - borrow checker challenges',
    type: 'skill',
    importance: 'medium',
    category: 'Learning',
    subcategory: 'Programming Languages',
    tags: ['rust', 'learning', 'borrow-checker', 'hobby'],
    createdAt: new Date('2025-08-01T20:00:00'),
    updatedAt: new Date('2026-01-14T21:15:00'),
    sourceAgent: 'coding-assistant',
    relatedMemories: ['mem-017'],
    metadata: { confidence: 0.86, sentiment: 'neutral' },
  },
  {
    id: 'mem-017',
    content: 'User completed the Rustlings exercises. Now working through the Rust book chapter on lifetimes.',
    summary: 'Rust progress: Rustlings done, studying lifetimes',
    type: 'fact',
    importance: 'low',
    category: 'Learning',
    subcategory: 'Programming Languages',
    tags: ['rust', 'rustlings', 'lifetimes', 'progress'],
    createdAt: new Date('2026-01-10T19:45:00'),
    updatedAt: new Date('2026-01-10T19:45:00'),
    sourceAgent: 'coding-assistant',
    relatedMemories: ['mem-016'],
    metadata: { confidence: 0.92, sentiment: 'positive' },
  },
  {
    id: 'mem-018',
    content: 'User wants to learn shader programming to enhance the Space Fruit Game visuals.',
    summary: 'Learning goal: shader programming for game visuals',
    type: 'skill',
    importance: 'medium',
    category: 'Learning',
    subcategory: 'Graphics Programming',
    project: 'Space Fruit Game',
    tags: ['shaders', 'graphics', 'learning', 'game-dev'],
    createdAt: new Date('2025-12-05T11:30:00'),
    updatedAt: new Date('2025-12-05T11:30:00'),
    sourceAgent: 'coding-assistant',
    relatedMemories: ['mem-001', 'mem-002'],
    metadata: { confidence: 0.89, sentiment: 'positive' },
  },
  // Health
  {
    id: 'mem-019',
    content: 'User mentioned they need to take more breaks while coding. They set up a Pomodoro timer.',
    summary: 'Health habit: Pomodoro breaks while coding',
    type: 'preference',
    importance: 'medium',
    category: 'Health',
    subcategory: 'Habits',
    tags: ['pomodoro', 'breaks', 'ergonomics', 'health'],
    createdAt: new Date('2025-11-10T14:00:00'),
    updatedAt: new Date('2025-11-10T14:00:00'),
    sourceAgent: 'life-coach',
    relatedMemories: ['mem-011'],
    metadata: { confidence: 0.82, sentiment: 'positive' },
  },
  // More project memories for depth
  {
    id: 'mem-020',
    content: 'Space Fruit Game will have 5 worlds: Nebula Garden, Crystal Caves, Solar Winds, Asteroid Belt, and Black Hole.',
    summary: 'Space Fruit Game: 5 worlds planned',
    type: 'project',
    importance: 'high',
    category: 'Tech',
    subcategory: 'Game Development',
    project: 'Space Fruit Game',
    tags: ['level-design', 'worlds', 'game-design', 'planning'],
    createdAt: new Date('2025-12-15T13:00:00'),
    updatedAt: new Date('2025-12-15T13:00:00'),
    sourceAgent: 'coding-assistant',
    relatedMemories: ['mem-001', 'mem-003'],
    metadata: { confidence: 0.94, sentiment: 'positive' },
  },
];

// ============================================
// AI INSIGHTS
// ============================================

export const mockInsights: AIInsight[] = [
  {
    id: 'insight-001',
    type: 'pattern',
    title: 'Neon Aesthetic Pattern',
    description: 'You consistently ask about neon colors and glow effects across projects. This is a defining characteristic of your visual style.',
    relatedMemoryIds: ['mem-002', 'mem-005', 'mem-010'],
    confidence: 0.95,
    generatedAt: new Date('2026-01-15T10:00:00'),
    icon: 'Sparkles',
  },
  {
    id: 'insight-002',
    type: 'growth',
    title: 'Rust Learning Progress',
    description: 'Your Rust skills have improved significantly over the past 5 months. You\'ve moved from basics to advanced lifetime concepts.',
    relatedMemoryIds: ['mem-016', 'mem-017'],
    confidence: 0.88,
    generatedAt: new Date('2026-01-12T08:00:00'),
    icon: 'TrendingUp',
  },
  {
    id: 'insight-003',
    type: 'connection',
    title: 'Art + Code Synthesis',
    description: 'Your game development uniquely combines your coding skills with your artistic vision. The Space Fruit Game is where both passions merge.',
    relatedMemoryIds: ['mem-001', 'mem-008', 'mem-009'],
    confidence: 0.92,
    generatedAt: new Date('2026-01-14T15:30:00'),
    icon: 'Link',
  },
  {
    id: 'insight-004',
    type: 'prediction',
    title: 'Shader Learning Readiness',
    description: 'Based on your current GDScript proficiency and visual goals, you\'re ready to start learning shader programming.',
    relatedMemoryIds: ['mem-004', 'mem-018', 'mem-002'],
    confidence: 0.78,
    generatedAt: new Date('2026-01-10T12:00:00'),
    icon: 'Lightbulb',
  },
  {
    id: 'insight-005',
    type: 'preference',
    title: 'Morning Coder',
    description: 'Your most productive coding sessions happen between 7-11 AM. Consider scheduling complex tasks during this window.',
    relatedMemoryIds: ['mem-011', 'mem-019'],
    confidence: 0.90,
    generatedAt: new Date('2026-01-16T07:00:00'),
    icon: 'Sun',
  },
];

// ============================================
// CLUSTERS
// ============================================

export const mockClusters: Cluster[] = [
  {
    id: 'cluster-tech',
    name: 'Tech',
    description: 'All technology and programming related memories',
    color: CATEGORY_COLORS['Tech'].base,
    glowColor: CATEGORY_COLORS['Tech'].glow,
    memoryIds: ['mem-001', 'mem-002', 'mem-003', 'mem-004', 'mem-006', 'mem-007', 'mem-020'],
    childClusterIds: ['cluster-gamedev', 'cluster-webdev'],
    aiInsight: mockInsights[2],
  },
  {
    id: 'cluster-gamedev',
    name: 'Game Development',
    description: 'Game development projects and skills',
    color: '#00BFFF',
    glowColor: 'rgba(0, 191, 255, 0.6)',
    memoryIds: ['mem-001', 'mem-002', 'mem-003', 'mem-004', 'mem-020'],
    parentClusterId: 'cluster-tech',
    childClusterIds: ['cluster-spacefruit'],
  },
  {
    id: 'cluster-spacefruit',
    name: 'Space Fruit Game',
    description: 'The Space Fruit Game project',
    color: '#00FFFF',
    glowColor: 'rgba(0, 255, 255, 0.6)',
    memoryIds: ['mem-001', 'mem-002', 'mem-003', 'mem-004', 'mem-009', 'mem-012', 'mem-018', 'mem-020'],
    parentClusterId: 'cluster-gamedev',
    childClusterIds: [],
    aiInsight: mockInsights[3],
  },
  {
    id: 'cluster-webdev',
    name: 'Web Development',
    description: 'Web development projects and preferences',
    color: '#00E5FF',
    glowColor: 'rgba(0, 229, 255, 0.6)',
    memoryIds: ['mem-006', 'mem-007'],
    parentClusterId: 'cluster-tech',
    childClusterIds: [],
  },
  {
    id: 'cluster-art',
    name: 'Art',
    description: 'Creative and artistic memories',
    color: CATEGORY_COLORS['Art'].base,
    glowColor: CATEGORY_COLORS['Art'].glow,
    memoryIds: ['mem-005', 'mem-008', 'mem-009', 'mem-010'],
    childClusterIds: ['cluster-digitalart', 'cluster-aesthetics'],
    aiInsight: mockInsights[0],
  },
  {
    id: 'cluster-digitalart',
    name: 'Digital Art',
    description: 'Digital art and illustration',
    color: '#FF66FF',
    glowColor: 'rgba(255, 102, 255, 0.6)',
    memoryIds: ['mem-008', 'mem-009'],
    parentClusterId: 'cluster-art',
    childClusterIds: [],
  },
  {
    id: 'cluster-aesthetics',
    name: 'Aesthetics',
    description: 'Visual preferences and inspirations',
    color: '#FF33FF',
    glowColor: 'rgba(255, 51, 255, 0.6)',
    memoryIds: ['mem-005', 'mem-010'],
    parentClusterId: 'cluster-art',
    childClusterIds: [],
  },
  {
    id: 'cluster-personal',
    name: 'Personal',
    description: 'Personal life, goals, and relationships',
    color: CATEGORY_COLORS['Personal'].base,
    glowColor: CATEGORY_COLORS['Personal'].glow,
    memoryIds: ['mem-011', 'mem-012', 'mem-013'],
    childClusterIds: [],
    aiInsight: mockInsights[4],
  },
  {
    id: 'cluster-work',
    name: 'Work',
    description: 'Professional and career related memories',
    color: CATEGORY_COLORS['Work'].base,
    glowColor: CATEGORY_COLORS['Work'].glow,
    memoryIds: ['mem-014', 'mem-015'],
    childClusterIds: [],
  },
  {
    id: 'cluster-learning',
    name: 'Learning',
    description: 'Skills being learned and educational progress',
    color: CATEGORY_COLORS['Learning'].base,
    glowColor: CATEGORY_COLORS['Learning'].glow,
    memoryIds: ['mem-016', 'mem-017', 'mem-018'],
    childClusterIds: [],
    aiInsight: mockInsights[1],
  },
  {
    id: 'cluster-health',
    name: 'Health',
    description: 'Health and wellness habits',
    color: CATEGORY_COLORS['Health'].base,
    glowColor: CATEGORY_COLORS['Health'].glow,
    memoryIds: ['mem-019'],
    childClusterIds: [],
  },
];

// ============================================
// GRAPH DATA GENERATION
// ============================================

function getDepthForCategory(category: string, subcategory?: string, project?: string): number {
  if (project) return 2;
  if (subcategory) return 1;
  return 0;
}

// Calculate category counts for sizing nodes based on importance
function getCategoryCounts(memories: MemoryNode[]): Map<string, number> {
  const counts = new Map<string, number>();
  memories.forEach((memory) => {
    const current = counts.get(memory.category) || 0;
    counts.set(memory.category, current + 1);
  });
  return counts;
}

function getRadiusForNode(
  importance: string,
  depth: number,
  categoryCount: number,
  maxCategoryCount: number
): number {
  // Base radius ranges based on depth
  const minRadius = depth === 0 ? 25 : depth === 1 ? 18 : 12;
  const maxRadius = depth === 0 ? 70 : depth === 1 ? 45 : 30;

  // Scale based on category count (how many memories in this category)
  const countRatio = categoryCount / maxCategoryCount;
  const baseRadius = minRadius + (maxRadius - minRadius) * countRatio;

  // Apply importance multiplier
  const importanceMultiplier =
    importance === 'critical' ? 1.3 :
    importance === 'high' ? 1.15 :
    importance === 'medium' ? 1 : 0.85;

  return Math.round(baseRadius * importanceMultiplier);
}

export function generateGraphData(): GraphData {
  // Calculate category counts first
  const categoryCounts = getCategoryCounts(mockMemories);
  const maxCategoryCount = Math.max(...categoryCounts.values());

  const nodes: GraphNode[] = mockMemories.map((memory) => {
    const categoryCount = categoryCounts.get(memory.category) || 1;
    return {
      ...memory,
      radius: getRadiusForNode(
        memory.importance,
        getDepthForCategory(memory.category, memory.subcategory, memory.project),
        categoryCount,
        maxCategoryCount
      ),
      depth: getDepthForCategory(memory.category, memory.subcategory, memory.project),
    };
  });

  const links: GraphLink[] = [];

  // Create links based on related memories
  mockMemories.forEach((memory) => {
    memory.relatedMemories.forEach((relatedId) => {
      // Avoid duplicate links
      const existingLink = links.find(
        (l) =>
          (l.source === memory.id && l.target === relatedId) ||
          (l.source === relatedId && l.target === memory.id)
      );
      if (!existingLink) {
        links.push({
          source: memory.id,
          target: relatedId,
          strength: 0.5,
          type: 'semantic',
        });
      }
    });
  });

  // Create category links
  const categories = [...new Set(mockMemories.map((m) => m.category))];
  categories.forEach((category) => {
    const categoryMemories = mockMemories.filter((m) => m.category === category);
    for (let i = 0; i < categoryMemories.length - 1; i++) {
      links.push({
        source: categoryMemories[i].id,
        target: categoryMemories[i + 1].id,
        strength: 0.3,
        type: 'category',
      });
    }
  });

  // Create project links
  const projects = [...new Set(mockMemories.filter((m) => m.project).map((m) => m.project))];
  projects.forEach((project) => {
    const projectMemories = mockMemories.filter((m) => m.project === project);
    for (let i = 0; i < projectMemories.length - 1; i++) {
      links.push({
        source: projectMemories[i].id,
        target: projectMemories[i + 1].id,
        strength: 0.7,
        type: 'project',
      });
    }
  });

  return {
    nodes,
    links,
    clusters: mockClusters,
  };
}

// ============================================
// UTILITY FUNCTIONS FOR MOCK DATA
// ============================================

export function getMemoriesByCategory(category: string): MemoryNode[] {
  return mockMemories.filter((m) => m.category === category);
}

export function getMemoriesByProject(project: string): MemoryNode[] {
  return mockMemories.filter((m) => m.project === project);
}

export function getMemoriesByAgent(agentId: string): MemoryNode[] {
  return mockMemories.filter((m) => m.sourceAgent === agentId);
}

export function searchMemories(query: string): MemoryNode[] {
  const lowerQuery = query.toLowerCase();
  return mockMemories.filter(
    (m) =>
      m.content.toLowerCase().includes(lowerQuery) ||
      m.summary.toLowerCase().includes(lowerQuery) ||
      m.tags.some((t) => t.toLowerCase().includes(lowerQuery))
  );
}

export function getInsightForCluster(clusterId: string): AIInsight | undefined {
  const cluster = mockClusters.find((c) => c.id === clusterId);
  return cluster?.aiInsight;
}

export function getRelatedMemories(memoryId: string): MemoryNode[] {
  const memory = mockMemories.find((m) => m.id === memoryId);
  if (!memory) return [];
  return mockMemories.filter((m) => memory.relatedMemories.includes(m.id));
}

// Export the pre-generated graph data
export const graphData = generateGraphData();
