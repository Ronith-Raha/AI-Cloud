export type ProviderName = "openai" | "anthropic" | "gemini";

export type StreamChunk = {
  textDelta: string;
  requestId?: string;
  usage?: unknown;
};

export type StreamChatArgs = {
  model: string;
  system: string;
  context: string;
  userText: string;
};

export type CompleteArgs = {
  model: string;
  system: string;
  prompt: string;
};

export type ProviderAdapter = {
  streamChat: (args: StreamChatArgs) => AsyncGenerator<StreamChunk>;
  complete: (args: CompleteArgs) => Promise<{
    text: string;
    requestId?: string;
    usage?: unknown;
  }>;
};

export type ProviderError = {
  code: string;
  message: string;
  retryable: boolean;
};

