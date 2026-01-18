import type {
  CompressionConfig,
  CompressionResult,
  CompressInputResponse
} from "./types";
import {
  TTCAPIError,
  TTCAuthenticationError,
  TTCInvalidRequestError,
  TTCRateLimitError
} from "./types";

export class TokenCompanyClient {
  private config: CompressionConfig;

  constructor(config: CompressionConfig) {
    this.config = config;
  }

  async compressInput(input: string): Promise<CompressionResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/compress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          input,
          model: this.config.model,
          aggressiveness: this.config.aggressiveness
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data: CompressInputResponse = await response.json();

      const compressionRatio =
        data.original_input_tokens > 0
          ? data.output_tokens / data.original_input_tokens
          : 1;

      return {
        compressed: data.output,
        originalTokens: data.original_input_tokens,
        compressedTokens: data.output_tokens,
        compressionRatio,
        compressionTimeMs: data.compression_time,
        wasCompressed: true
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new TTCAPIError("Request timed out", 408);
      }

      throw error;
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const retryAfter = response.headers.get("Retry-After");

    switch (response.status) {
      case 401:
        throw new TTCAuthenticationError("Invalid API key");
      case 400:
        throw new TTCInvalidRequestError("Invalid request parameters");
      case 429:
        throw new TTCRateLimitError(
          "Rate limit exceeded",
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      default:
        throw new TTCAPIError(
          `API error: ${response.statusText}`,
          response.status
        );
    }
  }
}
