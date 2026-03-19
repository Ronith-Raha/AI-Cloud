import OpenAI from "openai";
import { ProviderError, ProviderAdapter } from "@/lib/providers/types";

let _client: OpenAI | null = null;
const getClient = () => {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
};

const normalizeError = (error: unknown): ProviderError => {
  const message =
    error instanceof Error ? error.message : "OpenAI request failed";
  return {
    code: "openai_error",
    message,
    retryable: true
  };
};

export const openaiAdapter: ProviderAdapter = {
  async *streamChat({ model, context, system }) {
    try {
      const client = getClient();
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (system) {
        messages.push({ role: "system", content: system });
      }
      messages.push({ role: "user", content: context });

      const stream = await client.chat.completions.create({
        model,
        stream: true,
        messages
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (delta) {
          yield {
            textDelta: delta,
            requestId: chunk.id,
            usage: chunk.usage
          };
        }
      }
    } catch (error) {
      throw normalizeError(error);
    }
  },
  async complete({ model, prompt, system }) {
    try {
      const client = getClient();
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      });
      return {
        text: response.choices[0]?.message?.content ?? "",
        requestId: response.id,
        usage: response.usage
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }
};
