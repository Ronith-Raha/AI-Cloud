export type CompressionModel = "bear-1";

export interface CompressInputRequest {
  input: string;
  model?: CompressionModel;
  aggressiveness?: number; // 0.0-1.0
  max_output_tokens?: number;
  min_output_tokens?: number;
}

export interface CompressInputResponse {
  output: string;
  output_tokens: number;
  original_input_tokens: number;
  compression_time: number;
}

export interface CompressionResult {
  compressed: string;
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  compressionTimeMs: number;
  wasCompressed: boolean;
}

export interface CompressionConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  model: CompressionModel;
  aggressiveness: number;
  enabled: boolean;
}

export class TTCAuthenticationError extends Error {
  name = "TTCAuthenticationError" as const;
  constructor(message = "Authentication failed") {
    super(message);
  }
}

export class TTCInvalidRequestError extends Error {
  name = "TTCInvalidRequestError" as const;
  constructor(message = "Invalid request") {
    super(message);
  }
}

export class TTCRateLimitError extends Error {
  name = "TTCRateLimitError" as const;
  retryAfter?: number;
  constructor(message = "Rate limit exceeded", retryAfter?: number) {
    super(message);
    this.retryAfter = retryAfter;
  }
}

export class TTCAPIError extends Error {
  name = "TTCAPIError" as const;
  statusCode?: number;
  constructor(message = "API error", statusCode?: number) {
    super(message);
    this.statusCode = statusCode;
  }
}
