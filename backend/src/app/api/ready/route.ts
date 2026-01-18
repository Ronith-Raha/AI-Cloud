import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ready" });
  } catch (error) {
    return NextResponse.json(
      { status: "not_ready", message: "Database unavailable" },
      { status: 503 }
    );
  }
}

