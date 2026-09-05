ALTER TABLE "tickets" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "assigned_name" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "shared_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_share_token_unique" UNIQUE("share_token");--> statement-breakpoint
-- Any tickets issued before this column existed still need a share handle.
UPDATE "tickets" SET "share_token" = replace(gen_random_uuid()::text, '-', '') WHERE "share_token" IS NULL;
