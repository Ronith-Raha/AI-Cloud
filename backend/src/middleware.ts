import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const envOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const baseCorsHeaders = {
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-user-id"
};

const isAllowedOrigin = (origin: string) => {
  // Always allow localhost for dev
  if (origin.startsWith("http://localhost:")) return true;
  // Allow any Vercel preview/production URL
  if (origin.endsWith(".vercel.app") && origin.startsWith("https://")) return true;
  // Allow explicitly configured origins
  if (envOrigins.includes(origin)) return true;
  return false;
};

const getCorsHeaders = (origin: string | null) => {
  if (origin && isAllowedOrigin(origin)) {
    return {
      ...baseCorsHeaders,
      "Access-Control-Allow-Origin": origin
    };
  }
  // Fallback: if env origins configured, use the first one; otherwise block
  return {
    ...baseCorsHeaders,
    "Access-Control-Allow-Origin": envOrigins[0] ?? "http://localhost:3001"
  };
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const response = NextResponse.next();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: ["/api/:path*"]
};
