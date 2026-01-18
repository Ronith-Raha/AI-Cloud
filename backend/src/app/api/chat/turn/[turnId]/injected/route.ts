import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { turns, projects } from "@/lib/schema";
import { DEV_USER_ID } from "@/lib/constants";
import { apiError, jsonError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const turnIdSchema = z.string().uuid();

export async function GET(
  request: Request,
  context: { params: Promise<{ turnId: string }> }
) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const params = await context.params;
  const turnId = params?.turnId ?? segments.at(-2);
  const parsed = turnIdSchema.safeParse(turnId);
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
    .where(and(eq(turns.id, parsed.data), eq(projects.userId, DEV_USER_ID)))
    .limit(1);

  if (rows.length === 0) {
    return jsonError(apiError("not_found", "Turn not found", 404));
  }

  return NextResponse.json(rows[0]);
}

