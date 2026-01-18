import { NextResponse } from "next/server";
import { getProviderAdapter } from "@/lib/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const model =
    url.searchParams.get("model") ?? "claude-3-haiku-20240307";

  try {
    const adapter = getProviderAdapter("anthropic");
    const response = await adapter.complete({
      model,
      system: "You are a system check. Respond with OK.",
      prompt: "Say OK."
    });
    return NextResponse.json({
      ok: true,
      model,
      text: response.text,
      requestId: response.requestId
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Anthropic test failed";
    return NextResponse.json(
      { ok: false, model, message },
      { status: 500 }
    );
  }
}

