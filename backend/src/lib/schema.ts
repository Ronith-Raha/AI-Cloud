import {
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid
} from "drizzle-orm/pg-core";

export const providerEnum = pgEnum("provider_enum", [
  "openai",
  "anthropic",
  "gemini"
]);

export const edgeRelEnum = pgEnum("edge_rel_enum", ["follows", "similar"]);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false })
    .defaultNow()
    .notNull()
});

export const projectZep = pgTable("project_zep", {
  projectId: uuid("project_id")
    .primaryKey()
    .references(() => projects.id, { onDelete: "cascade" }),
  zepUserId: text("zep_user_id").notNull(),
  zepSessionId: text("zep_session_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull()
});

export const turns = pgTable("turns", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  provider: providerEnum("provider").notNull(),
  model: text("model").notNull(),
  userText: text("user_text").notNull(),
  assistantText: text("assistant_text").notNull(),
  injectedContextText: text("injected_context_text").notNull(),
  compressionAggressiveness: doublePrecision("compression_aggressiveness"),
  compressionMaxOutputTokens: integer("compression_max_output_tokens"),
  compressionMinOutputTokens: integer("compression_min_output_tokens"),
  compressionInputTokens: integer("compression_input_tokens"),
  compressionOutputTokens: integer("compression_output_tokens"),
  compressionRatio: doublePrecision("compression_ratio"),
  compressionTimeMs: integer("compression_time_ms"),
  latencyMs: integer("latency_ms"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  providerRequestId: text("provider_request_id"),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull()
});

export const vizNodes = pgTable("viz_nodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  turnId: uuid("turn_id")
    .references(() => turns.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").default("turn").notNull(),
  title: text("title"),
  summary2sent: text("summary_2sent").notNull(),
  pinned: boolean("pinned").default(false).notNull(),
  userEdited: boolean("user_edited").default(false).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false })
    .defaultNow()
    .notNull()
});

export const vizEdges = pgTable(
  "viz_edges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    srcNodeId: uuid("src_node_id")
      .references(() => vizNodes.id, { onDelete: "cascade" })
      .notNull(),
    dstNodeId: uuid("dst_node_id")
      .references(() => vizNodes.id, { onDelete: "cascade" })
      .notNull(),
    relType: edgeRelEnum("rel_type").notNull(),
    weight: doublePrecision("weight").default(1).notNull()
  },
  (table) => ({
    uniq: unique("viz_edges_unique").on(
      table.projectId,
      table.srcNodeId,
      table.dstNodeId,
      table.relType
    )
  })
);

