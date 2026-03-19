import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/schema";

const globalForDb = globalThis as unknown as {
  postgresClient?: postgres.Sql;
  drizzleDb?: PostgresJsDatabase<typeof schema>;
};

function getDb(): PostgresJsDatabase<typeof schema> {
  if (globalForDb.drizzleDb) {
    return globalForDb.drizzleDb;
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const client = postgres(databaseUrl, {
    max: 1,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10
  });
  globalForDb.postgresClient = client;
  globalForDb.drizzleDb = drizzle(client, { schema });
  return globalForDb.drizzleDb;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const realDb = getDb();
    const value = (realDb as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(realDb);
    }
    return value;
  }
});
