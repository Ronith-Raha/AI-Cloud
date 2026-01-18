import { anthropicAdapter } from "@/lib/providers/anthropic";
import { geminiAdapter } from "@/lib/providers/gemini";
import { openaiAdapter } from "@/lib/providers/openai";
import type { ProviderAdapter, ProviderName } from "@/lib/providers/types";

export const getProviderAdapter = (provider: ProviderName): ProviderAdapter => {
  switch (provider) {
    case "openai":
      return openaiAdapter;
    case "anthropic":
      return anthropicAdapter;
    case "gemini":
      return geminiAdapter;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};

