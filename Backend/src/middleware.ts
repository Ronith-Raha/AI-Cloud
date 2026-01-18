import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const defaultOrigin = "http://localhost:3001";
const allowedOrigin = process.env.CORS_ORIGIN ?? defaultOrigin;

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key"
};

export function middleware(request: NextRequest) {
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

