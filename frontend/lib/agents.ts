import type { Agent } from "@/types/nexus";

export const DEFAULT_PROVIDER = "openai";
export const DEFAULT_MODEL = "gpt-4o-mini";

export const PROVIDER_MODELS: Record<string, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o"],
  anthropic: ["claude-3-haiku-20240307"],
  gemini: ["gemini-2.5-flash", "gemini-1.5-pro"]
};

export const agents: Agent[] = [
  {
    id: "nexus-assistant",
    name: "Nexus",
    description: "Context-aware assistant grounded in your memory graph.",
    avatar: "🧠",
    color: "#4F46E5",
    capabilities: ["Memory grounding", "Graph context", "Conversation"],
    memoryCount: 0,
    lastInteraction: new Date(),
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL
  }
];

