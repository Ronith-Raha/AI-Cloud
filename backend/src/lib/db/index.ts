import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/schema";

const globalForDb = globalThis as unknown as {
  postgresClient?: postgres.Sql;
};

const getClient = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForDb.postgresClient) {
    globalForDb.postgresClient = postgres(databaseUrl, {
      max: 1,
      prepare: false
    });
  }
  return globalForDb.postgresClient;
};

export const db = drizzle(getClient(), { schema });
