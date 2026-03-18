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

const bodySchema = z.object({
  title: z.string().optional(),
  summary2sent: z.string().optional(),
  pinned: z.boolean().optional()
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

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return jsonError(apiError("bad_request", "Invalid request body", 400));
  }

  const node = await db
    .select({ id: vizNodes.id, projectId: vizNodes.projectId })
    .from(vizNodes)
    .innerJoin(projects, eq(projects.id, vizNodes.projectId))
    .where(
      and(eq(vizNodes.id, parsed.data.nodeId), eq(projects.userId, userId))
    )
    .limit(1);

  if (node.length === 0) {
    return jsonError(apiError("not_found", "Node not found", 404));
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.summary2sent !== undefined) updates.summary2sent = body.summary2sent;
  if (body.pinned !== undefined) updates.pinned = body.pinned;
  if (body.title !== undefined || body.summary2sent !== undefined) {
    updates.userEdited = true;
  }

  await db
    .update(vizNodes)
    .set(updates)
    .where(eq(vizNodes.id, parsed.data.nodeId));

  return NextResponse.json({ status: "ok" });
}
