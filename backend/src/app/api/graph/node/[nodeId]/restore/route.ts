import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, vizNodes } from "@/lib/schema";
import { DEV_USER_ID } from "@/lib/constants";
import { apiError, jsonError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  nodeId: z.string().uuid()
});

export async function POST(
  request: Request,
  context: { params: { nodeId?: string } }
) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const nodeId = context.params?.nodeId ?? segments.at(-2);
  const parsedParams = paramsSchema.safeParse({ nodeId });
  if (!parsedParams.success) {
    return jsonError(apiError("bad_request", "Invalid node id", 400));
  }

  const [node] = await db
    .select({
      id: vizNodes.id
    })
    .from(vizNodes)
    .innerJoin(projects, eq(projects.id, vizNodes.projectId))
    .where(
      and(eq(vizNodes.id, parsedParams.data.nodeId), eq(projects.userId, DEV_USER_ID))
    )
    .limit(1);

  if (!node) {
    return jsonError(apiError("not_found", "Node not found", 404));
  }

  await db
    .update(vizNodes)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(vizNodes.id, node.id));

  return NextResponse.json({ status: "ok" });
}

