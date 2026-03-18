export const DEV_USER_ID = "dev";

/**
 * Cheap models used for internal tasks like summarization.
 * Maps provider name to a cost-effective model string.
 */
export const SUMMARY_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
  gemini: "gemini-2.0-flash"
};
