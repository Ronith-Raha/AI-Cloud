ALTER TABLE "turns"
  ADD COLUMN IF NOT EXISTS "compression_aggressiveness" double precision,
  ADD COLUMN IF NOT EXISTS "compression_max_output_tokens" integer,
  ADD COLUMN IF NOT EXISTS "compression_min_output_tokens" integer,
  ADD COLUMN IF NOT EXISTS "compression_input_tokens" integer,
  ADD COLUMN IF NOT EXISTS "compression_output_tokens" integer,
  ADD COLUMN IF NOT EXISTS "compression_ratio" double precision,
  ADD COLUMN IF NOT EXISTS "compression_time_ms" integer;

