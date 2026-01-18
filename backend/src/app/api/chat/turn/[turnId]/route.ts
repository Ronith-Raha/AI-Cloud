import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { turns, projects } from "@/lib/schema";
import { DEV_USER_ID } from "@/lib/constants";
import { apiError, jsonError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const turnIdSchema = z.string().uuid();
const updateSchema = z
  .object({
    userText: z.string().trim().min(1).optional(),
    assistantText: z.string().trim().min(1).optional()
  })
  .refine((data) => data.userText || data.assistantText, {
    message: "No updates provided"
  });

export async function PATCH(
  request: Request,
  context: { params: Promise<{ turnId: string }> }
) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const params = await context.params;
  const turnId = params?.turnId ?? segments.at(-1);
  const parsed = turnIdSchema.safeParse(turnId);
  if (!parsed.success) {
    return jsonError(apiError("bad_request", "Invalid turn id", 400));
  }

  let payload: z.infer<typeof updateSchema>;
  try {
    payload = updateSchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return jsonError(apiError("bad_request", message, 400));
  }

  const rows = await db
    .select({ id: turns.id })
    .from(turns)
    .innerJoin(projects, eq(projects.id, turns.projectId))
    .where(and(eq(turns.id, parsed.data), eq(projects.userId, DEV_USER_ID)))
    .limit(1);

  if (rows.length === 0) {
    return jsonError(apiError("not_found", "Turn not found", 404));
  }

  await db
    .update(turns)
    .set({
      ...(payload.userText ? { userText: payload.userText } : {}),
      ...(payload.assistantText ? { assistantText: payload.assistantText } : {})
    })
    .where(eq(turns.id, parsed.data));

  return NextResponse.json({ status: "ok" });
}


