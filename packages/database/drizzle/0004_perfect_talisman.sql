CREATE TABLE "platform"."admin_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_key" varchar(100) NOT NULL,
	"config_data" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	CONSTRAINT "admin_config_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "platform"."usage_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_key" varchar(100) NOT NULL,
	"service_type" varchar(50) NOT NULL,
	"provider_name" varchar(100) NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"tokens_used" integer,
	"characters_processed" integer,
	"estimated_cost" numeric(10, 4) NOT NULL,
	"date" date NOT NULL,
	CONSTRAINT "usage_metrics_config_key_service_type_provider_name_date_unique" UNIQUE("config_key","service_type","provider_name","date")
);
--> statement-breakpoint
ALTER TABLE "platform"."admin_config" ADD CONSTRAINT "admin_config_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;