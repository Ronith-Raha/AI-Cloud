import Anthropic from "@anthropic-ai/sdk";
import { ProviderAdapter, ProviderError } from "@/lib/providers/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const normalizeError = (error: unknown): ProviderError => {
  const message =
    error instanceof Error ? error.message : "Anthropic request failed";
  return {
    code: "anthropic_error",
    message,
    retryable: true
  };
};

const getTextFromContent = (
  content: Anthropic.Messages.ContentBlock[]
) =>
  content
    .map((block) => ("text" in block ? block.text : ""))
    .join("");

export const anthropicAdapter: ProviderAdapter = {
  async *streamChat({ model, context, system }) {
    try {
      const stream = await client.messages.create({
        model,
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: context }],
        stream: true
      });

      let requestId: string | undefined;
      for await (const event of stream) {
        if (event.type === "message_start") {
          requestId = event.message.id;
        }
        if (event.type === "content_block_delta") {
          const text = event.delta.text ?? "";
          if (text) {
            yield { textDelta: text, requestId };
          }
        }
      }
    } catch (error) {
      throw normalizeError(error);
    }
  },
  async complete({ model, prompt, system }) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: 400,
        system,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      });

      return {
        text: getTextFromContent(response.content),
        requestId: response.id,
        usage: response.usage
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }
};

