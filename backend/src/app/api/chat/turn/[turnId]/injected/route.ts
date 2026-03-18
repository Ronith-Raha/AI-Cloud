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

export async function GET(
  request: Request,
  context: { params: Promise<{ turnId: string }> }
) {
  const userId = getUserId(request);
  const params = await context.params;
  const parsed = paramsSchema.safeParse({ turnId: params?.turnId });
  if (!parsed.success) {
    return jsonError(apiError("bad_request", "Invalid turn id", 400));
  }

  const rows = await db
    .select({
      turnId: turns.id,
      projectId: turns.projectId,
      injectedContextText: turns.injectedContextText
    })
    .from(turns)
    .innerJoin(projects, eq(projects.id, turns.projectId))
    .where(
      and(eq(turns.id, parsed.data.turnId), eq(projects.userId, userId))
    )
    .limit(1);

  if (rows.length === 0) {
    return jsonError(apiError("not_found", "Turn not found", 404));
  }

  return NextResponse.json(rows[0]);
}
