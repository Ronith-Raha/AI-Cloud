import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { DEV_USER_ID } from "@/lib/constants";
import {
  projectZep,
  projects,
  turns,
  vizNodes
} from "@/lib/schema";
import { buildInjectedContext, DEFAULT_SYSTEM_INSTRUCTIONS } from "@/lib/memory/inject";
import { compressText } from "@/lib/token_company";
import { zepAddMessages, zepGetContext } from "@/lib/zep";
import { getProviderAdapter } from "@/lib/providers";
import type { ProviderName } from "@/lib/providers/types";
import { summarizeTurn } from "@/lib/memory/summarize";
import { createNodeWithEdge } from "@/lib/graph/build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  projectId: z.string().uuid(),
  provider: z.enum(["openai", "anthropic", "gemini"]),
  model: z.string().min(1),
  userText: z.string().min(1)
});

const sseHeaders = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive"
};

const createEventPayload = (event: string, data: unknown) =>
  `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;

const COMPRESSION_SETTINGS = {
  aggressiveness: 0.4,
  maxOutputTokens: 512,
  minOutputTokens: 64
};

export async function POST(request: Request) {
  let payload: z.infer<typeof requestSchema>;
  try {
    payload = requestSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      { code: "bad_request", message: "Invalid request body" },
      { status: 400 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(createEventPayload(event, data)));
      };

      try {
        const project = await db
          .select()
          .from(projects)
          .where(
            and(eq(projects.id, payload.projectId), eq(projects.userId, DEV_USER_ID))
          )
          .limit(1);

        if (project.length === 0) {
          sendEvent("error", { code: "not_found", message: "Project not found" });
          return;
        }

        await db
          .insert(projectZep)
          .values({
            projectId: payload.projectId,
            zepUserId: DEV_USER_ID,
            zepSessionId: payload.projectId
          })
          .onConflictDoUpdate({
            target: projectZep.projectId,
            set: {
              zepUserId: DEV_USER_ID,
              zepSessionId: payload.projectId
            }
          });

        const pinnedNodes = await db
          .select({
            summary: vizNodes.summary2sent
          })
          .from(vizNodes)
          .where(
            and(
              eq(vizNodes.projectId, payload.projectId),
              eq(vizNodes.pinned, true),
              isNull(vizNodes.deletedAt)
            )
          )
          .orderBy(desc(vizNodes.updatedAt));

        let zepContext = "";
        try {
          zepContext = await zepGetContext(payload.projectId, DEV_USER_ID);
        } catch (error) {
          zepContext = "";
        }

        const pinnedSummaries = pinnedNodes.map(
          (node: { summary: string }) => node.summary
        );
        const pinnedLines = pinnedSummaries
          .map((summary) => `- ${summary}`)
          .join("\n");
        let compressionMeta:
          | {
              aggressiveness: number;
              maxOutputTokens: number;
              minOutputTokens: number;
              outputTokens: number;
              originalInputTokens: number;
              compressionTime: number;
            }
          | undefined;
        let compressedMemoryContext: string | undefined;

        if (pinnedLines.trim().length > 0) {
          const compressed = await compressText({
            input: pinnedLines,
            aggressiveness: COMPRESSION_SETTINGS.aggressiveness,
            maxOutputTokens: COMPRESSION_SETTINGS.maxOutputTokens,
            minOutputTokens: COMPRESSION_SETTINGS.minOutputTokens
          });
          if (compressed) {
            compressedMemoryContext = compressed.output;
            compressionMeta = {
              aggressiveness: COMPRESSION_SETTINGS.aggressiveness,
              maxOutputTokens: COMPRESSION_SETTINGS.maxOutputTokens,
              minOutputTokens: COMPRESSION_SETTINGS.minOutputTokens,
              outputTokens: compressed.outputTokens,
              originalInputTokens: compressed.originalInputTokens,
              compressionTime: compressed.compressionTime
            };
          }
        }

        const injectedContext = buildInjectedContext({
          system: DEFAULT_SYSTEM_INSTRUCTIONS,
          pinnedSummaries,
          zepContext,
          userText: payload.userText,
          memoryContextOverride: compressedMemoryContext
        });

        const adapter = getProviderAdapter(payload.provider as ProviderName);

        let assistantText = "";
        let providerRequestId: string | undefined;
        const startTime = Date.now();

        for await (const chunk of adapter.streamChat({
          model: payload.model,
          system: "",
          context: injectedContext,
          userText: payload.userText
        })) {
          if (chunk.requestId) {
            providerRequestId = chunk.requestId;
          }
          if (chunk.textDelta) {
            assistantText += chunk.textDelta;
            sendEvent("token", { text: chunk.textDelta });
          }
        }

        const latencyMs = Date.now() - startTime;

        const summary = await summarizeTurn({
          provider: payload.provider as ProviderName,
          model: payload.model,
          userText: payload.userText,
          assistantText
        });

        const [turn] = await db
          .insert(turns)
          .values({
            projectId: payload.projectId,
            provider: payload.provider,
            model: payload.model,
            userText: payload.userText,
            assistantText,
            injectedContextText: injectedContext,
            compressionAggressiveness: compressionMeta?.aggressiveness,
            compressionMaxOutputTokens: compressionMeta?.maxOutputTokens,
            compressionMinOutputTokens: compressionMeta?.minOutputTokens,
            compressionInputTokens: compressionMeta?.originalInputTokens,
            compressionOutputTokens: compressionMeta?.outputTokens,
            compressionRatio:
              compressionMeta && compressionMeta.originalInputTokens > 0
                ? compressionMeta.outputTokens / compressionMeta.originalInputTokens
                : undefined,
            compressionTimeMs: compressionMeta?.compressionTime,
            latencyMs,
            providerRequestId
          })
          .returning();

        const node = await createNodeWithEdge({
          projectId: payload.projectId,
          turnId: turn.id,
          title: summary.title,
          summary2sent: summary.summary_2sent
        });

        try {
          await zepAddMessages(payload.projectId, DEV_USER_ID, [
            { role: "user", content: payload.userText },
            { role: "assistant", content: assistantText }
          ]);
        } catch (error) {
          console.error("Zep memory.add failed", error);
        }

        sendEvent("complete", { turnId: turn.id, nodeId: node.id });
      } catch (error) {
        const err =
          typeof error === "object" && error && "code" in error
            ? (error as { code: string; message?: string })
            : { code: "provider_error", message: "Provider request failed" };
        sendEvent("error", {
          code: err.code,
          message: err.message ?? "Provider request failed"
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, { headers: sseHeaders });
}

