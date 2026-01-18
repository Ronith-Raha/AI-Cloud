import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/schema";

const globalForDb = globalThis as unknown as {
  postgresClient?: postgres.Sql;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const client =
  globalForDb.postgresClient ??
  postgres(databaseUrl, {
    max: 10
  });

globalForDb.postgresClient = client;

export const db = drizzle(client, { schema });

