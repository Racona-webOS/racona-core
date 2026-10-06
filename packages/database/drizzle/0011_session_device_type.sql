ALTER TABLE "auth"."sessions" ALTER COLUMN "user_agent" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN "device_type" varchar(16);--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "auth"."sessions" USING btree ("user_id");