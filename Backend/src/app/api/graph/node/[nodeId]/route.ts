import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, turns, vizNodes } from "@/lib/schema";
import { DEV_USER_ID } from "@/lib/constants";
import { apiError, jsonError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  nodeId: z.string().uuid()
});

export async function GET(
  _request: Request,
  context: { params: { nodeId?: string } }
) {
  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    return jsonError(apiError("bad_request", "Invalid node id", 400));
  }

  const rows = await db
    .select({
      node: vizNodes,
      turn: {
        id: turns.id,
        userText: turns.userText,
        assistantText: turns.assistantText,
        model: turns.model,
        provider: turns.provider,
        createdAt: turns.createdAt
      }
    })
    .from(vizNodes)
    .innerJoin(projects, eq(projects.id, vizNodes.projectId))
    .innerJoin(turns, eq(turns.id, vizNodes.turnId))
    .where(
      and(eq(vizNodes.id, parsed.data.nodeId), eq(projects.userId, DEV_USER_ID))
    )
    .limit(1);

  if (rows.length === 0) {
    return jsonError(apiError("not_found", "Node not found", 404));
  }

  return NextResponse.json(rows[0]);
}

