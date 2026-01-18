import { getProviderAdapter } from "@/lib/providers";
import type { ProviderName } from "@/lib/providers/types";

const SUMMARY_SYSTEM =
  "You summarize chat turns. Return strict JSON with keys title and summary_2sent.";

const SUMMARY_PROMPT = (userText: string, assistantText: string) => `Return JSON {"title":"...","summary_2sent":"..."} derived only from the following user+assistant exchange.\n\nUser:\n${userText}\n\nAssistant:\n${assistantText}`;

const extractJson = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return null;
};

const trimText = (value: string, max: number) =>
  value.length > max ? value.slice(0, max) : value;

export const summarizeTurn = async ({
  provider,
  model,
  userText,
  assistantText
}: {
  provider: ProviderName;
  model: string;
  userText: string;
  assistantText: string;
}) => {
  const fallback = {
    title: null as string | null,
    summary_2sent: `${trimText(userText, 240)} / ${trimText(assistantText, 240)}`
  };

  try {
    const adapter = getProviderAdapter(provider);
    const response = await adapter.complete({
      model,
      system: SUMMARY_SYSTEM,
      prompt: SUMMARY_PROMPT(userText, assistantText)
    });
    const json = extractJson(response.text);
    if (!json) {
      return fallback;
    }
    const parsed = JSON.parse(json) as {
      title?: string;
      summary_2sent?: string;
    };
    if (!parsed.summary_2sent?.trim()) {
      return fallback;
    }
    return {
      title: parsed.title?.trim() || null,
      summary_2sent: parsed.summary_2sent.trim()
    };
  } catch (error) {
    return fallback;
  }
};

