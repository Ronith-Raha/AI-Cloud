import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { vizEdges, vizNodes } from "@/lib/schema";

type Tx = Parameters<typeof db.transaction>[0] extends (tx: infer T) => unknown ? T : never;

/**
 * Compute a simple keyword-overlap similarity score between two texts.
 * Returns a value in (0, 1]. Minimum 0.1 so edges are never zero-weight.
 */
const computeSimilarity = (a: string, b: string): number => {
  const tokenize = (text: string) =>
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 3)
    );
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0.1;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  const jaccard = intersection / union;
  return Math.max(0.1, Math.round(jaccard * 100) / 100);
};

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
      const weight = computeSimilarity(
        previous.summary2sent,
        summary2sent
      );
      await tx.insert(vizEdges).values({
        projectId,
        srcNodeId: previous.id,
        dstNodeId: node.id,
        relType: "follows",
        weight
      });
    }

    return node;
  });
};
