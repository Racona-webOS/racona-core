CREATE TABLE "platform"."scheduled_job_runs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"job_ref" integer NOT NULL,
	"plugin_id" varchar(255),
	"job_id" varchar(100) NOT NULL,
	"trigger" varchar(10) NOT NULL,
	"triggered_by" integer,
	"scheduled_for" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" varchar(20) NOT NULL,
	"result" jsonb,
	"error" text,
	"logs" jsonb,
	"instance_id" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "platform"."scheduled_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"plugin_id" varchar(255),
	"job_id" varchar(100) NOT NULL,
	"handler" varchar(100) NOT NULL,
	"schedule" varchar(100) NOT NULL,
	"timezone" varchar(64) NOT NULL,
	"catch_up" varchar(10) DEFAULT 'once' NOT NULL,
	"timeout_seconds" integer DEFAULT 600 NOT NULL,
	"description" jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"next_run_at" timestamp with time zone,
	"last_run_at" timestamp with time zone,
	"last_status" varchar(20),
	"last_error" text,
	"last_duration_ms" integer,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"failure_notified_at" timestamp with time zone,
	"locked_by" varchar(100),
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_scheduled_jobs_plugin_job" UNIQUE NULLS NOT DISTINCT("plugin_id","job_id")
);
--> statement-breakpoint
ALTER TABLE "platform"."scheduled_job_runs" ADD CONSTRAINT "scheduled_job_runs_job_ref_scheduled_jobs_id_fk" FOREIGN KEY ("job_ref") REFERENCES "platform"."scheduled_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."scheduled_job_runs" ADD CONSTRAINT "scheduled_job_runs_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."scheduled_jobs" ADD CONSTRAINT "scheduled_jobs_plugin_id_apps_app_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "platform"."apps"("app_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_scheduled_job_runs_slot" ON "platform"."scheduled_job_runs" USING btree ("job_ref","scheduled_for");--> statement-breakpoint
CREATE INDEX "idx_scheduled_job_runs_job_started" ON "platform"."scheduled_job_runs" USING btree ("job_ref","started_at");--> statement-breakpoint
CREATE INDEX "idx_scheduled_job_runs_started" ON "platform"."scheduled_job_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_scheduled_jobs_due" ON "platform"."scheduled_jobs" USING btree ("enabled","next_run_at");