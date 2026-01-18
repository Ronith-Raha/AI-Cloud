import type { GraphViewResponse, VizEdge, VizNode } from "./types";
import type { GraphData, GraphLink, GraphNode } from "@/types/nexus";

const DEFAULT_CATEGORY = "Conversation";
const PINNED_CATEGORY = "Pinned";
const CATEGORY_TAG_REGEX = /^\s*\[([^\]]+)\]\s*/;

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "your",
  "about",
  "have",
  "been",
  "into",
  "what",
  "when",
  "will",
  "are",
  "was",
  "were",
  "you",
  "use",
  "using",
  "we",
  "our",
  "their",
  "they",
  "not",
  "but"
]);

const CATEGORY_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  { category: "Tech", keywords: ["code", "coding", "engineer", "tech", "software", "api", "frontend", "backend", "react", "next", "database"] },
  { category: "Art", keywords: ["art", "design", "creative", "aesthetic", "color", "palette", "illustration", "drawing", "painting"] },
  { category: "Personal", keywords: ["personal", "family", "relationship", "friend", "home", "life"] },
  { category: "Work", keywords: ["work", "job", "career", "project", "deadline", "meeting", "client", "team"] },
  { category: "Learning", keywords: ["learn", "learning", "study", "course", "practice", "tutorial", "research"] },
  { category: "Health", keywords: ["health", "sleep", "exercise", "workout", "diet", "wellness", "doctor", "medical"] },
  { category: "Finance", keywords: ["finance", "budget", "money", "expense", "saving", "investment", "income", "salary"] },
  { category: "Conversation", keywords: ["conversation", "chat", "message"] }
];

function extractCategory(text: string | null | undefined) {
  if (!text) return { category: "", cleaned: "" };
  const match = text.match(CATEGORY_TAG_REGEX);
  if (!match) return { category: "", cleaned: text.trim() };
  return { category: match[1].trim(), cleaned: text.replace(CATEGORY_TAG_REGEX, "").trim() };
}

function inferCategory(text: string) {
  const lower = text.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => lower.includes(keyword))) {
      return entry.category;
    }
  }
  return DEFAULT_CATEGORY;
}

function mapNode(node: VizNode): GraphNode {
  const rawSummary = node.title?.trim() || node.summary2sent.trim();
  const summaryTag = extractCategory(rawSummary);
  const contentTag = extractCategory(node.summary2sent);
  const derivedCategory = summaryTag.category || contentTag.category;
  const inferredCategory = inferCategory(`${rawSummary} ${node.summary2sent}`);
  const category = node.pinned
    ? PINNED_CATEGORY
    : derivedCategory || inferredCategory || DEFAULT_CATEGORY;
  const summary = summaryTag.cleaned || contentTag.cleaned || rawSummary;
  const content = contentTag.cleaned || node.summary2sent;
  const now = new Date(node.createdAt);
  const updated = new Date(node.updatedAt);

  return {
    id: node.id,
    content,
    summary,
    type: "conversation",
    importance: node.pinned ? "high" : "medium",
    category,
    tags: node.pinned ? ["pinned"] : [],
    createdAt: now,
    updatedAt: updated,
    sourceAgent: "assistant",
    relatedMemories: [],
    pinned: node.pinned,
    userEdited: node.userEdited,
    isGroup: false,
    deletedAt: node.deletedAt ? new Date(node.deletedAt) : null,
    metadata: {
      confidence: node.userEdited ? 0.9 : 0.7
    },
    radius: node.pinned ? 42 : 32,
    depth: 1,
    turnId: node.turnId
  };
}

function mapEdge(edge: VizEdge): GraphLink {
  return {
    source: edge.srcNodeId,
    target: edge.dstNodeId,
    strength: edge.weight,
    type: edge.relType === "follows" ? "temporal" : "semantic"
  };
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function similarityScore(a: GraphNode, b: GraphNode) {
  const tokensA = new Set(tokenize(`${a.summary} ${a.content}`));
  const tokensB = new Set(tokenize(`${b.summary} ${b.content}`));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersection += 1;
  });
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function buildSimilarityEdges(nodes: GraphNode[]) {
  const edges: GraphLink[] = [];
  const realNodes = nodes.filter((node) => !node.isGroup);
  const seen = new Set<string>();

  realNodes.forEach((node, index) => {
    const scores: Array<{ node: GraphNode; score: number }> = [];
    for (let i = 0; i < realNodes.length; i += 1) {
      if (i === index) continue;
      const other = realNodes[i];
      const score = similarityScore(node, other);
      if (score > 0.18) {
        scores.push({ node: other, score });
      }
    }
    scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .forEach(({ node: other, score }) => {
        const key = [node.id, other.id].sort().join("::");
        if (seen.has(key)) return;
        seen.add(key);
        edges.push({
          source: node.id,
          target: other.id,
          strength: Math.min(0.9, 0.3 + score),
          type: "semantic"
        });
      });
  });

  return edges;
}

function buildGroupNodes(nodes: GraphNode[]) {
  const categories = new Map<string, number>();
  nodes.forEach((node) => {
    if (node.isGroup) return;
    categories.set(node.category, (categories.get(node.category) ?? 0) + 1);
  });

  return Array.from(categories.entries()).map(([category, count]) => {
    const now = new Date();
    return {
      id: `group:${category}`,
      content: `${count} memories`,
      summary: category,
      type: "project",
      importance: "medium",
      category,
      tags: [],
      createdAt: now,
      updatedAt: now,
      sourceAgent: "system",
      relatedMemories: [],
      pinned: false,
      userEdited: false,
      isGroup: true,
      groupKey: category,
      metadata: {
        confidence: 0.5
      },
      radius: 70,
      depth: 0
    } as GraphNode;
  });
}

export function mapGraphViewToGraphData(view: GraphViewResponse): GraphData {
  const baseNodes = view.nodes.map(mapNode);
  const similarityEdges = buildSimilarityEdges(baseNodes);

  return {
    nodes: baseNodes,
    links: [...view.edges.map(mapEdge), ...similarityEdges],
    clusters: []
  };
}

