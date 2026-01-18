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

const normalizeModel = (model: string) => {
  if (model === "claude-3-5-sonnet-latest") {
    return "claude-3-sonnet-20240229";
  }
  if (model === "claude-3-5-haiku-latest") {
    return "claude-3-haiku-20240307";
  }
  if (model === "claude-3-5-sonnet-20240620") {
    return "claude-3-sonnet-20240229";
  }
  if (model === "claude-3-5-haiku-20240307") {
    return "claude-3-haiku-20240307";
  }
  if (model.startsWith("claude-3-5-sonnet")) {
    return "claude-3-haiku-20240307";
  }
  if (model.startsWith("claude-3-5-haiku")) {
    return "claude-3-haiku-20240307";
  }
  if (model.startsWith("claude-3-sonnet")) {
    return "claude-3-haiku-20240307";
  }
  if (model.startsWith("claude-3-opus")) {
    return "claude-3-haiku-20240307";
  }
  return model;
};

export const anthropicAdapter: ProviderAdapter = {
  async *streamChat({ model, context, system }) {
    try {
      const resolvedModel = normalizeModel(model);
      const stream = await client.messages.create({
        model: resolvedModel,
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
          const text = "text" in event.delta ? event.delta.text ?? "" : "";
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
      const resolvedModel = normalizeModel(model);
      const response = await client.messages.create({
        model: resolvedModel,
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

