CREATE TABLE "platform"."ai_provider_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"model_id" varchar(150) NOT NULL,
	"display_name" varchar(150) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_provider_models_provider_id_model_id_unique" UNIQUE("provider_id","model_id")
);
--> statement-breakpoint
ALTER TABLE "platform"."ai_provider_models" ADD CONSTRAINT "ai_provider_models_provider_id_ai_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "platform"."ai_providers"("id") ON DELETE cascade ON UPDATE no action;