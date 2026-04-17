CREATE TABLE "platform"."ai_agent_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" varchar(50) NOT NULL,
	"api_key" text NOT NULL,
	"model_name" varchar(100),
	"base_url" text,
	"max_tokens" integer DEFAULT 1000,
	"temperature" numeric(3, 2) DEFAULT '0.70',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform"."ai_agent_configs" ADD CONSTRAINT "ai_agent_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;