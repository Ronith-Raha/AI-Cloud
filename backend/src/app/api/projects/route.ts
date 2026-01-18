import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
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


