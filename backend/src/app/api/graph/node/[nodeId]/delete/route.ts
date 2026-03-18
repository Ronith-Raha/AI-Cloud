import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, vizNodes } from "@/lib/schema";
import { getUserId } from "@/lib/auth";
import { apiError, jsonError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  nodeId: z.string().uuid()
});

export async function POST(
  request: Request,
  context: { params: Promise<{ nodeId: string }> }
) {
  const userId = getUserId(request);
  const params = await context.params;
  const parsed = paramsSchema.safeParse({ nodeId: params?.nodeId });
  if (!parsed.success) {
    return jsonError(apiError("bad_request", "Invalid node id", 400));
  }

  const node = await db
    .select({ id: vizNodes.id })
    .from(vizNodes)
    .innerJoin(projects, eq(projects.id, vizNodes.projectId))
    .where(
      and(eq(vizNodes.id, parsed.data.nodeId), eq(projects.userId, userId))
    )
    .limit(1);

  if (node.length === 0) {
    return jsonError(apiError("not_found", "Node not found", 404));
  }

  await db
    .update(vizNodes)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(vizNodes.id, parsed.data.nodeId));

  return NextResponse.json({ status: "ok" });
}
