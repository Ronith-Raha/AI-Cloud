import type { CompressionConfig } from "./types";

export const getCompressionConfig = (): CompressionConfig => ({
  apiKey: process.env.TTC_API_KEY ?? "",
  baseUrl: process.env.TTC_BASE_URL ?? "https://api.thetokencompany.com",
  timeout: parseInt(process.env.TTC_TIMEOUT ?? "10000", 10),
  model: "bear-1",
  aggressiveness: parseFloat(process.env.TTC_AGGRESSIVENESS ?? "0.5"),
  enabled: !!process.env.TTC_API_KEY && process.env.TTC_ENABLED !== "false"
});
