type CompressionSettings = {
  aggressiveness: number;
  maxOutputTokens: number;
  minOutputTokens: number;
};

type CompressionRequest = CompressionSettings & {
  input: string;
};

export type CompressionResult = {
  output: string;
  outputTokens: number;
  originalInputTokens: number;
  compressionTime: number;
};

const TOKENCO_URL = "https://api.thetokencompany.com/v1/compress";
const TOKENCO_MODEL = "bear-1";
const DEFAULT_TIMEOUT_MS = 6000;

export const compressText = async ({
  input,
  aggressiveness,
  maxOutputTokens,
  minOutputTokens
}: CompressionRequest): Promise<CompressionResult | null> => {
  const apiKey = process.env.TOKENCO_API_KEY;
  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(TOKENCO_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: TOKENCO_MODEL,
        compression_settings: {
          aggressiveness,
          max_output_tokens: maxOutputTokens,
          min_output_tokens: minOutputTokens
        },
        input
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.warn("TokenCo compression failed", response.status);
      return null;
    }

    const payload = (await response.json()) as {
      output?: string;
      output_tokens?: number;
      original_input_tokens?: number;
      compression_time?: number;
    };

    if (!payload.output) {
      console.warn("TokenCo compression returned empty output");
      return null;
    }

    return {
      output: payload.output,
      outputTokens: payload.output_tokens ?? 0,
      originalInputTokens: payload.original_input_tokens ?? 0,
      compressionTime: payload.compression_time ?? 0
    };
  } catch (error) {
    console.warn("TokenCo compression error", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

