import postgres from "postgres";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

try {
  await sql`DELETE FROM viz_edges`;
  await sql`DELETE FROM viz_nodes`;
  await sql`DELETE FROM turns`;
  await sql`DELETE FROM project_zep`;
  await sql`DELETE FROM projects`;
  console.log("Demo data cleared.");
} catch (error) {
  console.error("Failed to clear demo data:", error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}

