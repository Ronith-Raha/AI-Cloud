import { GoogleGenerativeAI } from "@google/generative-ai";
import { ProviderAdapter, ProviderError } from "@/lib/providers/types";

const apiKey = process.env.GEMINI_API_KEY ?? "";
const client = new GoogleGenerativeAI(apiKey);

const normalizeError = (error: unknown): ProviderError => {
  const message =
    error instanceof Error ? error.message : "Gemini request failed";
  return {
    code: "gemini_error",
    message,
    retryable: true
  };
};

export const geminiAdapter: ProviderAdapter = {
  async *streamChat({ model, context, system }) {
    try {
      const gemini = client.getGenerativeModel({
        model,
        systemInstruction: system || undefined
      });

      const result = await gemini.generateContentStream({
        contents: [{ role: "user", parts: [{ text: context }] }]
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield { textDelta: text };
        }
      }
    } catch (error) {
      throw normalizeError(error);
    }
  },
  async complete({ model, prompt, system }) {
    try {
      const gemini = client.getGenerativeModel({
        model,
        systemInstruction: system || undefined
      });

      const result = await gemini.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });

      return {
        text: result.response.text()
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }
};

