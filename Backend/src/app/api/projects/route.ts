import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { projects, turns, vizEdges, vizNodes } from "@/lib/schema";
import { DEV_USER_ID } from "@/lib/constants";
import { apiError, jsonError } from "@/lib/errors";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(200)
});

export async function POST(request: Request) {
  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch (error) {
    return jsonError(apiError("bad_request", "Invalid request body", 400));
  }

  try {
    const [project] = await db
      .insert(projects)
      .values({
        name: body.name,
        userId: DEV_USER_ID
      })
      .returning();

    try {
      await seedProject(project.id);
    } catch (error) {
      console.error("Seed project failed", error);
    }

    return NextResponse.json({ projectId: project.id });
  } catch (error) {
    return jsonError(apiError("server_error", "Failed to create project", 500));
  }
}

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, DEV_USER_ID))
      .orderBy(desc(projects.createdAt));
    return NextResponse.json({
      projects: rows.map(
        (row: { id: string; name: string; createdAt: Date }) => ({
        id: row.id,
        name: row.name,
        createdAt: row.createdAt
      })
      )
    });
  } catch (error) {
    return jsonError(apiError("server_error", "Failed to list projects", 500));
  }
}

async function seedProject(projectId: string) {
  const seeds = [
    {
      title: "[Tech] Graph Explorer",
      summary2sent:
        "[Tech] You are prototyping a lightweight knowledge explorer with a graph view and streaming chat responses.",
      userText: "Seed: tech project context",
      assistantText:
        "Seeded memory about a tech project involving a graph view and streaming chat."
    },
    {
      title: "[Tech] Realtime Updates",
      summary2sent:
        "[Tech] You want streaming updates to feel instant while keeping the UI responsive.",
      userText: "Seed: realtime behavior",
      assistantText:
        "Seeded memory about responsive UI expectations for realtime updates."
    },
    {
      title: "[Tech] Data Hygiene",
      summary2sent:
        "[Tech] You value clean data flows, typed APIs, and minimal client-side duplication.",
      userText: "Seed: data practices",
      assistantText:
        "Seeded memory about preferring typed APIs and clean data flow."
    },
    {
      title: "[Health] Healthcare Habits",
      summary2sent:
        "[Health] You aim for daily movement and stay up to date with healthcare checkups and preventive care.",
      userText: "Seed: health habits",
      assistantText:
        "Seeded memory about health habits and healthcare maintenance."
    },
    {
      title: "[Health] Energy Balance",
      summary2sent:
        "[Health] You try to balance deep work with short breaks to avoid burnout.",
      userText: "Seed: energy balance",
      assistantText:
        "Seeded memory about balancing focus time with breaks."
    },
    {
      title: "[Health] Sleep Routine",
      summary2sent:
        "[Health] You prefer a consistent sleep schedule and wind down without screens.",
      userText: "Seed: sleep routine",
      assistantText:
        "Seeded memory about maintaining a consistent sleep routine."
    },
    {
      title: "[Finance] Budget Rhythm",
      summary2sent:
        "[Finance] You track monthly spending and prefer simple budgeting categories to stay on target.",
      userText: "Seed: finance habits",
      assistantText:
        "Seeded memory about budgeting preferences and spending tracking."
    },
    {
      title: "[Finance] Savings Goal",
      summary2sent:
        "[Finance] You set a monthly savings target and adjust discretionary spend to meet it.",
      userText: "Seed: savings goal",
      assistantText:
        "Seeded memory about monthly savings targets."
    },
    {
      title: "[Finance] Subscription Review",
      summary2sent:
        "[Finance] You review subscriptions quarterly to keep recurring costs lean.",
      userText: "Seed: subscription review",
      assistantText:
        "Seeded memory about reviewing recurring subscriptions."
    }
  ];

  const createdNodes: Array<{ id: string }> = [];

  for (const seed of seeds) {
    const [turn] = await db
      .insert(turns)
      .values({
        projectId,
        provider: "openai",
        model: "gpt-4o-mini",
        userText: seed.userText,
        assistantText: seed.assistantText,
        injectedContextText: seed.summary2sent,
        latencyMs: 0
      })
      .returning();

    const [node] = await db
      .insert(vizNodes)
      .values({
        projectId,
        turnId: turn.id,
        title: seed.title,
        summary2sent: seed.summary2sent,
        pinned: seed.pinned ?? false,
        userEdited: false
      })
      .returning();

    createdNodes.push({ id: node.id });
  }

  for (let i = 0; i < createdNodes.length - 1; i += 1) {
    await db.insert(vizEdges).values({
      projectId,
      srcNodeId: createdNodes[i].id,
      dstNodeId: createdNodes[i + 1].id,
      relType: "follows",
      weight: 1
    });
  }
}

