CREATE TYPE "public"."binding" AS ENUM('NONE', 'SPIRAL');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('QUOTE_CREATED', 'PAYMENT_VERIFICATION_PENDING', 'PAID', 'PRINTING', 'READY_FOR_PICKUP', 'COMPLETED', 'PAYMENT_REJECTED');--> statement-breakpoint
CREATE TYPE "public"."paper_size" AS ENUM('A4', 'A3');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"shop_id" uuid NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"original_name" text NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"page_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"paper_size" "paper_size" NOT NULL,
	"copies" integer NOT NULL,
	"binding" "binding" NOT NULL,
	"lamination" boolean NOT NULL,
	"entire_document_color" boolean NOT NULL,
	"color_page_ranges" text,
	"total_pages" integer NOT NULL,
	"color_pages" integer NOT NULL,
	"bw_pages" integer NOT NULL,
	CONSTRAINT "order_options_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text,
	"tracking_token_hash" text NOT NULL,
	"status" "order_status" DEFAULT 'QUOTE_CREATED' NOT NULL,
	"amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"quote" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_tracking_token_hash_unique" UNIQUE("tracking_token_hash")
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"upi_id" text NOT NULL,
	"email" text,
	"bw_price_a4" numeric(10, 2) DEFAULT '2.00' NOT NULL,
	"bw_price_a3" numeric(10, 2) DEFAULT '4.00' NOT NULL,
	"color_price_a4" numeric(10, 2) DEFAULT '10.00' NOT NULL,
	"color_price_a3" numeric(10, 2) DEFAULT '20.00' NOT NULL,
	"spiral_binding_price" numeric(10, 2) DEFAULT '40.00' NOT NULL,
	"lamination_price" numeric(10, 2) DEFAULT '30.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"note" text,
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_options" ADD CONSTRAINT "order_options_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "files_order_id_idx" ON "files" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_tracking_token_hash_idx" ON "orders" USING btree ("tracking_token_hash");--> statement-breakpoint
CREATE INDEX "status_history_order_id_idx" ON "status_history" USING btree ("order_id");