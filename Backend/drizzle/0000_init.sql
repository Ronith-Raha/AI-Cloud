CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "provider_enum" AS ENUM ('openai', 'anthropic', 'gemini');
CREATE TYPE "edge_rel_enum" AS ENUM ('follows', 'similar');

CREATE TABLE "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "project_zep" (
  "project_id" uuid PRIMARY KEY REFERENCES "projects" ("id") ON DELETE CASCADE,
  "zep_user_id" text NOT NULL,
  "zep_session_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "turns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects" ("id") ON DELETE CASCADE,
  "provider" "provider_enum" NOT NULL,
  "model" text NOT NULL,
  "user_text" text NOT NULL,
  "assistant_text" text NOT NULL,
  "injected_context_text" text NOT NULL,
  "latency_ms" integer,
  "input_tokens" integer,
  "output_tokens" integer,
  "provider_request_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "viz_nodes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects" ("id") ON DELETE CASCADE,
  "turn_id" uuid NOT NULL REFERENCES "turns" ("id") ON DELETE CASCADE,
  "type" text NOT NULL DEFAULT 'turn',
  "title" text,
  "summary_2sent" text NOT NULL,
  "pinned" boolean NOT NULL DEFAULT false,
  "user_edited" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "viz_edges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects" ("id") ON DELETE CASCADE,
  "src_node_id" uuid NOT NULL REFERENCES "viz_nodes" ("id") ON DELETE CASCADE,
  "dst_node_id" uuid NOT NULL REFERENCES "viz_nodes" ("id") ON DELETE CASCADE,
  "rel_type" "edge_rel_enum" NOT NULL,
  "weight" double precision NOT NULL DEFAULT 1.0,
  CONSTRAINT "viz_edges_unique" UNIQUE ("project_id", "src_node_id", "dst_node_id", "rel_type")
);

