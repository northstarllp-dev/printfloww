ALTER TABLE "admin_users" ALTER COLUMN "shop_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "role" text DEFAULT 'SHOPKEEPER' NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "shopkeeper_name" text;