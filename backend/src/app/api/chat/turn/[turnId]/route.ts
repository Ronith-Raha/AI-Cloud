import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, turns } from "@/lib/schema";
import { getUserId } from "@/lib/auth";
import { apiError, jsonError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  turnId: z.string().uuid()
});

const bodySchema = z.object({
  userText: z.string().optional(),
  assistantText: z.string().optional()
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ turnId: string }> }
) {
  const userId = getUserId(request);
  const params = await context.params;
  const parsed = paramsSchema.safeParse({ turnId: params?.turnId });
  if (!parsed.success) {
    return jsonError(apiError("bad_request", "Invalid turn id", 400));
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return jsonError(apiError("bad_request", "Invalid request body", 400));
  }

  const turn = await db
    .select({ id: turns.id })
    .from(turns)
    .innerJoin(projects, eq(projects.id, turns.projectId))
    .where(
      and(eq(turns.id, parsed.data.turnId), eq(projects.userId, userId))
    )
    .limit(1);

  if (turn.length === 0) {
    return jsonError(apiError("not_found", "Turn not found", 404));
  }

  const updates: Record<string, unknown> = {};
  if (body.userText !== undefined) updates.userText = body.userText;
  if (body.assistantText !== undefined) updates.assistantText = body.assistantText;

  if (Object.keys(updates).length > 0) {
    await db
      .update(turns)
      .set(updates)
      .where(eq(turns.id, parsed.data.turnId));
  }

  return NextResponse.json({ status: "ok" });
}
