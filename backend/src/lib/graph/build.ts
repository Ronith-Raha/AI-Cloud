import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { vizEdges, vizNodes } from "@/lib/schema";

type Tx = Parameters<typeof db.transaction>[0] extends (tx: infer T) => unknown ? T : never;

export const createNodeWithEdge = async ({
  projectId,
  turnId,
  title,
  summary2sent
}: {
  projectId: string;
  turnId: string;
  title: string | null;
  summary2sent: string;
}) => {
  return db.transaction(async (tx: Tx) => {
    const [previous] = await tx
      .select()
      .from(vizNodes)
      .where(and(isNull(vizNodes.deletedAt), eq(vizNodes.projectId, projectId)))
      .orderBy(desc(vizNodes.createdAt))
      .limit(1);

    const [node] = await tx
      .insert(vizNodes)
      .values({
        projectId,
        turnId,
        title,
        summary2sent
      })
      .returning();

    if (previous) {
      await tx.insert(vizEdges).values({
        projectId,
        srcNodeId: previous.id,
        dstNodeId: node.id,
        relType: "follows",
        weight: 1
      });
    }

    return node;
  });
};

