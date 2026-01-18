import postgres from "postgres";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

try {
  const projects = await sql`SELECT id FROM projects WHERE name = 'Local Project'`;
  const ids = projects.map((row) => row.id);
  if (ids.length === 0) {
    console.log("No Local Project rows found.");
  } else {
    await sql`DELETE FROM viz_edges WHERE project_id IN ${sql(ids)}`;
    await sql`DELETE FROM viz_nodes WHERE project_id IN ${sql(ids)}`;
    await sql`DELETE FROM turns WHERE project_id IN ${sql(ids)}`;
    await sql`DELETE FROM project_zep WHERE project_id IN ${sql(ids)}`;
    await sql`DELETE FROM projects WHERE id IN ${sql(ids)}`;
    console.log(`Deleted ${ids.length} Local Project entries.`);
  }
} catch (error) {
  console.error("Failed to delete Local Project rows:", error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}

