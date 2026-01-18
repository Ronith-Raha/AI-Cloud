import { NextResponse } from "next/server";
import { z } from "zod";
import { and, asc, eq, gt, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, turns, vizNodes } from "@/lib/schema";
import { DEV_USER_ID } from "@/lib/constants";
import { apiError, jsonError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  projectId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  cursor: z.string().optional()
});

type Cursor = { createdAt: Date; id: string };

const parseCursor = (cursor?: string): Cursor | null => {
  if (!cursor) return null;
  const [createdAtRaw, id] = cursor.split("|");
  if (!createdAtRaw || !id) return null;
  const createdAt = new Date(createdAtRaw);
  if (Number.isNaN(createdAt.getTime())) return null;
  return { createdAt, id };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    projectId: url.searchParams.get("projectId"),
    limit: url.searchParams.get("limit") ?? "100",
    cursor: url.searchParams.get("cursor") ?? undefined
  });

  if (!parsed.success) {
    return jsonError(apiError("bad_request", "Invalid query params", 400));
  }

  const project = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, parsed.data.projectId), eq(projects.userId, DEV_USER_ID)))
    .limit(1);

  if (project.length === 0) {
    return jsonError(apiError("not_found", "Project not found", 404));
  }

  const cursor = parseCursor(parsed.data.cursor);
  const limit = parsed.data.limit;

  const whereClause = cursor
    ? and(
        eq(turns.projectId, parsed.data.projectId),
        or(
          gt(turns.createdAt, cursor.createdAt),
          and(eq(turns.createdAt, cursor.createdAt), gt(turns.id, cursor.id))
        )
      )
    : eq(turns.projectId, parsed.data.projectId);

  const rows = await db
    .select({
      id: turns.id,
      createdAt: turns.createdAt,
      provider: turns.provider,
      model: turns.model,
      userText: turns.userText,
      assistantText: turns.assistantText
    })
    .from(turns)
    .where(whereClause)
    .orderBy(asc(turns.createdAt), asc(turns.id))
    .limit(limit + 1);

  const sliced = rows.slice(0, limit);
  const turnIds = sliced.map((row) => row.id);

  const nodeRows =
    turnIds.length > 0
      ? await db
          .select({
            id: vizNodes.id,
            turnId: vizNodes.turnId,
            createdAt: vizNodes.createdAt
          })
          .from(vizNodes)
          .where(inArray(vizNodes.turnId, turnIds))
          .orderBy(asc(vizNodes.createdAt))
      : [];

  const nodeIdByTurn = new Map<string, string>();
  nodeRows.forEach((node) => {
    if (!nodeIdByTurn.has(node.turnId)) {
      nodeIdByTurn.set(node.turnId, node.id);
    }
  });

  const turnsPayload = sliced.map((row) => ({
    turnId: row.id,
    nodeId: nodeIdByTurn.get(row.id) ?? null,
    createdAt: row.createdAt,
    provider: row.provider,
    model: row.model,
    userText: row.userText,
    assistantText: row.assistantText
  }));

  const nextCursor =
    rows.length > limit
      ? `${rows[limit].createdAt.toISOString()}|${rows[limit].id}`
      : null;

  return NextResponse.json({
    turns: turnsPayload,
    nextCursor
  });
}

