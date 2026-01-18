DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'edge_rel_enum'
  ) THEN
    CREATE TYPE "public"."edge_rel_enum" AS ENUM ('follows', 'similar');
  END IF;
END $$;

CREATE TYPE "public"."provider_enum" AS ENUM('openai', 'anthropic', 'gemini');--> statement-breakpoint
CREATE TABLE "project_zep" (
	"project_id" uuid PRIMARY KEY NOT NULL,
	"zep_user_id" text NOT NULL,
	"zep_session_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "viz_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"src_node_id" uuid NOT NULL,
	"dst_node_id" uuid NOT NULL,
	"rel_type" "edge_rel_enum" NOT NULL,
	"weight" double precision DEFAULT 1 NOT NULL,
	CONSTRAINT "viz_edges_unique" UNIQUE("project_id","src_node_id","dst_node_id","rel_type")
);
--> statement-breakpoint
CREATE TABLE "viz_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"turn_id" uuid NOT NULL,
	"type" text DEFAULT 'turn' NOT NULL,
	"title" text,
	"summary_2sent" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"user_edited" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_zep" ADD CONSTRAINT "project_zep_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viz_edges" ADD CONSTRAINT "viz_edges_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viz_edges" ADD CONSTRAINT "viz_edges_src_node_id_viz_nodes_id_fk" FOREIGN KEY ("src_node_id") REFERENCES "public"."viz_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viz_edges" ADD CONSTRAINT "viz_edges_dst_node_id_viz_nodes_id_fk" FOREIGN KEY ("dst_node_id") REFERENCES "public"."viz_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viz_nodes" ADD CONSTRAINT "viz_nodes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viz_nodes" ADD CONSTRAINT "viz_nodes_turn_id_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."turns"("id") ON DELETE cascade ON UPDATE no action;