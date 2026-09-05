CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_whatsapp" text NOT NULL,
	"buyer_note" text,
	"claimed_cents" integer DEFAULT 0 NOT NULL,
	"ocr_cents" integer,
	"ocr_text" text,
	"ocr_ran_at" timestamp with time zone,
	"approved_cents" integer,
	"screenshot_key" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reject_reason" text,
	"decided_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	CONSTRAINT "orders_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"result" text NOT NULL,
	"scanned_by" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"code" text NOT NULL,
	"seq" integer NOT NULL,
	"status" text DEFAULT 'valid' NOT NULL,
	"used_at" timestamp with time zone,
	"used_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_scans_at" ON "scans" USING btree ("at");--> statement-breakpoint
CREATE INDEX "idx_tickets_order" ON "tickets" USING btree ("order_id","seq");