import { TokenCompanyClient } from "./client";
import { getCompressionConfig } from "./config";
import type { CompressionResult } from "./types";

export type { CompressionResult, CompressionConfig } from "./types";
export {
  TTCAPIError,
  TTCAuthenticationError,
  TTCInvalidRequestError,
  TTCRateLimitError
} from "./types";

let clientInstance: TokenCompanyClient | null = null;

const getClient = (): TokenCompanyClient | null => {
  const config = getCompressionConfig();

  if (!config.enabled) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = new TokenCompanyClient(config);
  }

  return clientInstance;
};

const createFallbackResult = (input: string): CompressionResult => ({
  compressed: input,
  originalTokens: 0,
  compressedTokens: 0,
  compressionRatio: 1,
  compressionTimeMs: 0,
  wasCompressed: false
});

export const compressContext = async (
  input: string
): Promise<CompressionResult> => {
  const client = getClient();

  if (!client) {
    return createFallbackResult(input);
  }

  try {
    const result = await client.compressInput(input);
    console.log(
      `[TTC] Compressed ${result.originalTokens} → ${result.compressedTokens} tokens (${(result.compressionRatio * 100).toFixed(1)}%) in ${result.compressionTimeMs}ms`
    );
    return result;
  } catch (error) {
    console.error("[TTC] Compression failed, using uncompressed:", error);
    return createFallbackResult(input);
  }
};

export const isCompressionEnabled = (): boolean => {
  const config = getCompressionConfig();
  return config.enabled;
};
