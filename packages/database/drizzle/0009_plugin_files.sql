CREATE TABLE "platform"."plugin_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plugin_id" varchar(255) NOT NULL,
	"storage_path" text NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size" bigint NOT NULL,
	"sha256" char(64) NOT NULL,
	"ref" varchar(255),
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"claimed_at" timestamp with time zone,
	CONSTRAINT "plugin_files_storage_path_unique" UNIQUE("storage_path")
);
--> statement-breakpoint
ALTER TABLE "platform"."plugin_files" ADD CONSTRAINT "plugin_files_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_plugin_files_plugin" ON "platform"."plugin_files" USING btree ("plugin_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_files_unclaimed" ON "platform"."plugin_files" USING btree ("created_at") WHERE "platform"."plugin_files"."claimed_at" IS NULL;