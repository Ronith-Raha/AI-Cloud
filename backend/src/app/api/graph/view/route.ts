import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, vizEdges, vizNodes } from "@/lib/schema";
import { DEV_USER_ID } from "@/lib/constants";
import { apiError, jsonError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  projectId: z.string().uuid(),
  level: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  includeDeleted: z.coerce.boolean().default(false)
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    projectId: url.searchParams.get("projectId"),
    level: url.searchParams.get("level") ?? "0",
    limit: url.searchParams.get("limit") ?? "100",
    includeDeleted: url.searchParams.get("includeDeleted") ?? "0"
  });

  if (!parsed.success) {
    return jsonError(apiError("bad_request", "Invalid query params", 400));
  }

  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, parsed.data.projectId), eq(projects.userId, DEV_USER_ID)))
    .limit(1);

  if (project.length === 0) {
    return jsonError(apiError("not_found", "Project not found", 404));
  }

  const nodeQuery = db
    .select()
    .from(vizNodes)
    .where(eq(vizNodes.projectId, parsed.data.projectId));

  const nodes = await (parsed.data.includeDeleted
    ? nodeQuery
    : nodeQuery.where(isNull(vizNodes.deletedAt)))
    .orderBy(desc(vizNodes.createdAt))
    .limit(parsed.data.limit);

  const nodeIds = nodes.map((node) => node.id);
  const edges =
    nodeIds.length > 0
      ? await db
          .select()
          .from(vizEdges)
          .where(
            and(
              eq(vizEdges.projectId, parsed.data.projectId),
              inArray(vizEdges.srcNodeId, nodeIds),
              inArray(vizEdges.dstNodeId, nodeIds),
              eq(vizEdges.relType, "follows")
            )
          )
      : [];

  return NextResponse.json({
    level: parsed.data.level,
    nodes,
    edges
  });
}

