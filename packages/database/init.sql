BEGIN;

-- ============================================================
-- ElyOS — Database Init Script
-- Generated: 2026-04-07T10:54:10.244Z
-- Admin email: szig83@gmail.com
--
-- Futtatás:
--   psql -U <user> -d <database> -f init.sql
-- ============================================================

-- ============================================================
-- 1. Sémák létrehozása
-- ============================================================
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS extensions;

-- ============================================================
-- 2. PostgreSQL extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "postgres-json-schema" SCHEMA extensions;

-- ============================================================
-- 3. Táblastruktúra (Drizzle migrációk)
-- ============================================================
-- Migration: 0000_white_lord_tyger.sql
CREATE TABLE "auth"."accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider_account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" varchar(255),
	"id_token" text,
	"is_active" boolean DEFAULT true,
	"password" varchar(255),
	"failed_login_attempts" integer DEFAULT 0,
	"last_login_at" timestamp with time zone,
	"password_changed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "platform"."apps" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_id" varchar(50) NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"version" varchar(20) NOT NULL,
	"icon" varchar(100) NOT NULL,
	"icon_style" varchar(20) DEFAULT 'icon',
	"category" varchar(50) NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"multi_instance" boolean DEFAULT false,
	"default_size" jsonb NOT NULL,
	"min_size" jsonb NOT NULL,
	"max_size" jsonb,
	"author" varchar(100),
	"keywords" jsonb DEFAULT '[]'::jsonb,
	"help_id" integer,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"app_type" varchar(20) DEFAULT 'core',
	"plugin_version" varchar(20),
	"plugin_author" varchar(255),
	"plugin_description" text,
	"plugin_permissions" jsonb,
	"plugin_dependencies" jsonb,
	"plugin_min_webos_version" varchar(20),
	"plugin_status" varchar(20) DEFAULT 'active',
	"plugin_installed_at" timestamp with time zone,
	"plugin_updated_at" timestamp with time zone,
	CONSTRAINT "apps_app_id_unique" UNIQUE("app_id")
);
CREATE TABLE "auth"."audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_type" varchar(50) NOT NULL,
	"resource_type" varchar(50),
	"resource_id" integer,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "platform"."conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant1_id" integer NOT NULL,
	"participant2_id" integer NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "platform"."desktop_shortcuts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"app_id" varchar(100) NOT NULL,
	"position" jsonb NOT NULL,
	"label" varchar(255),
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "platform"."email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar(255),
	"recipient" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"template_type" varchar(100),
	"status" varchar(50) NOT NULL,
	"error_message" text,
	"sent_at" timestamp with time zone DEFAULT now(),
	"delivered_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "platform"."email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_type" varchar(100) NOT NULL,
	"locale" varchar(10) DEFAULT 'hu' NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject_template" text NOT NULL,
	"html_template" text NOT NULL,
	"text_template" text NOT NULL,
	"required_data" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"optional_data" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "email_templates_type_locale_unique" UNIQUE("template_type","locale")
);
CREATE TABLE "platform"."error_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" varchar(10) NOT NULL,
	"message" text NOT NULL,
	"source" varchar(50) NOT NULL,
	"stack" text,
	"context" jsonb,
	"user_id" varchar(255),
	"url" varchar(2048),
	"method" varchar(10),
	"route_id" varchar(255),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "platform"."files" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(36) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"scope" varchar(20) NOT NULL,
	"user_id" integer,
	"mime_type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"storage_path" text NOT NULL,
	"thumbnail_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "files_public_id_unique" UNIQUE("public_id")
);
CREATE TABLE "auth"."group_app_access" (
	"group_id" integer NOT NULL,
	"app_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "group_app_access_group_id_app_id_pk" PRIMARY KEY("group_id","app_id")
);
CREATE TABLE "auth"."group_permissions" (
	"group_id" serial NOT NULL,
	"permission_id" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "group_permissions_group_id_permission_id_pk" PRIMARY KEY("group_id","permission_id")
);
CREATE TABLE "auth"."groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "platform"."locales" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"native_name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "locales_code_unique" UNIQUE("code")
);
CREATE TABLE "platform"."messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"content" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"is_read" boolean DEFAULT false NOT NULL
);
CREATE TABLE "platform"."notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "platform"."notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"app_name" text,
	"title" jsonb NOT NULL,
	"message" jsonb NOT NULL,
	"details" jsonb,
	"type" text DEFAULT 'info' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
CREATE TABLE "auth"."permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"resource_id" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
CREATE TABLE "platform"."plugin_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"plugin_id" varchar(255) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_data" jsonb,
	"user_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "platform"."plugin_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"plugin_id" varchar(255) NOT NULL,
	"metric_type" varchar(50) NOT NULL,
	"metric_value" varchar(50) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "platform"."plugin_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"plugin_id" varchar(255) NOT NULL,
	"role_id" varchar(255),
	"group_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "auth"."providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"enabled" boolean DEFAULT true,
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "providers_name_unique" UNIQUE("name")
);
CREATE TABLE "auth"."resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "resources_name_unique" UNIQUE("name")
);
CREATE TABLE "auth"."role_app_access" (
	"role_id" integer NOT NULL,
	"app_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "role_app_access_role_id_app_id_pk" PRIMARY KEY("role_id","app_id")
);
CREATE TABLE "auth"."role_permissions" (
	"role_id" serial NOT NULL,
	"permission_id" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
CREATE TABLE "auth"."roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "auth"."sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" varchar(255),
	"user_agent" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
CREATE TABLE "platform"."theme_presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"locale" varchar(10) DEFAULT 'hu' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"settings" jsonb NOT NULL,
	"is_default" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "theme_presets_locale_name_unique" UNIQUE("locale","name")
);
CREATE TABLE "platform"."translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"locale" varchar(10) NOT NULL,
	"namespace" varchar(100) NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "auth"."two_factors" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" integer NOT NULL
);
CREATE TABLE "auth"."user_groups" (
	"user_id" integer,
	"group_id" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_groups_user_id_group_id_pk" PRIMARY KEY("user_id","group_id")
);
CREATE TABLE "auth"."user_roles" (
	"user_id" integer,
	"role_id" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
CREATE TABLE "auth"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false,
	"two_factor_enabled" boolean DEFAULT false,
	"username" varchar(50),
	"image" varchar(255),
	"oauth_image" varchar(255),
	"user_settings" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
CREATE TABLE "auth"."verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE "auth"."accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."accounts" ADD CONSTRAINT "accounts_provider_id_providers_name_fk" FOREIGN KEY ("provider_id") REFERENCES "auth"."providers"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."desktop_shortcuts" ADD CONSTRAINT "desktop_shortcuts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."group_app_access" ADD CONSTRAINT "group_app_access_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "auth"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."group_app_access" ADD CONSTRAINT "group_app_access_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "platform"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."group_permissions" ADD CONSTRAINT "group_permissions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "auth"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."group_permissions" ADD CONSTRAINT "group_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "auth"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."permissions" ADD CONSTRAINT "permissions_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "auth"."resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."plugin_logs" ADD CONSTRAINT "plugin_logs_plugin_id_apps_app_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "platform"."apps"("app_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."plugin_metrics" ADD CONSTRAINT "plugin_metrics_plugin_id_apps_app_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "platform"."apps"("app_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."plugin_permissions" ADD CONSTRAINT "plugin_permissions_plugin_id_apps_app_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "platform"."apps"("app_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."role_app_access" ADD CONSTRAINT "role_app_access_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."role_app_access" ADD CONSTRAINT "role_app_access_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "platform"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "auth"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."two_factors" ADD CONSTRAINT "two_factors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_groups" ADD CONSTRAINT "user_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_groups" ADD CONSTRAINT "user_groups_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "auth"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_apps_app_type" ON "platform"."apps" USING btree ("app_type");--> statement-breakpoint
CREATE INDEX "idx_apps_plugin_status" ON "platform"."apps" USING btree ("plugin_status");--> statement-breakpoint
CREATE INDEX "desktop_shortcuts_user_id_idx" ON "platform"."desktop_shortcuts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "desktop_shortcuts_app_id_idx" ON "platform"."desktop_shortcuts" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "email_logs_recipient_idx" ON "platform"."email_logs" USING btree ("recipient");--> statement-breakpoint
CREATE INDEX "email_logs_status_idx" ON "platform"."email_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_logs_created_at_idx" ON "platform"."email_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_logs_message_id_idx" ON "platform"."email_logs" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "email_logs_recipient_status_idx" ON "platform"."email_logs" USING btree ("recipient","status");--> statement-breakpoint
CREATE INDEX "email_logs_status_created_at_idx" ON "platform"."email_logs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "email_templates_type_idx" ON "platform"."email_templates" USING btree ("template_type");--> statement-breakpoint
CREATE INDEX "email_templates_locale_idx" ON "platform"."email_templates" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "email_templates_is_active_idx" ON "platform"."email_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "email_templates_type_locale_active_idx" ON "platform"."email_templates" USING btree ("template_type","locale","is_active");--> statement-breakpoint
CREATE INDEX "email_templates_created_at_idx" ON "platform"."email_templates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_templates_updated_at_idx" ON "platform"."email_templates" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "error_logs_level_idx" ON "platform"."error_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "error_logs_source_idx" ON "platform"."error_logs" USING btree ("source");--> statement-breakpoint
CREATE INDEX "error_logs_created_at_idx" ON "platform"."error_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "error_logs_level_created_at_idx" ON "platform"."error_logs" USING btree ("level","created_at");--> statement-breakpoint
CREATE INDEX "idx_plugin_logs_plugin_id" ON "platform"."plugin_logs" USING btree ("plugin_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_logs_event_type" ON "platform"."plugin_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_plugin_logs_created_at" ON "platform"."plugin_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_plugin_metrics_plugin_id" ON "platform"."plugin_metrics" USING btree ("plugin_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_metrics_metric_type" ON "platform"."plugin_metrics" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "idx_plugin_metrics_created_at" ON "platform"."plugin_metrics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_plugin_permissions_plugin_id" ON "platform"."plugin_permissions" USING btree ("plugin_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_permissions_role_id" ON "platform"."plugin_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_permissions_group_id" ON "platform"."plugin_permissions" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "theme_presets_locale_idx" ON "platform"."theme_presets" USING btree ("locale");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_translation_idx" ON "platform"."translations" USING btree ("locale","namespace","key");

-- Migration: 0001_bright_polaris.sql
CREATE TABLE "platform"."activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action_key" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"resource_type" varchar(100),
	"resource_id" varchar(255),
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "activity_logs_user_id_idx" ON "platform"."activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_logs_action_key_idx" ON "platform"."activity_logs" USING btree ("action_key");--> statement-breakpoint
CREATE INDEX "activity_logs_created_at_idx" ON "platform"."activity_logs" USING btree ("created_at");

-- ============================================================
-- 4. Seed adatok
-- ============================================================
-- Seed: resources — Resource definitions for permission system
-- Resources seed data
INSERT INTO auth.resources (id, name, description) VALUES
  (1, 'users', 'Felhasználók kezelése'),
  (2, 'groups', 'Csoportok kezelése'),
  (3, 'roles', 'Szerepkörök kezelése'),
  (4, 'permissions', 'Jogosultságok kezelése'),
  (5, 'resources', 'Erőforrások kezelése'),
  (6, 'content', 'Tartalmak kezelése'),
  (7, 'settings', 'Rendszerbeállítások kezelése'),
  (8, 'log', 'Naplózás kezelése'),
  (9, 'plugin', 'Plugin kezelése')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Seed: providers — Authentication providers
-- Providers seed data
INSERT INTO auth.providers (name, enabled, config) VALUES
  ('credential', true, '{"allowRegistration": true, "requireEmailVerification": true, "passwordMinLength": 8}'),
  ('google', true, '{"clientId": "YOUR_GOOGLE_CLIENT_ID", "clientSecret": "YOUR_GOOGLE_CLIENT_SECRET", "callbackUrl": "http://localhost:3000/api/auth/callback/google"}'),
  ('facebook', false, '{"clientId": "", "clientSecret": "", "callbackUrl": "http://localhost:3000/api/auth/callback/facebook"}'),
  ('github', false, '{"clientId": "", "clientSecret": "", "callbackUrl": "http://localhost:3000/api/auth/callback/github"}')
ON CONFLICT (name) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  config = EXCLUDED.config;

-- Seed: groups — User groups
-- Groups seed data
INSERT INTO auth.groups (id, name, description) VALUES
  (1, '{"hu": "Rendszergazda", "en": "System Administrator"}', '{"hu": "Korlátlan jogosultsággal rendelkező felhasználók, akik a teljes rendszert felügyelik és karbantartják", "en": "Users with unlimited privileges who oversee and maintain the entire system"}'),
  (2, '{"hu": "Adminisztrátor", "en": "Administrator"}', '{"hu": "Teljes hozzáféréssel rendelkező felhasználók, akik kezelhetik a felhasználókat és minden adminisztrációs funkciót elérnek", "en": "Users with full access who can manage users and access all administrative functions"}'),
  (3, '{"hu": "Tartalomszerkesztő", "en": "Content Editor"}', '{"hu": "Tartalmak létrehozására és szerkesztésére jogosult felhasználók", "en": "Users authorized to create and edit content"}'),
  (4, '{"hu": "Általános felhasználó", "en": "General User"}', '{"hu": "Alapszintű hozzáféréssel rendelkező regisztrált felhasználók", "en": "Registered users with basic access level"}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Szekvencia frissítése a legnagyobb id alapján
SELECT setval('auth.groups_id_seq', (SELECT COALESCE(MAX(id), 0) FROM auth.groups));

-- Seed: roles — User roles
-- Roles seed data
INSERT INTO auth.roles (id, name, description) VALUES
  (1, '{"hu": "Rendszergazda", "en": "System Administrator"}', '{"hu": "Korlátlan jogosultsággal rendelkező szerep", "en": "Role with unlimited privileges"}'),
  (2, '{"hu": "Adminisztrátor", "en": "Administrator"}', '{"hu": "Adminisztrációs feladatok elvégzésére jogosult szerep", "en": "Role authorized for administrative tasks"}'),
  (3, '{"hu": "Szerkesztő", "en": "Editor"}', '{"hu": "Tartalmak kezelésére jogosult szerep", "en": "Role authorized for content management"}'),
  (4, '{"hu": "Felhasználó", "en": "User"}', '{"hu": "Alapszintű felhasználói szerep", "en": "Basic user role"}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Szekvencia frissítése a legnagyobb id alapján
SELECT setval('auth.roles_id_seq', (SELECT COALESCE(MAX(id), 0) FROM auth.roles));

-- Seed: permissions — Permissions linked to resources
-- Permissions seed data
INSERT INTO auth.permissions (id, name, description, resource_id) VALUES
  -- Users app - Users management
  (1, 'users.users.view', 'Felhasználók megtekintése', 1),
  (2, 'users.users.create', 'Felhasználók létrehozása', 1),
  (3, 'users.users.update', 'Felhasználók módosítása', 1),
  (4, 'users.users.delete', 'Felhasználók törlése', 1),

  -- Users app - Groups management
  (5, 'users.groups.view', 'Csoportok megtekintése', 2),
  (6, 'users.groups.create', 'Csoportok létrehozása', 2),
  (7, 'users.groups.update', 'Csoportok módosítása', 2),
  (8, 'users.groups.delete', 'Csoportok törlése', 2),

  -- Users app - Roles management
  (9, 'users.roles.view', 'Szerepkörök megtekintése', 3),
  (10, 'users.roles.create', 'Szerepkörök létrehozása', 3),
  (11, 'users.roles.update', 'Szerepkörök módosítása', 3),
  (12, 'users.roles.delete', 'Szerepkörök törlése', 3),

  -- Users app - Permissions management
  (13, 'users.permissions.view', 'Jogosultságok megtekintése', 4),
  (14, 'users.permissions.assign', 'Jogosultságok hozzárendelése', 4),

  -- Users app - Resources management
  (15, 'users.resources.view', 'Erőforrások megtekintése', 5),
  (16, 'users.resources.create', 'Erőforrások létrehozása', 5),
  (17, 'users.resources.update', 'Erőforrások módosítása', 5),
  (18, 'users.resources.delete', 'Erőforrások törlése', 5),

  -- Content management
  (19, 'content.view', 'Tartalmak megtekintése', 6),
  (20, 'content.create', 'Tartalmak létrehozása', 6),
  (21, 'content.update', 'Tartalmak módosítása', 6),
  (22, 'content.delete', 'Tartalmak törlése', 6),
  (23, 'content.publish', 'Tartalmak publikálása', 6),

  -- Settings management
  (24, 'settings.view', 'Beállítások megtekintése', 7),
  (25, 'settings.update', 'Beállítások módosítása', 7),

  -- Log management
  (26, 'log.error.view', 'Hibanapló megtekintése', 8),
  (27, 'log.activity.view', 'Tevékenységnapló megtekintése', 8),

  -- Plugin management
  (28, 'plugin.manual.install', 'Plugin manuális telepítése', 9)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  resource_id = EXCLUDED.resource_id;

-- Seed: role_permissions — Role-permission assignments
-- Role permissions seed data

-- Sysadmin role: all permissions
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT 1, id FROM auth.permissions
ON CONFLICT DO NOTHING;

-- Admin role permissions
INSERT INTO auth.role_permissions (role_id, permission_id) VALUES
  -- Users app permissions
  (2, 1),  -- users.users.view
  (2, 2),  -- users.users.create
  (2, 3),  -- users.users.update
  (2, 5),  -- users.groups.view
  (2, 6),  -- users.groups.create
  (2, 7),  -- users.groups.update
  (2, 9),  -- users.roles.view
  (2, 10), -- users.roles.create
  (2, 11), -- users.roles.update
  (2, 13), -- users.permissions.view
  (2, 15), -- users.resources.view
  (2, 16), -- users.resources.create
  (2, 17), -- users.resources.update
  -- Content permissions
  (2, 19), -- content.view
  (2, 20), -- content.create
  (2, 21), -- content.update
  (2, 22), -- content.delete
  (2, 23), -- content.publish
  -- Settings permissions
  (2, 24), -- settings.view
  (2, 25), -- settings.update
  -- Log permissions
  (2, 26), -- log.error.view
  (2, 27), -- log.activity.view
  -- Plugin permissions
  (2, 28)  -- plugin.manual.install
ON CONFLICT DO NOTHING;

-- Editor role permissions
INSERT INTO auth.role_permissions (role_id, permission_id) VALUES
  (3, 19), -- content.view
  (3, 20), -- content.create
  (3, 21), -- content.update
  (3, 23)  -- content.publish
ON CONFLICT DO NOTHING;

-- User role permissions
INSERT INTO auth.role_permissions (role_id, permission_id) VALUES
  (4, 19)  -- content.view
ON CONFLICT DO NOTHING;

-- Seed: group_permissions — Group-permission assignments
-- Group permissions seed data

-- Sysadmin group: all permissions
INSERT INTO auth.group_permissions (group_id, permission_id)
SELECT 1, id FROM auth.permissions
ON CONFLICT DO NOTHING;

-- Admin group permissions
INSERT INTO auth.group_permissions (group_id, permission_id) VALUES
  (2, 1),  -- users.view
  (2, 2),  -- users.create
  (2, 3),  -- users.update
  (2, 5),  -- groups.view
  (2, 9),  -- roles.view
  (2, 15), -- content.view
  (2, 16), -- content.create
  (2, 17), -- content.update
  (2, 18), -- content.delete
  (2, 19), -- content.publish
  (2, 20), -- settings.view
  (2, 22), -- log.error.view
  (2, 23)  -- log.activity.view
ON CONFLICT DO NOTHING;

-- Content editor group permissions
INSERT INTO auth.group_permissions (group_id, permission_id) VALUES
  (3, 15), -- content.view
  (3, 16), -- content.create
  (3, 17), -- content.update
  (3, 19)  -- content.publish
ON CONFLICT DO NOTHING;

-- Public user group permissions
INSERT INTO auth.group_permissions (group_id, permission_id) VALUES
  (4, 15)  -- content.view
ON CONFLICT DO NOTHING;

-- Seed: users — Initial users
-- Users seed data
-- System administrator user - must always exist
INSERT INTO auth.users (id, full_name, email, email_verified, username, image, user_settings, oauth_image) VALUES
  (1, 'ElyOS admin', 'youradminemail@eyoursomain.com', true, null, null, '{}', null)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email_verified = EXCLUDED.email_verified;

-- Sequence visszaállítása a jelenlegi max id fölé, hogy az auto-increment ne ütközzön
SELECT setval(pg_get_serial_sequence('auth.users', 'id'), COALESCE(MAX(id), 1)) FROM auth.users;

-- Seed: accounts — User authentication accounts
-- Accounts seed data
-- System administrator account - must always exist
INSERT INTO auth.accounts (
  user_id,
  provider_account_id,
  provider_id,
  access_token,
  refresh_token,
  access_token_expires_at,
  refresh_token_expires_at,
  scope,
  id_token,
  is_active,
  password,
  failed_login_attempts,
  last_login_at,
  password_changed_at
)
SELECT
    1,
    '1',
    'credential',
    null,
    null,
    null,
    null,
    null,
    null,
    true,
    '03989e2447e72e881e80ade059fa1097:5b37502bcfc3d030cf09f85d8c8798f2d28cbfbf12337ca0ed8fe7d3a05d4db3febbbe7babd713e6c8e390f01861e0892e1dabd9628d6eb85899c72bfbcc6218',
    0,
    null,
    null
WHERE NOT EXISTS (
    SELECT 1 FROM auth.accounts WHERE user_id = 1 AND provider_id = 'credential'
);

-- Seed: user_roles — User-role assignments
-- User roles seed data
-- Assigns users to their roles
INSERT INTO auth.user_roles (user_id, role_id) VALUES
  (1, 1)  -- ElyOS -> Rendszergazda
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Seed: user_groups — User-group assignments
-- User Groups seed data
-- Assigns users to groups

-- Assign system admin to System Administrator group (group_id = 1)
INSERT INTO auth.user_groups (user_id, group_id) VALUES
  (1, 1)  -- ElyOS -> Rendszergazda
ON CONFLICT (user_id, group_id) DO NOTHING;

-- Seed: locales — Supported locales for i18n
-- Seed data for locales table
-- Initial supported languages: Hungarian (hu) and English (en)

INSERT INTO platform.locales (code, name, native_name, is_active)
VALUES
	('hu', 'Hungarian', 'Magyar', true),
	('en', 'English', 'English', true)
ON CONFLICT (code) DO UPDATE SET
	name = EXCLUDED.name,
	native_name = EXCLUDED.native_name,
	is_active = EXCLUDED.is_active;

-- Seed: translations_common — Common translations (buttons, status, errors)
-- =============================================================================
-- COMMON NAMESPACE - Általános, közös fordítások
-- =============================================================================
-- Ez a namespace tartalmazza az alkalmazás általános, több helyen használt
-- szövegeit, mint pl. gombok, állapotok, hibaüzenetek.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

-- Általános gombok és műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'buttons.save', 'Mentés'),
('hu', 'common', 'buttons.cancel', 'Mégse'),
('hu', 'common', 'buttons.close', 'Bezárás'),
('hu', 'common', 'buttons.confirm', 'Megerősítés'),
('hu', 'common', 'buttons.delete', 'Törlés'),
('hu', 'common', 'buttons.edit', 'Szerkesztés'),
('hu', 'common', 'buttons.add', 'Hozzáadás'),
('hu', 'common', 'buttons.search', 'Keresés'),
('hu', 'common', 'buttons.refresh', 'Frissítés'),
('hu', 'common', 'buttons.retry', 'Újrapróbálás'),
('hu', 'common', 'buttons.back', 'Vissza'),
('hu', 'common', 'buttons.next', 'Következő'),
('hu', 'common', 'buttons.previous', 'Előző'),
('hu', 'common', 'buttons.submit', 'Küldés'),
('hu', 'common', 'buttons.reset', 'Visszaállítás'),
('hu', 'common', 'loading', 'Betöltés...'),
('hu', 'common', 'close', 'Bezárás')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános állapotok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'status.loading', 'Betöltés...'),
('hu', 'common', 'status.saving', 'Mentés...'),
('hu', 'common', 'status.saved', 'Mentve'),
('hu', 'common', 'status.error', 'Hiba'),
('hu', 'common', 'status.success', 'Sikeres'),
('hu', 'common', 'status.pending', 'Folyamatban'),
('hu', 'common', 'status.active', 'Aktív'),
('hu', 'common', 'status.inactive', 'Inaktív'),
('hu', 'common', 'status.enabled', 'Engedélyezve'),
('hu', 'common', 'status.disabled', 'Letiltva')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'errors.generic', 'Hiba történt. Kérjük próbálja újra.'),
('hu', 'common', 'errors.network', 'Hálózati hiba. Ellenőrizze az internetkapcsolatot.'),
('hu', 'common', 'errors.notFound', 'A keresett elem nem található.'),
('hu', 'common', 'errors.unauthorized', 'Nincs jogosultsága ehhez a művelethez.'),
('hu', 'common', 'errors.validation', 'Kérjük ellenőrizze a megadott adatokat.'),
('hu', 'common', 'errors.saveFailed', 'Hiba történt a mentés során')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános sikeres üzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'success.saved', 'Sikeresen mentve'),
('hu', 'common', 'success.deleted', 'Sikeresen törölve'),
('hu', 'common', 'success.updated', 'Sikeresen frissítve'),
('hu', 'common', 'success.created', 'Sikeresen létrehozva')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megerősítő dialógusok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'confirm.delete', 'Biztosan törölni szeretné?'),
('hu', 'common', 'confirm.unsavedChanges', 'Nem mentett változtatások vannak. Biztosan kilép?'),
('hu', 'common', 'confirm.action', 'Biztosan végrehajtja ezt a műveletet?')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Hamarosan elérhető
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'comingSoon', 'Hamarosan elérhető...')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Fájl feltöltés
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'fileUpload.dragFilesHere', '<span class="font-semibold">Húzza ide a fájlokat</span>'),
('hu', 'common', 'fileUpload.orClickToBrowse', 'vagy kattintson a böngészéshez'),
('hu', 'common', 'fileUpload.clickOrDrag', 'Kattintson vagy húzza ide a fájlt'),
('hu', 'common', 'fileUpload.browse', 'Böngészés'),
('hu', 'common', 'fileUpload.browseFiles', 'Fájlok böngészése'),
('hu', 'common', 'fileUpload.uploadingInProgress', 'Feltöltés folyamatban...'),
('hu', 'common', 'fileUpload.uploadFiles', 'Feltöltés ({count} fájl)'),
('hu', 'common', 'fileUpload.cancel', 'Megszakítás'),
('hu', 'common', 'fileUpload.cancelUpload', 'Feltöltés megszakítása'),
('hu', 'common', 'fileUpload.removeFile', 'Fájl eltávolítása'),
('hu', 'common', 'fileUpload.allowed', 'Engedélyezett'),
('hu', 'common', 'fileUpload.allFileTypes', 'Minden fájltípus'),
('hu', 'common', 'fileUpload.allFileTypesAllowed', 'Minden fájltípus engedélyezett'),
('hu', 'common', 'fileUpload.max', 'Max'),
('hu', 'common', 'fileUpload.maxFiles', 'Max {count} fájl'),
('hu', 'common', 'fileUpload.status.pending', 'Várakozik'),
('hu', 'common', 'fileUpload.status.uploading', 'Feltöltés...'),
('hu', 'common', 'fileUpload.status.completed', 'Kész'),
('hu', 'common', 'fileUpload.status.error', 'Hiba')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- DataTable - általános táblázat feliratok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'dataTable.noResults', 'Nincs találat.'),
('hu', 'common', 'dataTable.loading', 'Betöltés...'),
('hu', 'common', 'dataTable.totalRows', 'Összesen'),
('hu', 'common', 'dataTable.rows', 'sor'),
('hu', 'common', 'dataTable.rowsPerPage', 'Sorok oldalanként'),
('hu', 'common', 'dataTable.previous', 'Előző'),
('hu', 'common', 'dataTable.next', 'Következő'),
('hu', 'common', 'dataTable.columns', 'Oszlopok'),
('hu', 'common', 'dataTable.toggleColumns', 'Oszlopok megjelenítése'),
('hu', 'common', 'dataTable.sortAsc', 'Növekvő'),
('hu', 'common', 'dataTable.sortDesc', 'Csökkenő'),
('hu', 'common', 'dataTable.hide', 'Elrejtés'),
('hu', 'common', 'dataTable.clearFilters', 'Szűrők törlése'),
('hu', 'common', 'dataTable.selected', 'kiválasztva')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

-- Általános gombok és műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'buttons.save', 'Save'),
('en', 'common', 'buttons.cancel', 'Cancel'),
('en', 'common', 'buttons.close', 'Close'),
('en', 'common', 'buttons.confirm', 'Confirm'),
('en', 'common', 'buttons.delete', 'Delete'),
('en', 'common', 'buttons.edit', 'Edit'),
('en', 'common', 'buttons.add', 'Add'),
('en', 'common', 'buttons.search', 'Search'),
('en', 'common', 'buttons.refresh', 'Refresh'),
('en', 'common', 'buttons.retry', 'Retry'),
('en', 'common', 'buttons.back', 'Back'),
('en', 'common', 'buttons.next', 'Next'),
('en', 'common', 'buttons.previous', 'Previous'),
('en', 'common', 'buttons.submit', 'Submit'),
('en', 'common', 'buttons.reset', 'Reset'),
('en', 'common', 'loading', 'Loading...'),
('en', 'common', 'close', 'Close')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános állapotok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'status.loading', 'Loading...'),
('en', 'common', 'status.saving', 'Saving...'),
('en', 'common', 'status.saved', 'Saved'),
('en', 'common', 'status.error', 'Error'),
('en', 'common', 'status.success', 'Success'),
('en', 'common', 'status.pending', 'Pending'),
('en', 'common', 'status.active', 'Active'),
('en', 'common', 'status.inactive', 'Inactive'),
('en', 'common', 'status.enabled', 'Enabled'),
('en', 'common', 'status.disabled', 'Disabled')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'errors.generic', 'An error occurred. Please try again.'),
('en', 'common', 'errors.network', 'Network error. Please check your connection.'),
('en', 'common', 'errors.notFound', 'The requested item was not found.'),
('en', 'common', 'errors.unauthorized', 'You are not authorized to perform this action.'),
('en', 'common', 'errors.validation', 'Please check the provided data.'),
('en', 'common', 'errors.saveFailed', 'Failed to save')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános sikeres üzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'success.saved', 'Successfully saved'),
('en', 'common', 'success.deleted', 'Successfully deleted'),
('en', 'common', 'success.updated', 'Successfully updated'),
('en', 'common', 'success.created', 'Successfully created')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megerősítő dialógusok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'confirm.delete', 'Are you sure you want to delete?'),
('en', 'common', 'confirm.unsavedChanges', 'You have unsaved changes. Are you sure you want to leave?'),
('en', 'common', 'confirm.action', 'Are you sure you want to perform this action?')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Hamarosan elérhető
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'comingSoon', 'Coming soon...')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- File upload
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'fileUpload.dragFilesHere', '<span class="font-semibold">Drag files here</span>'),
('en', 'common', 'fileUpload.orClickToBrowse', 'or click to browse'),
('en', 'common', 'fileUpload.clickOrDrag', 'Click or drag file here'),
('en', 'common', 'fileUpload.browse', 'Browse'),
('en', 'common', 'fileUpload.browseFiles', 'Browse Files'),
('en', 'common', 'fileUpload.uploadingInProgress', 'Uploading in progress...'),
('en', 'common', 'fileUpload.uploadFiles', 'Upload ({count} files)'),
('en', 'common', 'fileUpload.cancel', 'Cancel'),
('en', 'common', 'fileUpload.cancelUpload', 'Cancel upload'),
('en', 'common', 'fileUpload.removeFile', 'Remove file'),
('en', 'common', 'fileUpload.allowed', 'Allowed'),
('en', 'common', 'fileUpload.allFileTypes', 'All file types'),
('en', 'common', 'fileUpload.allFileTypesAllowed', 'All file types allowed'),
('en', 'common', 'fileUpload.max', 'Max'),
('en', 'common', 'fileUpload.maxFiles', 'Max {count} files'),
('en', 'common', 'fileUpload.status.pending', 'Pending'),
('en', 'common', 'fileUpload.status.uploading', 'Uploading...'),
('en', 'common', 'fileUpload.status.completed', 'Completed'),
('en', 'common', 'fileUpload.status.error', 'Error')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- DataTable - general table labels
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'dataTable.noResults', 'No results.'),
('en', 'common', 'dataTable.loading', 'Loading...'),
('en', 'common', 'dataTable.totalRows', 'Total'),
('en', 'common', 'dataTable.rows', 'rows'),
('en', 'common', 'dataTable.rowsPerPage', 'Rows per page'),
('en', 'common', 'dataTable.previous', 'Previous'),
('en', 'common', 'dataTable.next', 'Next'),
('en', 'common', 'dataTable.columns', 'Columns'),
('en', 'common', 'dataTable.toggleColumns', 'Toggle columns'),
('en', 'common', 'dataTable.sortAsc', 'Ascending'),
('en', 'common', 'dataTable.sortDesc', 'Descending'),
('en', 'common', 'dataTable.hide', 'Hide'),
('en', 'common', 'dataTable.clearFilters', 'Clear filters'),
('en', 'common', 'dataTable.selected', 'selected')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- UI komponensek - ThemeSwitcher, ColorPicker, WindowLink, DataTable
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'common', 'themeSwitcher.toggle', 'Váltás {mode} módra'),
('hu', 'common', 'themeSwitcher.lightMode', 'világos'),
('hu', 'common', 'themeSwitcher.darkMode', 'sötét'),
('hu', 'common', 'colorPicker.hue', 'Árnyalat'),
('hu', 'common', 'colorPicker.preview', 'Előnézet'),
('hu', 'common', 'colorPicker.apply', 'Alkalmaz'),
('hu', 'common', 'windowLink.title', 'Alkalmazás megnyitása guid hivatkozás alapján'),
('hu', 'common', 'windowLink.pasteAndOpen', 'Guid beillesztés és alkalmazás megnyitása'),
('hu', 'common', 'windowLink.open', 'Megnyitás'),
('hu', 'common', 'windowLink.placeholder', 'Alkalmazás guid hivatkozás'),
('hu', 'common', 'dataTable.rowActions', 'Műveletek'),
('hu', 'common', 'pluginDialog.cancel', 'Mégse'),
('hu', 'common', 'pluginDialog.confirm', 'Megerősítés'),
('hu', 'common', 'pluginDialog.send', 'Küldés'),
('hu', 'common', 'sidebar.search', 'Keresés...'),
('hu', 'common', 'error.backToHome', 'Vissza a főoldalra'),
('hu', 'common', 'error.technicalInfo', 'Technikai információ')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- UI components - EN
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'common', 'themeSwitcher.toggle', 'Switch to {mode} mode'),
('en', 'common', 'themeSwitcher.lightMode', 'light'),
('en', 'common', 'themeSwitcher.darkMode', 'dark'),
('en', 'common', 'colorPicker.hue', 'Hue'),
('en', 'common', 'colorPicker.preview', 'Preview'),
('en', 'common', 'colorPicker.apply', 'Apply'),
('en', 'common', 'windowLink.title', 'Open application by guid link'),
('en', 'common', 'windowLink.pasteAndOpen', 'Paste guid and open application'),
('en', 'common', 'windowLink.open', 'Open'),
('en', 'common', 'windowLink.placeholder', 'Application guid link'),
('en', 'common', 'dataTable.rowActions', 'Actions'),
('en', 'common', 'pluginDialog.cancel', 'Cancel'),
('en', 'common', 'pluginDialog.confirm', 'Confirm'),
('en', 'common', 'pluginDialog.send', 'Send'),
('en', 'common', 'sidebar.search', 'Search...'),
('en', 'common', 'error.backToHome', 'Back to home'),
('en', 'common', 'error.technicalInfo', 'Technical information')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Seed: translations_settings — Settings app translations
-- =============================================================================
-- SETTINGS NAMESPACE - Beállítások alkalmazás fordításai
-- =============================================================================
-- Ez a namespace tartalmazza a Settings app összes szövegét.
-- Szekciók: menu, appearance, background, taskbar, performance, language, about
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

-- Settings app menü elemek (menu.json labelKey alapján)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'menu.account', 'Fiók'),
('hu', 'settings', 'menu.security', 'Biztonság'),
('hu', 'settings', 'menu.appearance', 'Megjelenés'),
('hu', 'settings', 'menu.desktop', 'Asztal'),
('hu', 'settings', 'menu.general', 'Általános'),
('hu', 'settings', 'menu.background', 'Háttér'),
('hu', 'settings', 'menu.taskbar', 'Tálca'),
('hu', 'settings', 'menu.startPanel', 'Indító panel'),
('hu', 'settings', 'menu.performance', 'Teljesítmény'),
('hu', 'settings', 'menu.language', 'Nyelv és régió'),
('hu', 'settings', 'menu.about', 'Névjegy')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Placeholder beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'placeholder.title', 'Fejlesztés alatt'),
('hu', 'settings', 'placeholder.message', 'Ez a funkció hamarosan elérhető lesz.'),
('hu', 'settings', 'placeholder.profile', 'A saját profil beállítások kezelése fejlesztés alatt áll.'),
('hu', 'settings', 'placeholder.startPanel', 'Az indító panel kezelése fejlesztés alatt áll.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Indító panel beállítások (StartMenuSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'startmenu.title', 'Indító panel beállítások'),
('hu', 'settings', 'startmenu.viewMode.label', 'Alkalmazás lista megjelenítése'),
('hu', 'settings', 'startmenu.viewMode.description', 'Válassza ki, hogyan jelenjenek meg az alkalmazások'),
('hu', 'settings', 'startmenu.viewMode.info', 'Az ikon nézet rácsos elrendezésben jeleníti meg az alkalmazásokat ikonjaikkal, míg a lista nézet részletesebb információkat mutat soronként. Válassza ki a preferált megjelenítési módot.'),
('hu', 'settings', 'startmenu.viewMode.grid', 'Ikon nézet'),
('hu', 'settings', 'startmenu.viewMode.list', 'Lista nézet'),
('hu', 'settings', 'startmenu.viewMode.saved', 'Nézet mód mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános beállítások (GeneralSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'general.title', 'Általános beállítások'),
('hu', 'settings', 'general.languageRegion.title', 'Nyelv és régió'),
('hu', 'settings', 'general.languageRegion.description', 'Nyelvi és regionális beállítások kezelése'),
('hu', 'settings', 'general.notifications.title', 'Értesítések'),
('hu', 'settings', 'general.notifications.description', 'Értesítési beállítások kezelése'),
('hu', 'settings', 'general.privacy.title', 'Adatvédelem'),
('hu', 'settings', 'general.privacy.description', 'Adatvédelmi beállítások kezelése')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Nyelv beállítások (LanguageSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'language.title', 'Nyelv beállítások'),
('hu', 'settings', 'language.select.label', 'Nyelv kiválasztása'),
('hu', 'settings', 'language.select.description', 'Válassza ki a felület nyelvét'),
('hu', 'settings', 'language.info', 'A nyelv beállítása hatással van az egész rendszer szövegeire. A változtatás azonnal érvénybe lép.'),
('hu', 'settings', 'language.current', 'Jelenlegi nyelv'),
('hu', 'settings', 'language.saved', 'Nyelv beállítva'),
('hu', 'settings', 'language.error', 'Hiba történt a mentés során')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megjelenés beállítások (AppearanceSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'appearance.title', 'Megjelenés beállítások'),
('hu', 'settings', 'appearance.desktopTheme.label', 'Desktop téma mód'),
('hu', 'settings', 'appearance.desktopTheme.description', 'Válassza ki a desktop megjelenését'),
('hu', 'settings', 'appearance.desktopTheme.info', 'A desktop téma mód határozza meg az alkalmazás általános megjelenését. A világos mód világos hátteret és sötét szöveget használ, míg a sötét mód sötét hátteret és világos szöveget. Az automatikus mód a rendszer beállításait követi.'),
('hu', 'settings', 'appearance.taskbarTheme.label', 'Taskbar téma mód'),
('hu', 'settings', 'appearance.taskbarTheme.description', 'A taskbar eltérő témát használhat a desktoptól'),
('hu', 'settings', 'appearance.taskbarTheme.info', 'Ez hasznos lehet, ha szeretnéd, hogy a taskbar jobban kiemelkedjen vagy kevésbé legyen feltűnő.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Megjelenés - téma módok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'appearance.themeMode.light', 'Világos mód'),
('hu', 'settings', 'appearance.themeMode.dark', 'Sötét mód'),
('hu', 'settings', 'appearance.themeMode.auto', 'Automatikus mód'),
('hu', 'settings', 'appearance.themeMode.saved', 'Téma mód mentve'),
('hu', 'settings', 'appearance.taskbarMode.saved', 'Taskbar mód mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megjelenés - színek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'appearance.colors.label', 'Színek'),
('hu', 'settings', 'appearance.colors.description', 'Válassza ki az alkalmazás elsődleges színét'),
('hu', 'settings', 'appearance.colors.info', 'Az elsődleges szín határozza meg az alkalmazás kiemelő színét, amely megjelenik a gombokban, linkekben és más interaktív elemekben. Válasszon egy előre definiált színt, vagy hozzon létre egyedi színt az árnyalat csúszkával.'),
('hu', 'settings', 'appearance.colors.saved', 'Szín mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megjelenés - betűméret
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'appearance.fontSize.label', 'Betűméret'),
('hu', 'settings', 'appearance.fontSize.description', 'A rendszer betűméretének beállítása'),
('hu', 'settings', 'appearance.fontSize.info', 'A betűméret beállítása hatással van az egész rendszer szövegeinek méretére. Nagyobb betűméret könnyebb olvashatóságot biztosít, míg kisebb betűméret több információt jelenít meg a képernyőn.'),
('hu', 'settings', 'appearance.fontSize.small', 'Kicsi'),
('hu', 'settings', 'appearance.fontSize.medium', 'Közepes'),
('hu', 'settings', 'appearance.fontSize.large', 'Nagy'),
('hu', 'settings', 'appearance.fontSize.saved', 'Betűméret mentve'),
-- Megjelenés - témák
('hu', 'settings', 'appearance.presets.label', 'Témák'),
('hu', 'settings', 'appearance.presets.description', 'Válasszon egy előre definiált témát vagy testreszabott beállításokat'),
('hu', 'settings', 'appearance.presets.info', 'A témák előre definiált beállítások kombinációi, amelyek egy kattintásra alkalmazhatók. Ezek tartalmazzák a téma módot, a szín- és betűméret valamint a háttér beállításokat. Bármikor visszatérhetsz a testreszabott beállításokhoz.'),
('hu', 'settings', 'appearance.presets.applied', 'A(z) {name} téma alkalmazva'),
('hu', 'settings', 'appearance.presets.loadFailed', 'Nem sikerült betölteni a témákat'),
-- Megjelenés - téma jelölők tooltip-jei
('hu', 'settings', 'appearance.preset.mode', 'Téma mód'),
('hu', 'settings', 'appearance.preset.color', 'Elsődleges szín'),
('hu', 'settings', 'appearance.preset.background', 'Háttér típusa')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Háttér beállítások (BackgroundSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.title', 'Háttér beállítások'),
('hu', 'settings', 'background.type.label', 'Háttér típusa'),
('hu', 'settings', 'background.type.description', 'Válassza ki a desktop háttér típusát'),
('hu', 'settings', 'background.type.info', 'A háttér típusa határozza meg, hogy milyen módon jelenik meg a desktop háttere. A szín opció egy egyszínű hátteret biztosít, a kép egy statikus háttérképet, míg a videó egy animált hátteret.'),
('hu', 'settings', 'background.type.color', 'Szín'),
('hu', 'settings', 'background.type.image', 'Kép'),
('hu', 'settings', 'background.type.video', 'Videó'),
('hu', 'settings', 'background.type.saved', 'Háttér típus mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Háttér - szín
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.color.label', 'Háttérszín'),
('hu', 'settings', 'background.color.description', 'Válasszon egy színt a desktop hátteréhez'),
('hu', 'settings', 'background.color.info', 'Válasszon egy előre definiált színt, vagy hozzon létre egyedi színt a színválasztóval. A kiválasztott szín azonnal alkalmazásra kerül a desktop hátterén.'),
('hu', 'settings', 'background.color.saved', 'Háttérszín mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Háttér - kép
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.image.label', 'Háttérkép'),
('hu', 'settings', 'background.image.description', 'Válasszon egy képet a desktop hátteréhez'),
('hu', 'settings', 'background.image.info', 'Válasszon egy előre definiált háttérképet a listából. A kép a teljes desktop területén megjelenik, és automatikusan igazodik a képernyő méretéhez.'),
('hu', 'settings', 'background.image.saved', 'Háttérkép mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Háttér - videó
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.video.label', 'Háttérvideó'),
('hu', 'settings', 'background.video.description', 'Válasszon egy videót a desktop hátteréhez'),
('hu', 'settings', 'background.video.info', 'Válasszon egy előre definiált háttérvideót a listából. A videó folyamatosan ismétlődik a háttérben, és automatikusan igazodik a képernyő méretéhez. A videó némítva van, és nem befolyásolja a rendszer teljesítményét jelentősen.'),
('hu', 'settings', 'background.video.saved', 'Háttérvideó mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Tálca beállítások (TaskbarSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'taskbar.title', 'Tálca beállítások'),
('hu', 'settings', 'taskbar.position.label', 'Tálca pozíció'),
('hu', 'settings', 'taskbar.position.description', 'A tálca helye a képernyőn'),
('hu', 'settings', 'taskbar.position.info', 'Válassza ki, hol legyen a tálca - felül vagy alul. A megfelelő elhelyezés kényelmesebb navigációt és jobb átláthatóságot biztosít.'),
('hu', 'settings', 'taskbar.position.top', 'Felül'),
('hu', 'settings', 'taskbar.position.bottom', 'Alul'),
('hu', 'settings', 'taskbar.position.saved', 'Tálca pozíció mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Tálca - stílus
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'taskbar.style.label', 'Tálca kinézete'),
('hu', 'settings', 'taskbar.style.description', 'Klasszikus vagy lebegő dizájn'),
('hu', 'settings', 'taskbar.style.info', 'A klasszikus tálca végigfut a képernyőn, míg a lebegő dizájn szellősebb megjelenést ad margókkal és lekerekített sarkokkal. A választás nem befolyásolja a működést, csak a megjelenést.'),
('hu', 'settings', 'taskbar.style.classic', 'Klasszikus'),
('hu', 'settings', 'taskbar.style.modern', 'Lebegő'),
('hu', 'settings', 'taskbar.style.saved', 'Tálca stílus mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Tálca - elemek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'taskbar.items.label', 'Tálca elemei'),
('hu', 'settings', 'taskbar.items.description', 'A tálcán megjelenő elemek kezelése'),
('hu', 'settings', 'taskbar.items.info', 'Kapcsolja ki azokat az elemeket, amelyeket nem szeretne látni a tálcán. Az elemek elrejtése tisztább megjelenést biztosít és több helyet hagy a futó alkalmazásoknak.'),
('hu', 'settings', 'taskbar.items.clock.label', 'Óra'),
('hu', 'settings', 'taskbar.items.clock.description', 'Aktuális idő megjelenítése'),
('hu', 'settings', 'taskbar.items.themeSwitcher.label', 'Témaváltó'),
('hu', 'settings', 'taskbar.items.themeSwitcher.description', 'Világos/sötét téma kapcsoló'),
('hu', 'settings', 'taskbar.items.appGuidLink.label', 'Alkalmazás megnyitó'),
('hu', 'settings', 'taskbar.items.appGuidLink.description', 'Alkalmazás megnyitása guid hivatkozás alapján'),
('hu', 'settings', 'taskbar.items.messages.label', 'Üzenetek'),
('hu', 'settings', 'taskbar.items.messages.description', 'Chat üzenetek gyors elérése'),
('hu', 'settings', 'taskbar.items.notifications.label', 'Értesítések'),
('hu', 'settings', 'taskbar.items.notifications.description', 'Rendszer értesítések megjelenítése'),
('hu', 'settings', 'taskbar.items.saved', 'Tálca elem beállítás mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Teljesítmény beállítások (PerformanceSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'performance.title', 'Teljesítmény beállítások'),
('hu', 'settings', 'performance.optimization.label', 'Teljesítmény optimalizálás'),
('hu', 'settings', 'performance.optimization.description', 'Gyorsabb működés a vizuális effektek rovására'),
('hu', 'settings', 'performance.optimization.info', 'Ha be van kapcsolva, az ablakok mozgatása közben a tartalmuk el van rejtve, és az ablak előnézet funkció is le van tiltva. Ez jelentősen javítja a teljesítményt lassabb eszközökön.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Teljesítmény - ablak előnézet
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'performance.windowPreview.label', 'Ablak előnézet'),
('hu', 'settings', 'performance.windowPreview.description', 'Előnézeti képek megjelenítése a tálcán'),
('hu', 'settings', 'performance.windowPreview.info', 'Az ablak előnézet funkció lehetővé teszi, hogy a tálcán lévő alkalmazások ikonjára mutatva egy kis előnézeti képet láss az ablak tartalmáról. Ez megkönnyíti a nyitott ablakok közötti navigációt.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Teljesítmény - előnézeti kép méret
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'performance.previewSize.label', 'Előnézeti kép'),
('hu', 'settings', 'performance.previewSize.description', 'Az előnézeti képek méretének kezelése'),
('hu', 'settings', 'performance.previewSize.info', 'Az előnézeti képek méretének beállítása. Nagyobb értékek részletesebb előnézeteket eredményeznek, de több memóriát és feldolgozási kapacitást igényelnek. Ajánlott érték: közepes.'),
('hu', 'settings', 'performance.previewSize.small', 'kicsi'),
('hu', 'settings', 'performance.previewSize.medium', 'közepes'),
('hu', 'settings', 'performance.previewSize.large', 'nagy'),
('hu', 'settings', 'performance.previewSize.huge', 'hatalmas'),
('hu', 'settings', 'performance.saved', 'Beállítások mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Rendszer információk (About.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'about.title', 'Rendszer információk'),
('hu', 'settings', 'about.version', 'Verzió'),
('hu', 'settings', 'about.description', 'Modern webes asztali környezet a hatékony munkavégzéshez.'),
('hu', 'settings', 'about.changelog', 'Verzió előzmények'),
('hu', 'settings', 'about.copyright', '© {year} ElyOS')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Profil beállítások (ProfileSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'profile.title', 'Profil beállítások'),
('hu', 'settings', 'profile.avatar.title', 'Profilkép'),
('hu', 'settings', 'profile.avatar.description', 'Töltse fel a profilképét vagy használja az alapértelmezettet'),
('hu', 'settings', 'profile.avatar.upload', 'Kép feltöltése'),
('hu', 'settings', 'profile.avatar.reset', 'Visszaállítás alapértelmezettre'),
('hu', 'settings', 'profile.avatar.syncedFrom', 'Szinkronizálva: {provider}'),
('hu', 'settings', 'profile.info.title', 'Profil információk'),
('hu', 'settings', 'profile.info.description', 'Kezelje a személyes adatait'),
('hu', 'settings', 'profile.name.label', 'Teljes név'),
('hu', 'settings', 'profile.name.placeholder', 'Adja meg a nevét'),
('hu', 'settings', 'profile.name.error.required', 'A név megadása kötelező'),
('hu', 'settings', 'profile.username.label', 'Felhasználónév'),
('hu', 'settings', 'profile.username.placeholder', 'Adja meg a felhasználónevét'),
('hu', 'settings', 'profile.username.error.format', 'Csak betűk, számok és aláhúzás megengedett'),
('hu', 'settings', 'profile.username.error.minLength', 'Minimum 3 karakter szükséges'),
('hu', 'settings', 'profile.username.error.maxLength', 'Maximum 50 karakter megengedett'),
('hu', 'settings', 'profile.username.error.taken', 'Ez a felhasználónév már foglalt'),
('hu', 'settings', 'profile.email.label', 'E-mail cím'),
('hu', 'settings', 'profile.accountType.label', 'Fiók típusa'),
('hu', 'settings', 'profile.accountType.google', 'Google fiók'),
('hu', 'settings', 'profile.accountType.email', 'E-mail fiók'),
('hu', 'settings', 'profile.groups.label', 'Csoportok'),
('hu', 'settings', 'profile.roles.label', 'Szerepkörök'),
('hu', 'settings', 'profile.createdAt.label', 'Regisztráció dátuma'),
('hu', 'settings', 'profile.save', 'Mentés'),
('hu', 'settings', 'profile.saving', 'Mentés...'),
('hu', 'settings', 'profile.saved', 'Profil sikeresen mentve'),
('hu', 'settings', 'profile.error', 'Hiba történt a mentés során')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

-- Settings app menü elemek (menu.json labelKey alapján)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'menu.account', 'Account'),
('en', 'settings', 'menu.security', 'Security'),
('en', 'settings', 'menu.appearance', 'Appearance'),
('en', 'settings', 'menu.desktop', 'Desktop'),
('en', 'settings', 'menu.background', 'Background'),
('en', 'settings', 'menu.taskbar', 'Taskbar'),
('en', 'settings', 'menu.startPanel', 'Start Panel'),
('en', 'settings', 'menu.performance', 'Performance'),
('en', 'settings', 'menu.language', 'Language & Region'),
('en', 'settings', 'menu.about', 'About'),
-- Régi kulcsok megtartása visszafelé kompatibilitás miatt
('en', 'settings', 'menu.profile', 'My Profile'),
('en', 'settings', 'menu.general', 'General'),
('en', 'settings', 'menu.personalization', 'Personalization'),
('en', 'settings', 'menu.systemInfo', 'System Information')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Placeholder beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'placeholder.title', 'Under Development'),
('en', 'settings', 'placeholder.message', 'This feature will be available soon.'),
('en', 'settings', 'placeholder.profile', 'Profile settings management is under development.'),
('en', 'settings', 'placeholder.startPanel', 'Start panel management is under development.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Indító panel beállítások (StartMenuSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'startmenu.title', 'Start Menu Settings'),
('en', 'settings', 'startmenu.viewMode.label', 'Application List Display'),
('en', 'settings', 'startmenu.viewMode.description', 'Choose how applications are displayed'),
('en', 'settings', 'startmenu.viewMode.info', 'Grid view displays applications in a grid layout with their icons, while list view shows more detailed information in rows. Choose your preferred display mode.'),
('en', 'settings', 'startmenu.viewMode.grid', 'Grid View'),
('en', 'settings', 'startmenu.viewMode.list', 'List View'),
('en', 'settings', 'startmenu.viewMode.saved', 'View mode saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Általános beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'general.title', 'General Settings'),
('en', 'settings', 'general.languageRegion.title', 'Language & Region'),
('en', 'settings', 'general.languageRegion.description', 'Manage language and regional settings'),
('en', 'settings', 'general.notifications.title', 'Notifications'),
('en', 'settings', 'general.notifications.description', 'Manage notification settings'),
('en', 'settings', 'general.privacy.title', 'Privacy'),
('en', 'settings', 'general.privacy.description', 'Manage privacy settings')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Nyelv beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'language.title', 'Language Settings'),
('en', 'settings', 'language.select.label', 'Select Language'),
('en', 'settings', 'language.select.description', 'Choose the interface language'),
('en', 'settings', 'language.info', 'The language setting affects all system texts. Changes take effect immediately.'),
('en', 'settings', 'language.current', 'Current language'),
('en', 'settings', 'language.saved', 'Language saved'),
('en', 'settings', 'language.error', 'An error occurred while saving')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megjelenés beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'appearance.title', 'Appearance Settings'),
('en', 'settings', 'appearance.desktopTheme.label', 'Desktop Theme Mode'),
('en', 'settings', 'appearance.desktopTheme.description', 'Choose the desktop appearance'),
('en', 'settings', 'appearance.desktopTheme.info', 'The desktop theme mode determines the overall appearance of the application. Light mode uses a light background with dark text, while dark mode uses a dark background with light text. Auto mode follows system settings.'),
('en', 'settings', 'appearance.taskbarTheme.label', 'Taskbar Theme Mode'),
('en', 'settings', 'appearance.taskbarTheme.description', 'The taskbar can use a different theme from the desktop'),
('en', 'settings', 'appearance.taskbarTheme.info', 'This can be useful if you want the taskbar to stand out more or be less prominent.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megjelenés - téma módok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'appearance.themeMode.light', 'Light Mode'),
('en', 'settings', 'appearance.themeMode.dark', 'Dark Mode'),
('en', 'settings', 'appearance.themeMode.auto', 'Auto Mode'),
('en', 'settings', 'appearance.themeMode.saved', 'Theme mode saved'),
('en', 'settings', 'appearance.taskbarMode.saved', 'Taskbar mode saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Megjelenés - színek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'appearance.colors.label', 'Colors'),
('en', 'settings', 'appearance.colors.description', 'Choose the primary color of the application'),
('en', 'settings', 'appearance.colors.info', 'The primary color determines the accent color of the application, which appears in buttons, links, and other interactive elements. Choose a predefined color or create a custom color with the hue slider.'),
('en', 'settings', 'appearance.colors.saved', 'Color saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Megjelenés - betűméret
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'appearance.fontSize.label', 'Font Size'),
('en', 'settings', 'appearance.fontSize.description', 'Set the system font size'),
('en', 'settings', 'appearance.fontSize.info', 'The font size setting affects all system text sizes. Larger font sizes provide easier readability, while smaller font sizes display more information on screen.'),
('en', 'settings', 'appearance.fontSize.small', 'Small'),
('en', 'settings', 'appearance.fontSize.medium', 'Medium'),
('en', 'settings', 'appearance.fontSize.large', 'Large'),
('en', 'settings', 'appearance.fontSize.saved', 'Font size saved'),
-- Megjelenés - témák
('en', 'settings', 'appearance.presets.label', 'Themes'),
('en', 'settings', 'appearance.presets.description', 'Choose a predefined theme or custom settings'),
('en', 'settings', 'appearance.presets.info', 'Themes are predefined combinations of settings that can be applied with one click. They include theme mode, color, font size and wallpaper settings. You can always return to custom settings.'),
('en', 'settings', 'appearance.presets.applied', 'Theme {name} applied'),
('en', 'settings', 'appearance.presets.loadFailed', 'Failed to load themes'),
-- Megjelenés - téma jelölők tooltip-jei
('en', 'settings', 'appearance.preset.mode', 'Theme mode'),
('en', 'settings', 'appearance.preset.color', 'Primary color'),
('en', 'settings', 'appearance.preset.background', 'Background type')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Háttér beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'background.title', 'Background Settings'),
('en', 'settings', 'background.type.label', 'Background Type'),
('en', 'settings', 'background.type.description', 'Choose the desktop background type'),
('en', 'settings', 'background.type.info', 'The background type determines how the desktop background appears. The color option provides a solid color background, image provides a static wallpaper, while video provides an animated background.'),
('en', 'settings', 'background.type.color', 'Color'),
('en', 'settings', 'background.type.image', 'Image'),
('en', 'settings', 'background.type.video', 'Video'),
('en', 'settings', 'background.type.saved', 'Background type saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Háttér - szín, kép, videó
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'background.color.label', 'Background Color'),
('en', 'settings', 'background.color.description', 'Choose a color for the desktop background'),
('en', 'settings', 'background.color.info', 'Choose a predefined color or create a custom color with the color picker. The selected color is immediately applied to the desktop background.'),
('en', 'settings', 'background.color.saved', 'Background color saved'),
('en', 'settings', 'background.image.label', 'Background Image'),
('en', 'settings', 'background.image.description', 'Choose an image for the desktop background'),
('en', 'settings', 'background.image.info', 'Choose a predefined wallpaper from the list. The image covers the entire desktop area and automatically adjusts to the screen size.'),
('en', 'settings', 'background.image.saved', 'Background image saved'),
('en', 'settings', 'background.video.label', 'Background Video'),
('en', 'settings', 'background.video.description', 'Choose a video for the desktop background'),
('en', 'settings', 'background.video.info', 'Choose a predefined background video from the list. The video loops continuously in the background and automatically adjusts to the screen size. The video is muted and does not significantly affect system performance.'),
('en', 'settings', 'background.video.saved', 'Background video saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Tálca beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'taskbar.title', 'Taskbar Settings'),
('en', 'settings', 'taskbar.position.label', 'Taskbar Position'),
('en', 'settings', 'taskbar.position.description', 'The taskbar location on screen'),
('en', 'settings', 'taskbar.position.info', 'Choose where the taskbar should be - top or bottom. The right placement provides more comfortable navigation and better visibility.'),
('en', 'settings', 'taskbar.position.top', 'Top'),
('en', 'settings', 'taskbar.position.bottom', 'Bottom'),
('en', 'settings', 'taskbar.position.saved', 'Taskbar position saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Tálca - stílus és elemek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'taskbar.style.label', 'Taskbar Style'),
('en', 'settings', 'taskbar.style.description', 'Classic or floating design'),
('en', 'settings', 'taskbar.style.info', 'The classic taskbar spans the entire screen, while the floating design provides a more airy appearance with margins and rounded corners. The choice does not affect functionality, only appearance.'),
('en', 'settings', 'taskbar.style.classic', 'Classic'),
('en', 'settings', 'taskbar.style.modern', 'Floating'),
('en', 'settings', 'taskbar.style.saved', 'Taskbar style saved'),
('en', 'settings', 'taskbar.items.label', 'Taskbar Items'),
('en', 'settings', 'taskbar.items.description', 'Manage items displayed on the taskbar'),
('en', 'settings', 'taskbar.items.info', 'Turn off items you do not want to see on the taskbar. Hiding items provides a cleaner appearance and leaves more space for running applications.'),
('en', 'settings', 'taskbar.items.clock.label', 'Clock'),
('en', 'settings', 'taskbar.items.clock.description', 'Display current time'),
('en', 'settings', 'taskbar.items.themeSwitcher.label', 'Theme Switcher'),
('en', 'settings', 'taskbar.items.themeSwitcher.description', 'Light/dark theme toggle'),
('en', 'settings', 'taskbar.items.appGuidLink.label', 'App Launcher'),
('en', 'settings', 'taskbar.items.appGuidLink.description', 'Open application via guid link'),
('en', 'settings', 'taskbar.items.messages.label', 'Messages'),
('en', 'settings', 'taskbar.items.messages.description', 'Quick access to chat messages'),
('en', 'settings', 'taskbar.items.notifications.label', 'Notifications'),
('en', 'settings', 'taskbar.items.notifications.description', 'Display system notifications'),
('en', 'settings', 'taskbar.items.saved', 'Taskbar item setting saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Teljesítmény beállítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'performance.title', 'Performance Settings'),
('en', 'settings', 'performance.optimization.label', 'Performance Optimization'),
('en', 'settings', 'performance.optimization.description', 'Faster operation at the expense of visual effects'),
('en', 'settings', 'performance.optimization.info', 'When enabled, window content is hidden during dragging, and the window preview feature is also disabled. This significantly improves performance on slower devices.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Teljesítmény - ablak előnézet és méret
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'performance.windowPreview.label', 'Window Preview'),
('en', 'settings', 'performance.windowPreview.description', 'Show preview images on the taskbar'),
('en', 'settings', 'performance.windowPreview.info', 'The window preview feature allows you to see a small preview image of the window content when hovering over application icons on the taskbar. This makes navigation between open windows easier.'),
('en', 'settings', 'performance.previewSize.label', 'Preview Image'),
('en', 'settings', 'performance.previewSize.description', 'Manage preview image size'),
('en', 'settings', 'performance.previewSize.info', 'Set the preview image size. Larger values result in more detailed previews but require more memory and processing power. Recommended value: medium.'),
('en', 'settings', 'performance.previewSize.small', 'small'),
('en', 'settings', 'performance.previewSize.medium', 'medium'),
('en', 'settings', 'performance.previewSize.large', 'large'),
('en', 'settings', 'performance.previewSize.huge', 'huge'),
('en', 'settings', 'performance.saved', 'Settings saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Rendszer információk
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'about.title', 'System Information'),
('en', 'settings', 'about.version', 'Version'),
('en', 'settings', 'about.description', 'Modern web desktop environment for efficient work.'),
('en', 'settings', 'about.changelog', 'Version History'),
('en', 'settings', 'about.copyright', '© {year} ElyOS')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Profil beállítások (ProfileSettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'profile.title', 'Profile Settings'),
('en', 'settings', 'profile.avatar.title', 'Profile Picture'),
('en', 'settings', 'profile.avatar.description', 'Upload your profile picture or use the default'),
('en', 'settings', 'profile.avatar.upload', 'Upload Image'),
('en', 'settings', 'profile.avatar.reset', 'Reset to Default'),
('en', 'settings', 'profile.avatar.syncedFrom', 'Synced from: {provider}'),
('en', 'settings', 'profile.info.title', 'Profile Information'),
('en', 'settings', 'profile.info.description', 'Manage your personal information'),
('en', 'settings', 'profile.name.label', 'Full Name'),
('en', 'settings', 'profile.name.placeholder', 'Enter your name'),
('en', 'settings', 'profile.name.error.required', 'Name is required'),
('en', 'settings', 'profile.username.label', 'Username'),
('en', 'settings', 'profile.username.placeholder', 'Enter your username'),
('en', 'settings', 'profile.username.error.format', 'Only letters, numbers and underscores allowed'),
('en', 'settings', 'profile.username.error.minLength', 'Minimum 3 characters required'),
('en', 'settings', 'profile.username.error.maxLength', 'Maximum 50 characters allowed'),
('en', 'settings', 'profile.username.error.taken', 'This username is already taken'),
('en', 'settings', 'profile.email.label', 'Email Address'),
('en', 'settings', 'profile.accountType.label', 'Account Type'),
('en', 'settings', 'profile.accountType.google', 'Google Account'),
('en', 'settings', 'profile.accountType.email', 'Email Account'),
('en', 'settings', 'profile.groups.label', 'Groups'),
('en', 'settings', 'profile.roles.label', 'Roles'),
('en', 'settings', 'profile.createdAt.label', 'Registration Date'),
('en', 'settings', 'profile.save', 'Save'),
('en', 'settings', 'profile.saving', 'Saving...'),
('en', 'settings', 'profile.saved', 'Profile saved successfully'),
('en', 'settings', 'profile.error', 'An error occurred while saving')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Biztonság beállítások (SecuritySettings.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'security.title', 'Biztonság'),
('hu', 'settings', 'security.2fa.title', 'Kétfaktoros hitelesítés (2FA)'),
('hu', 'settings', 'security.2fa.description', 'Extra biztonsági réteg hozzáadása fiókjához egy második ellenőrző lépéssel.'),
('hu', 'settings', 'security.2fa.info', 'A kétfaktoros hitelesítés jelentősen megnehezíti a jogosulatlan hozzáférést fiókjához. Bejelentkezéskor jelszó mellett egy időalapú kódot is meg kell adnia az alkalmazásából.'),
('hu', 'settings', 'security.2fa.enabled', 'Engedélyezve'),
('hu', 'settings', 'security.2fa.disabled', 'Letiltva'),
('hu', 'settings', 'security.2fa.enable', 'Kétfaktoros hitelesítés engedélyezése'),
('hu', 'settings', 'security.2fa.disable', 'Kétfaktoros hitelesítés letiltása'),
('hu', 'settings', 'security.2fa.passwordLabel', 'Jelszó'),
('hu', 'settings', 'security.2fa.passwordPlaceholder', 'Adja meg a jelszavát'),
('hu', 'settings', 'security.2fa.setupStarted', '2FA beállítás elindítva'),
('hu', 'settings', 'security.2fa.scanQR', 'Szkennelje be a QR kódot hitelesítő alkalmazásával'),
('hu', 'settings', 'security.2fa.manualEntry', 'Vagy adja meg manuálisan'),
('hu', 'settings', 'security.2fa.verificationCode', 'Ellenőrző kód'),
('hu', 'settings', 'security.2fa.verify', 'Ellenőrzés'),
('hu', 'settings', 'security.2fa.regenerateBackupCodes', 'Tartalék kódok újragenerálása'),
('hu', 'settings', 'security.2fa.backupCodesTitle', 'Tartalék kódok'),
('hu', 'settings', 'security.2fa.backupCodesWarning', 'Mentse el ezeket a kódokat biztonságos helyre. Mindegyik csak egyszer használható.'),
('hu', 'settings', 'security.2fa.copyBackupCodes', 'Másolás'),
('hu', 'settings', 'security.2fa.downloadBackupCodes', 'Letöltés'),
('hu', 'settings', 'security.2fa.backupCodesGenerated', 'Tartalék kódok generálva'),
('hu', 'settings', 'security.2fa.backupCodesCopied', 'Tartalék kódok vágólapra másolva'),
('hu', 'settings', 'security.2fa.backupCodesDownloaded', 'Tartalék kódok letöltve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'security.title', 'Security'),
('en', 'settings', 'security.2fa.title', 'Two-Factor Authentication (2FA)'),
('en', 'settings', 'security.2fa.description', 'Add an extra layer of security to your account with a second verification step.'),
('en', 'settings', 'security.2fa.info', 'Two-factor authentication significantly increases the security of your account by requiring a time-based code from your authenticator app in addition to your password when logging in.'),
('en', 'settings', 'security.2fa.enabled', 'Enabled'),
('en', 'settings', 'security.2fa.disabled', 'Disabled'),
('en', 'settings', 'security.2fa.enable', 'Enable Two-Factor Authentication'),
('en', 'settings', 'security.2fa.disable', 'Disable Two-Factor Authentication'),
('en', 'settings', 'security.2fa.passwordLabel', 'Password'),
('en', 'settings', 'security.2fa.passwordPlaceholder', 'Enter your password'),
('en', 'settings', 'security.2fa.setupStarted', '2FA setup started'),
('en', 'settings', 'security.2fa.scanQR', 'Scan the QR code with your authenticator app'),
('en', 'settings', 'security.2fa.manualEntry', 'Or enter manually'),
('en', 'settings', 'security.2fa.verificationCode', 'Verification Code'),
('en', 'settings', 'security.2fa.verify', 'Verify'),
('en', 'settings', 'security.2fa.regenerateBackupCodes', 'Regenerate Backup Codes'),
('en', 'settings', 'security.2fa.backupCodesTitle', 'Backup Codes'),
('en', 'settings', 'security.2fa.backupCodesWarning', 'Save these codes in a secure place. Each can only be used once.'),
('en', 'settings', 'security.2fa.copyBackupCodes', 'Copy'),
('en', 'settings', 'security.2fa.downloadBackupCodes', 'Download'),
('en', 'settings', 'security.2fa.backupCodesGenerated', 'Backup codes generated'),
('en', 'settings', 'security.2fa.backupCodesCopied', 'Backup codes copied to clipboard'),
('en', 'settings', 'security.2fa.backupCodesDownloaded', 'Backup codes downloaded')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- 2FA hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'security.2fa.errors.passwordRequired', 'Jelszó megadása kötelező'),
('hu', 'settings', 'security.2fa.errors.codeRequired', 'Kód megadása kötelező'),
('hu', 'settings', 'security.2fa.errors.enableFailed', '2FA engedélyezése sikertelen'),
('hu', 'settings', 'security.2fa.errors.disableFailed', '2FA letiltása sikertelen'),
('hu', 'settings', 'security.2fa.errors.verifyFailed', 'Kód ellenőrzése sikertelen'),
('hu', 'settings', 'security.2fa.errors.backupCodesFailed', 'Tartalék kódok generálása sikertelen'),
('hu', 'settings', 'security.2fa.errors.incorrectPassword', 'Hibás jelszó')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'security.2fa.errors.passwordRequired', 'Password is required'),
('en', 'settings', 'security.2fa.errors.codeRequired', 'Code is required'),
('en', 'settings', 'security.2fa.errors.enableFailed', 'Failed to enable 2FA'),
('en', 'settings', 'security.2fa.errors.disableFailed', 'Failed to disable 2FA'),
('en', 'settings', 'security.2fa.errors.verifyFailed', 'Failed to verify code'),
('en', 'settings', 'security.2fa.errors.backupCodesFailed', 'Failed to generate backup codes'),
('en', 'settings', 'security.2fa.errors.incorrectPassword', 'Incorrect password')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jelszó módosítás (SecuritySettings.svelte - Password Change)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'security.password.title', 'Jelszó módosítása'),
('hu', 'settings', 'security.password.description', 'Változtassa meg fiókja jelszavát a biztonság érdekében.'),
('hu', 'settings', 'security.password.info', 'Rendszeresen változtassa meg jelszavát fiókja biztonságának megőrzése érdekében. Használjon erős, egyedi jelszót, amelyet sehol máshol nem használ.'),
('hu', 'settings', 'security.password.currentPasswordLabel', 'Jelenlegi jelszó'),
('hu', 'settings', 'security.password.currentPasswordPlaceholder', 'Adja meg a jelenlegi jelszavát'),
('hu', 'settings', 'security.password.newPasswordLabel', 'Új jelszó'),
('hu', 'settings', 'security.password.newPasswordPlaceholder', 'Adja meg az új jelszavát'),
('hu', 'settings', 'security.password.confirmPasswordLabel', 'Új jelszó megerősítése'),
('hu', 'settings', 'security.password.confirmPasswordPlaceholder', 'Erősítse meg az új jelszavát'),
('hu', 'settings', 'security.password.passwordRequirements', 'A jelszónak legalább 8 karakter hosszúnak kell lennie'),
('hu', 'settings', 'security.password.changeButton', 'Jelszó módosítása'),
('hu', 'settings', 'security.password.success', 'Jelszó sikeresen módosítva'),
('hu', 'settings', 'security.password.errors.currentPasswordRequired', 'Jelenlegi jelszó megadása kötelező'),
('hu', 'settings', 'security.password.errors.newPasswordRequired', 'Új jelszó megadása kötelező'),
('hu', 'settings', 'security.password.errors.passwordTooShort', 'A jelszónak legalább 8 karakter hosszúnak kell lennie'),
('hu', 'settings', 'security.password.errors.passwordMismatch', 'A jelszavak nem egyeznek'),
('hu', 'settings', 'security.password.errors.samePassword', 'Az új jelszó nem lehet ugyanaz, mint a jelenlegi'),
('hu', 'settings', 'security.password.errors.changeFailed', 'Jelszó módosítása sikertelen'),
('hu', 'settings', 'security.password.errors.incorrectPassword', 'Hibás jelenlegi jelszó')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'security.password.title', 'Change Password'),
('en', 'settings', 'security.password.description', 'Change your account password for security.'),
('en', 'settings', 'security.password.info', 'Regularly change your password to keep your account secure. Use a strong, unique password that you don''t use anywhere else.'),
('en', 'settings', 'security.password.currentPasswordLabel', 'Current Password'),
('en', 'settings', 'security.password.currentPasswordPlaceholder', 'Enter your current password'),
('en', 'settings', 'security.password.newPasswordLabel', 'New Password'),
('en', 'settings', 'security.password.newPasswordPlaceholder', 'Enter your new password'),
('en', 'settings', 'security.password.confirmPasswordLabel', 'Confirm New Password'),
('en', 'settings', 'security.password.confirmPasswordPlaceholder', 'Confirm your new password'),
('en', 'settings', 'security.password.passwordRequirements', 'Password must be at least 8 characters long'),
('en', 'settings', 'security.password.changeButton', 'Change Password'),
('en', 'settings', 'security.password.success', 'Password changed successfully'),
('en', 'settings', 'security.password.errors.currentPasswordRequired', 'Current password is required'),
('en', 'settings', 'security.password.errors.newPasswordRequired', 'New password is required'),
('en', 'settings', 'security.password.errors.passwordTooShort', 'Password must be at least 8 characters long'),
('en', 'settings', 'security.password.errors.passwordMismatch', 'Passwords do not match'),
('en', 'settings', 'security.password.errors.samePassword', 'New password cannot be the same as current password'),
('en', 'settings', 'security.password.errors.changeFailed', 'Failed to change password'),
('en', 'settings', 'security.password.errors.incorrectPassword', 'Incorrect current password')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- Háttérkép feltöltés fordítások (BackgroundSettings.svelte - Upload)
-- -----------------------------------------------------------------------------

-- Magyar fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.upload.label', 'Saját kép feltöltése'),
('hu', 'settings', 'background.upload.description', 'Töltsön fel saját háttérképet a számítógépéről'),
('hu', 'settings', 'background.upload.success', 'Háttérkép sikeresen feltöltve'),
('hu', 'settings', 'background.upload.error', 'Hiba történt a feltöltés során'),
('hu', 'settings', 'background.userImages.label', 'Saját képek'),
('hu', 'settings', 'background.userImages.description', 'Korábban feltöltött háttérképek')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Angol fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'background.upload.label', 'Upload Custom Image'),
('en', 'settings', 'background.upload.description', 'Upload your own wallpaper from your computer'),
('en', 'settings', 'background.upload.success', 'Wallpaper uploaded successfully'),
('en', 'settings', 'background.upload.error', 'An error occurred during upload'),
('en', 'settings', 'background.userImages.label', 'My Images'),
('en', 'settings', 'background.userImages.description', 'Previously uploaded wallpapers')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- -----------------------------------------------------------------------------
-- Háttérkép törlés fordítások (BackgroundSettings.svelte - Delete)
-- -----------------------------------------------------------------------------

-- Magyar fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.delete.button', 'Törlés'),
('hu', 'settings', 'background.delete.title', 'Háttérkép törlése'),
('hu', 'settings', 'background.delete.description', 'Biztosan törölni szeretné ezt a háttérképet? Ez a művelet nem vonható vissza.'),
('hu', 'settings', 'background.delete.confirm', 'Törlés'),
('hu', 'settings', 'background.delete.cancel', 'Mégse'),
('hu', 'settings', 'background.delete.success', 'Háttérkép sikeresen törölve'),
('hu', 'settings', 'background.delete.error', 'Hiba történt a törlés során')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Angol fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'background.delete.button', 'Delete'),
('en', 'settings', 'background.delete.title', 'Delete Wallpaper'),
('en', 'settings', 'background.delete.description', 'Are you sure you want to delete this wallpaper? This action cannot be undone.'),
('en', 'settings', 'background.delete.confirm', 'Delete'),
('en', 'settings', 'background.delete.cancel', 'Cancel'),
('en', 'settings', 'background.delete.success', 'Wallpaper deleted successfully'),
('en', 'settings', 'background.delete.error', 'An error occurred while deleting')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Háttér - homályosítás (blur)
-- Magyar fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.blur.label', 'Homályosítás'),
('hu', 'settings', 'background.blur.description', 'Homályosító effekt mértékének beállítása a háttérképen'),
('hu', 'settings', 'background.blur.info', 'A homályosítás egy blur effektet alkalmaz a háttérképre, amely modernebb megjelenést kölcsönöz az asztalnak és javítja az ikonok, ablakok olvashatóságát. A csúszka segítségével állítsa be a kívánt mértéket.'),
('hu', 'settings', 'background.blur.toggle', 'Háttérkép homályosítása'),
('hu', 'settings', 'background.blur.saved', 'Homályosítás beállítás mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Angol fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'background.blur.label', 'Blur'),
('en', 'settings', 'background.blur.description', 'Adjust the blur effect intensity on the background image'),
('en', 'settings', 'background.blur.info', 'Blur applies a blur effect to the wallpaper, giving the desktop a more modern look and improving the readability of icons and windows. Use the slider to set the desired intensity.'),
('en', 'settings', 'background.blur.toggle', 'Blur background image'),
('en', 'settings', 'background.blur.saved', 'Blur setting saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Háttér - szürkeárnyalatos (grayscale)
-- Magyar fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'background.grayscale.label', 'Fekete-fehér'),
('hu', 'settings', 'background.grayscale.description', 'Szürkeárnyalatos megjelenítés a háttérképen'),
('hu', 'settings', 'background.grayscale.info', 'A fekete-fehér mód szürkeárnyalatos filterrel jeleníti meg a háttérképet, amely elegáns, visszafogott megjelenést kölcsönöz az asztalnak. A homályosítás opcióval együtt is használható.'),
('hu', 'settings', 'background.grayscale.saved', 'Fekete-fehér beállítás mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Angol fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'background.grayscale.label', 'Grayscale'),
('en', 'settings', 'background.grayscale.description', 'Display the background image in grayscale'),
('en', 'settings', 'background.grayscale.info', 'Grayscale mode applies a black and white filter to the wallpaper, giving the desktop an elegant, subdued appearance. Can be combined with the blur option.'),
('en', 'settings', 'background.grayscale.saved', 'Grayscale setting saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- Asztal beállítások (DesktopSettings.svelte)
-- -----------------------------------------------------------------------------

-- Magyar fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'settings', 'desktop.title', 'Általános asztal beállítások'),
('hu', 'settings', 'desktop.clickMode.label', 'Parancsikonok megnyitása'),
('hu', 'settings', 'desktop.clickMode.description', 'Válassza ki, hogyan nyíljanak meg az asztali parancsikonok'),
('hu', 'settings', 'desktop.clickMode.info', 'Az egyszeres kattintás gyorsabb hozzáférést biztosít, míg a dupla kattintás megakadályozza a véletlen megnyitást. Válassza ki a preferált módot.'),
('hu', 'settings', 'desktop.clickMode.single', 'Egyszeres kattintás'),
('hu', 'settings', 'desktop.clickMode.double', 'Dupla kattintás'),
('hu', 'settings', 'desktop.clickMode.saved', 'Kattintási mód mentve')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Angol fordítások
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'settings', 'desktop.title', 'General Desktop Settings'),
('en', 'settings', 'desktop.clickMode.label', 'Open Shortcuts'),
('en', 'settings', 'desktop.clickMode.description', 'Choose how desktop shortcuts should open'),
('en', 'settings', 'desktop.clickMode.info', 'Single click provides faster access, while double click prevents accidental opening. Choose your preferred mode.'),
('en', 'settings', 'desktop.clickMode.single', 'Single Click'),
('en', 'settings', 'desktop.clickMode.double', 'Double Click'),
('en', 'settings', 'desktop.clickMode.saved', 'Click mode saved')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Seed: translations_log — Log app translations
-- =============================================================================
-- LOG NAMESPACE - Napló alkalmazás fordításai
-- =============================================================================
-- Ez a namespace tartalmazza a Log app összes szövegét.
-- Szekciók: menu, error (list, columns, table, filters), activity
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

-- Log app menü elemek (menu.json labelKey alapján)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'log', 'menu.error', 'Hiba'),
('hu', 'log', 'menu.activity', 'Aktivitás')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Hiba panel (ErrorLog.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'log', 'error.title', 'Hiba napló'),
('hu', 'log', 'error.list.label', 'Naplózott hibák'),
('hu', 'log', 'error.list.description', 'A rendszerben naplózott hibák listája')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Hiba napló - oszlopfejlécek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'log', 'error.columns.level', 'Szint'),
('hu', 'log', 'error.columns.message', 'Üzenet'),
('hu', 'log', 'error.columns.source', 'Forrás'),
('hu', 'log', 'error.columns.timestamp', 'Időpont'),
('hu', 'log', 'error.columns.url', 'URL')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Hiba napló - szűrők
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'log', 'error.filters.allLevels', 'Összes szint'),
('hu', 'log', 'error.filters.sourcePlaceholder', 'Forrás szűrése...'),
('hu', 'log', 'error.filters.reset', 'Visszaállítás')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Hiba napló - műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'log', 'error.actions.open', 'Részletek'),
('hu', 'log', 'error.actions.delete', 'Törlés')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Hiba napló - részletek nézet
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'log', 'error.detail.title', 'Napló bejegyzés részletei'),
('hu', 'log', 'error.detail.error', 'Nem sikerült betölteni a napló bejegyzést'),
('hu', 'log', 'error.detail.method', 'HTTP metódus'),
('hu', 'log', 'error.detail.routeId', 'Útvonal'),
('hu', 'log', 'error.detail.userId', 'Felhasználó ID'),
('hu', 'log', 'error.detail.userAgent', 'User Agent'),
('hu', 'log', 'error.detail.stack', 'Stack trace'),
('hu', 'log', 'error.detail.context', 'Kontextus'),
('hu', 'log', 'error.detail.deleteTitle', 'Napló bejegyzés törlése'),
('hu', 'log', 'error.detail.deleteDescription', 'Biztosan törölni szeretnéd ezt a napló bejegyzést? Ez a művelet nem vonható vissza.'),
('hu', 'log', 'error.detail.deleteConfirm', 'Törlés'),
('hu', 'log', 'error.detail.deleteSuccess', 'Napló bejegyzés sikeresen törölve'),
('hu', 'log', 'error.detail.deleteError', 'Nem sikerült törölni a napló bejegyzést')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Aktivitás panel (ActivityLog.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'log', 'activity.title', 'Aktivitás napló'),
('hu', 'log', 'activity.columns.action', 'Művelet'),
('hu', 'log', 'activity.columns.userId', 'Felhasználó'),
('hu', 'log', 'activity.columns.resource', 'Erőforrás'),
('hu', 'log', 'activity.columns.createdAt', 'Időpont'),
('hu', 'log', 'activity.filters.userIdPlaceholder', 'Felhasználó szűrése...'),
('hu', 'log', 'activity.filters.actionKeyPlaceholder', 'Művelet szűrése...'),
('hu', 'log', 'activity.loadError', 'Nem sikerült betölteni az aktivitás naplót')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

-- Log app menü elemek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'log', 'menu.error', 'Error'),
('en', 'log', 'menu.activity', 'Activity')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Error panel (ErrorLog.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'log', 'error.title', 'Error log'),
('en', 'log', 'error.list.label', 'Logged errors'),
('en', 'log', 'error.list.description', 'List of errors logged in the system')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Error log - column headers
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'log', 'error.columns.level', 'Level'),
('en', 'log', 'error.columns.message', 'Message'),
('en', 'log', 'error.columns.source', 'Source'),
('en', 'log', 'error.columns.timestamp', 'Timestamp'),
('en', 'log', 'error.columns.url', 'URL')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Error log - filters
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'log', 'error.filters.allLevels', 'All levels'),
('en', 'log', 'error.filters.sourcePlaceholder', 'Filter by source...'),
('en', 'log', 'error.filters.reset', 'Reset')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Error log - actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'log', 'error.actions.open', 'Details'),
('en', 'log', 'error.actions.delete', 'Delete')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Error log - detail view
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'log', 'error.detail.title', 'Log entry details'),
('en', 'log', 'error.detail.error', 'Failed to load log entry'),
('en', 'log', 'error.detail.method', 'HTTP method'),
('en', 'log', 'error.detail.routeId', 'Route'),
('en', 'log', 'error.detail.userId', 'User ID'),
('en', 'log', 'error.detail.userAgent', 'User Agent'),
('en', 'log', 'error.detail.stack', 'Stack trace'),
('en', 'log', 'error.detail.context', 'Context'),
('en', 'log', 'error.detail.deleteTitle', 'Delete log entry'),
('en', 'log', 'error.detail.deleteDescription', 'Are you sure you want to delete this log entry? This action cannot be undone.'),
('en', 'log', 'error.detail.deleteConfirm', 'Delete'),
('en', 'log', 'error.detail.deleteSuccess', 'Log entry deleted successfully'),
('en', 'log', 'error.detail.deleteError', 'Failed to delete log entry')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Activity panel (ActivityLog.svelte)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'log', 'activity.title', 'Activity log'),
('en', 'log', 'activity.columns.action', 'Action'),
('en', 'log', 'activity.columns.userId', 'User'),
('en', 'log', 'activity.columns.resource', 'Resource'),
('en', 'log', 'activity.columns.createdAt', 'Timestamp'),
('en', 'log', 'activity.filters.userIdPlaceholder', 'Filter by user...'),
('en', 'log', 'activity.filters.actionKeyPlaceholder', 'Filter by action...'),
('en', 'log', 'activity.loadError', 'Failed to load activity log')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Seed: translations_desktop — Desktop environment translations (Window, Taskbar, StartMenu)
-- =============================================================================
-- DESKTOP NAMESPACE - Desktop környezet fordításai
-- =============================================================================
-- Ez a namespace tartalmazza a desktop környezet szövegeit:
-- Desktop, Taskbar, Window, StartMenu komponensek
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

-- Desktop kontextus menü
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'contextMenu.customizeBackground', 'Háttér testreszabása'),
('hu', 'desktop', 'contextMenu.customizeTaskbar', 'Tálca testreszabása'),
('hu', 'desktop', 'contextMenu.customizeStartMenu', 'Indító panel testreszabása'),
('hu', 'desktop', 'contextMenu.refresh', 'Frissítés'),
('hu', 'desktop', 'contextMenu.settings', 'Beállítások'),
('hu', 'desktop', 'contextMenu.arrangeIcons', 'Asztali ikonok sorba rendezése'),
('hu', 'desktop', 'contextMenu.hideIcons', 'Asztali ikonok elrejtése'),
('hu', 'desktop', 'contextMenu.showIcons', 'Asztali ikonok megjelenítése')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Ablak (Window) komponens
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'window.loading', 'Betöltés...'),
('hu', 'desktop', 'window.loadError', 'Nem sikerült betölteni a komponenst'),
('hu', 'desktop', 'window.guidCopySuccess', 'Guid link sikeres vágólapra helyezése!'),
('hu', 'desktop', 'window.guidCopyError', 'Guid link sikertelen vágólapra helyezése!'),
('hu', 'desktop', 'window.guidTooltip', 'Guid generálás ablak megosztásához')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Ablak vezérlő gombok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'window.controls.minimize', 'Minimalizálás'),
('hu', 'desktop', 'window.controls.maximize', 'Maximalizálás'),
('hu', 'desktop', 'window.controls.restore', 'Visszaállítás'),
('hu', 'desktop', 'window.controls.close', 'Bezárás'),
('hu', 'desktop', 'window.controls.help', 'Súgó'),
('hu', 'desktop', 'window.controls.link', 'Link')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Start menü
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'startMenu.search', 'Keresés...'),
('hu', 'desktop', 'startMenu.loading', 'Alkalmazások betöltése...'),
('hu', 'desktop', 'startMenu.noApps', 'Nincs elérhető alkalmazás'),
('hu', 'desktop', 'startMenu.noResults', 'Nem található a keresésnek megfelelő alkalmazás'),
('hu', 'desktop', 'startMenu.error', 'Hiba történt'),
('hu', 'desktop', 'startMenu.retry', 'Újrapróbálás'),
('hu', 'desktop', 'startMenu.refresh', 'Frissítés'),
('hu', 'desktop', 'startMenu.retrying', 'Újrapróbálás...'),
('hu', 'desktop', 'startMenu.refreshing', 'Frissítés...')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Start menü lábléc
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'startMenu.footer.signOut', 'Kijelentkezés')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Videó háttér
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'videoBackground.notSupported', 'A böngésződ nem támogatja a videó lejátszást.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

-- Desktop kontextus menü
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'contextMenu.customizeBackground', 'Customize Background'),
('en', 'desktop', 'contextMenu.customizeTaskbar', 'Customize Taskbar'),
('en', 'desktop', 'contextMenu.customizeStartMenu', 'Customize Start Menu'),
('en', 'desktop', 'contextMenu.refresh', 'Refresh'),
('en', 'desktop', 'contextMenu.settings', 'Settings'),
('en', 'desktop', 'contextMenu.arrangeIcons', 'Arrange Desktop Icons'),
('en', 'desktop', 'contextMenu.hideIcons', 'Hide Desktop Icons'),
('en', 'desktop', 'contextMenu.showIcons', 'Show Desktop Icons')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Ablak (Window) komponens
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'window.loading', 'Loading...'),
('en', 'desktop', 'window.loadError', 'Failed to load component'),
('en', 'desktop', 'window.guidCopySuccess', 'Guid link copied to clipboard!'),
('en', 'desktop', 'window.guidCopyError', 'Failed to copy guid link to clipboard!'),
('en', 'desktop', 'window.guidTooltip', 'Generate guid for window sharing')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Ablak vezérlő gombok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'window.controls.minimize', 'Minimize'),
('en', 'desktop', 'window.controls.maximize', 'Maximize'),
('en', 'desktop', 'window.controls.restore', 'Restore'),
('en', 'desktop', 'window.controls.close', 'Close'),
('en', 'desktop', 'window.controls.help', 'Help'),
('en', 'desktop', 'window.controls.link', 'Link')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Start menü
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'startMenu.search', 'Search...'),
('en', 'desktop', 'startMenu.loading', 'Loading applications...'),
('en', 'desktop', 'startMenu.noApps', 'No applications available'),
('en', 'desktop', 'startMenu.noResults', 'No applications match your search'),
('en', 'desktop', 'startMenu.error', 'An error occurred'),
('en', 'desktop', 'startMenu.retry', 'Try Again'),
('en', 'desktop', 'startMenu.refresh', 'Refresh'),
('en', 'desktop', 'startMenu.retrying', 'Retrying...'),
('en', 'desktop', 'startMenu.refreshing', 'Refreshing...')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Start menü lábléc
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'startMenu.footer.signOut', 'Sign Out')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Videó háttér
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'videoBackground.notSupported', 'Your browser does not support video playback.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Asztali parancsikon (DesktopShortcut)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'shortcut.open', 'Megnyitás'),
('hu', 'desktop', 'shortcut.rename', 'Átnevezés'),
('hu', 'desktop', 'shortcut.delete', 'Törlés'),
('hu', 'desktop', 'shortcut.renameDialog.title', 'Parancsikon átnevezése'),
('hu', 'desktop', 'shortcut.renameDialog.label', 'Név'),
('hu', 'desktop', 'shortcut.renameDialog.placeholder', 'Adja meg az új nevet'),
('hu', 'desktop', 'shortcut.renameDialog.save', 'Mentés'),
('hu', 'desktop', 'shortcut.renameDialog.saving', 'Mentés...'),
('hu', 'desktop', 'shortcut.deleteDialog.title', 'Parancsikon törlése'),
('hu', 'desktop', 'shortcut.deleteDialog.description', 'Biztosan törölni szeretné ezt a parancsikonot az asztalról?')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Tálca - Chat ikon
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'taskbar.messages', 'Üzenetek')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Tartalom terület
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'desktop', 'contentArea.loading', 'Betöltés...'),
('hu', 'desktop', 'contentArea.selectMenuItem', 'Válassz egy menüpontot a bal oldalon')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Asztali parancsikon (DesktopShortcut) - EN
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'shortcut.open', 'Open'),
('en', 'desktop', 'shortcut.rename', 'Rename'),
('en', 'desktop', 'shortcut.delete', 'Delete'),
('en', 'desktop', 'shortcut.renameDialog.title', 'Rename Shortcut'),
('en', 'desktop', 'shortcut.renameDialog.label', 'Name'),
('en', 'desktop', 'shortcut.renameDialog.placeholder', 'Enter new name'),
('en', 'desktop', 'shortcut.renameDialog.save', 'Save'),
('en', 'desktop', 'shortcut.renameDialog.saving', 'Saving...'),
('en', 'desktop', 'shortcut.deleteDialog.title', 'Delete Shortcut'),
('en', 'desktop', 'shortcut.deleteDialog.description', 'Are you sure you want to delete this shortcut from the desktop?')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Taskbar - Chat icon - EN
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'taskbar.messages', 'Messages')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Content area - EN
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'desktop', 'contentArea.loading', 'Loading...'),
('en', 'desktop', 'contentArea.selectMenuItem', 'Select a menu item on the left')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Seed: translations_auth — Authentication pages translations (sign-in, sign-up, verification)
-- =============================================================================
-- AUTH NAMESPACE - Hitelesítési oldalak fordításai
-- =============================================================================
-- Ez a namespace tartalmazza a bejelentkezés, regisztráció és email
-- megerősítés oldalak szövegeit.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

-- Bejelentkezés oldal (sign-in)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'signIn.title', 'Üdvözöljük'),
('hu', 'auth', 'signIn.description', 'Fiókja eléréséhez kérjük jelentkezzen be.'),
('hu', 'auth', 'signIn.email', 'E-mail cím'),
('hu', 'auth', 'signIn.emailPlaceholder', 'pelda@email.com'),
('hu', 'auth', 'signIn.password', 'Jelszó'),
('hu', 'auth', 'signIn.forgotPassword', 'Elfelejtette a jelszavát?'),
('hu', 'auth', 'signIn.submit', 'Bejelentkezés'),
('hu', 'auth', 'signIn.submitting', 'Bejelentkezés...'),
('hu', 'auth', 'signIn.googleSignIn', 'Bejelentkezés Google-lel'),
('hu', 'auth', 'signIn.noAccount', 'Nincs még fiókja?'),
('hu', 'auth', 'signIn.register', 'Regisztráljon itt')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Bejelentkezés - hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'signIn.errors.invalidEmail', 'Érvénytelen e-mail cím formátum.'),
('hu', 'auth', 'signIn.errors.emailNotVerified', 'Az e-mail címe még nincs megerősítve. A bejelentkezéshez először meg kell erősítenie az e-mail címét.'),
('hu', 'auth', 'signIn.errors.invalidCredentials', 'Helytelen e-mail cím vagy jelszó. Kérjük ellenőrizze az adatokat.'),
('hu', 'auth', 'signIn.errors.userNotFound', 'Nincs regisztrált fiók ezzel az e-mail címmel. Kérjük először regisztráljon.'),
('hu', 'auth', 'signIn.errors.accountLocked', 'A fiók ideiglenesen zárolva van. Kérjük próbálja újra később.'),
('hu', 'auth', 'signIn.errors.rateLimit', 'Túl sok bejelentkezési kísérlet. Kérjük várjon egy kicsit és próbálja újra.'),
('hu', 'auth', 'signIn.errors.generic', 'Bejelentkezési hiba történt. Kérjük próbálja újra.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Bejelentkezés - email megerősítés értesítés
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'signIn.verification.title', 'E-mail megerősítés szükséges'),
('hu', 'auth', 'signIn.verification.registered', 'Sikeres regisztráció! Ellenőrizze a postafiókját a megerősítő e-mail után, majd jelentkezzen be.'),
('hu', 'auth', 'signIn.verification.required', 'A bejelentkezéshez először meg kell erősítenie az e-mail címét a regisztráció után kapott e-mailben található linkkel.'),
('hu', 'auth', 'signIn.verification.checkSpam', 'Ellenőrizze a postafiókját (beleértve a spam mappát is) a megerősítő e-mail után.'),
('hu', 'auth', 'signIn.verification.resend', 'Megerősítő e-mail újraküldése'),
('hu', 'auth', 'signIn.verification.newAccount', 'Új fiók létrehozása')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Bejelentkezés - Email OTP (jelszó nélküli bejelentkezés)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'signIn.emailOtp.useEmailCode', 'Bejelentkezés e-mail kóddal'),
('hu', 'auth', 'signIn.emailOtp.usePassword', 'Bejelentkezés jelszóval'),
('hu', 'auth', 'signIn.emailOtp.send', 'Kód küldése'),
('hu', 'auth', 'signIn.emailOtp.resend', 'Kód újraküldése'),
('hu', 'auth', 'signIn.emailOtp.verify', 'Ellenőrzés'),
('hu', 'auth', 'signIn.emailOtp.code', 'E-mail kód'),
('hu', 'auth', 'signIn.emailOtp.codePlaceholder', '000000'),
('hu', 'auth', 'signIn.emailOtp.codeHint', 'Adja meg az e-mailben kapott 6 számjegyű kódot'),
('hu', 'auth', 'signIn.emailOtp.errors.codeRequired', 'Kérjük adja meg a kódot'),
('hu', 'auth', 'signIn.emailOtp.errors.invalidCode', 'Érvénytelen vagy lejárt kód')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Regisztráció oldal (sign-up)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'signUp.title', 'Fiók létrehozása'),
('hu', 'auth', 'signUp.description', 'Adja meg adatait a fiók létrehozásához'),
('hu', 'auth', 'signUp.name', 'Teljes név'),
('hu', 'auth', 'signUp.namePlaceholder', 'Kovács János'),
('hu', 'auth', 'signUp.email', 'E-mail cím'),
('hu', 'auth', 'signUp.emailPlaceholder', 'pelda@email.com'),
('hu', 'auth', 'signUp.password', 'Jelszó'),
('hu', 'auth', 'signUp.confirmPassword', 'Jelszó megerősítése'),
('hu', 'auth', 'signUp.submit', 'Fiók létrehozása'),
('hu', 'auth', 'signUp.submitting', 'Fiók létrehozása...'),
('hu', 'auth', 'signUp.googleSignUp', 'Regisztráció Google-lel'),
('hu', 'auth', 'signUp.hasAccount', 'Már van fiókja?'),
('hu', 'auth', 'signUp.signIn', 'Bejelentkezés')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Regisztráció - email megerősítés figyelmeztetés
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'signUp.verification.warning', 'E-mail megerősítés szükséges'),
('hu', 'auth', 'signUp.verification.warningText', 'A regisztráció után megerősítő e-mailt fog kapni. A bejelentkezéshez kötelező az email cím megerősítése.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Regisztráció - sikeres
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'signUp.success.title', 'Fiók sikeresen létrehozva!'),
('hu', 'auth', 'signUp.success.emailSent', 'Megerősítő e-mailt küldtünk a(z) {email} címre.'),
('hu', 'auth', 'signUp.success.nextSteps', 'Következő lépések:'),
('hu', 'auth', 'signUp.success.step1', 'Ellenőrizze a postafiókját (beleértve a spam mappát is)'),
('hu', 'auth', 'signUp.success.step2', 'Kattintson a megerősítő linkre az e-mailben'),
('hu', 'auth', 'signUp.success.step3', 'Ezután bejelentkezhet a fiókjába'),
('hu', 'auth', 'signUp.success.verificationRequired', '⚠️ A bejelentkezéshez kötelező az e-mail cím megerősítése!'),
('hu', 'auth', 'signUp.success.noEmail', 'Nem kapta meg az e-mailt?'),
('hu', 'auth', 'signUp.success.backToSignIn', 'Vissza a bejelentkezéshez'),
('hu', 'auth', 'signUp.success.checkSpam', 'Ellenőrizze a spam mappát is, ha nem látja az e-mailt.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Regisztráció - validációs hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'signUp.errors.nameRequired', 'A név megadása kötelező'),
('hu', 'auth', 'signUp.errors.nameMinLength', 'A névnek legalább 2 karakter hosszúnak kell lennie'),
('hu', 'auth', 'signUp.errors.emailRequired', 'Az e-mail cím megadása kötelező'),
('hu', 'auth', 'signUp.errors.emailInvalid', 'Kérjük adjon meg egy érvényes e-mail címet'),
('hu', 'auth', 'signUp.errors.passwordRequired', 'A jelszó megadása kötelező'),
('hu', 'auth', 'signUp.errors.passwordMinLength', 'A jelszónak legalább 8 karakter hosszúnak kell lennie'),
('hu', 'auth', 'signUp.errors.passwordUppercase', 'A jelszónak tartalmaznia kell legalább egy nagybetűt'),
('hu', 'auth', 'signUp.errors.passwordLowercase', 'A jelszónak tartalmaznia kell legalább egy kisbetűt'),
('hu', 'auth', 'signUp.errors.passwordNumber', 'A jelszónak tartalmaznia kell legalább egy számot'),
('hu', 'auth', 'signUp.errors.passwordSpecial', 'A jelszónak tartalmaznia kell legalább egy speciális karaktert'),
('hu', 'auth', 'signUp.errors.confirmRequired', 'Kérjük erősítse meg a jelszót'),
('hu', 'auth', 'signUp.errors.passwordMismatch', 'A jelszavak nem egyeznek'),
('hu', 'auth', 'signUp.errors.emailExists', 'Ezzel az e-mail címmel már létezik fiók. Kérjük próbáljon bejelentkezni helyette.'),
('hu', 'auth', 'signUp.errors.network', 'Hálózati hiba miatt nem sikerült létrehozni a fiókot. Kérjük ellenőrizze az internetkapcsolatot és próbálja újra.'),
('hu', 'auth', 'signUp.errors.generic', 'A regisztráció sikertelen. Kérjük próbálja újra.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Email újraküldés oldal (resend-verification)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'resend.title', 'Megerősítő e-mail újraküldése'),
('hu', 'auth', 'resend.description', 'Adja meg e-mail címét, hogy új megerősítő e-mailt küldhessünk.'),
('hu', 'auth', 'resend.email', 'E-mail cím'),
('hu', 'auth', 'resend.emailPlaceholder', 'pelda@email.com'),
('hu', 'auth', 'resend.submit', 'Megerősítő e-mail küldése'),
('hu', 'auth', 'resend.submitting', 'Küldés...'),
('hu', 'auth', 'resend.retryIn', 'Újrapróbálkozás {seconds}s múlva'),
('hu', 'auth', 'resend.backToSignIn', 'Vissza a bejelentkezéshez'),
('hu', 'auth', 'resend.noAccount', 'Nincs még fiókja?'),
('hu', 'auth', 'resend.register', 'Regisztráljon itt'),
('hu', 'auth', 'resend.checkSpam', 'Nem kapta meg az e-mailt? Ellenőrizze a spam mappát is.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Email újraküldés - állapot üzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'resend.success', 'Megerősítő e-mail sikeresen elküldve! Ellenőrizze a postafiókját.'),
('hu', 'auth', 'resend.errors.emailRequired', 'Kérjük adja meg az email címét'),
('hu', 'auth', 'resend.errors.emailInvalid', 'Kérjük adjon meg egy érvényes e-mail címet'),
('hu', 'auth', 'resend.errors.rateLimit', 'Túl sok kérés. Kérjük próbálja újra később.'),
('hu', 'auth', 'resend.errors.notFound', 'Ez az e-mail cím nincs regisztrálva a rendszerben.'),
('hu', 'auth', 'resend.errors.alreadyVerified', 'Ez az e-mail cím már megerősítésre került.'),
('hu', 'auth', 'resend.errors.generic', 'Hiba történt az e-mail küldése során.'),
('hu', 'auth', 'resend.errors.network', 'Hálózati hiba történt. Kérjük próbálja újra.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Elfelejtett jelszó oldal (forgot-password)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'forgotPassword.title', 'Elfelejtett jelszó'),
('hu', 'auth', 'forgotPassword.description', 'Adja meg e-mail címét, és küldünk egy linket a jelszó visszaállításához.'),
('hu', 'auth', 'forgotPassword.email', 'E-mail cím'),
('hu', 'auth', 'forgotPassword.emailPlaceholder', 'pelda@email.com'),
('hu', 'auth', 'forgotPassword.submit', 'Jelszó visszaállítási link küldése'),
('hu', 'auth', 'forgotPassword.submitting', 'Küldés...'),
('hu', 'auth', 'forgotPassword.backToSignIn', 'Vissza a bejelentkezéshez'),
('hu', 'auth', 'forgotPassword.info', 'Adja meg fiókjához tartozó e-mail címét. Ha létezik ilyen fiók, küldünk egy linket a jelszó visszaállításához.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Elfelejtett jelszó - hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'forgotPassword.errors.emailRequired', 'Kérjük adja meg az e-mail címét'),
('hu', 'auth', 'forgotPassword.errors.emailInvalid', 'Kérjük adjon meg egy érvényes e-mail címet'),
('hu', 'auth', 'forgotPassword.errors.network', 'Hálózati hiba történt. Kérjük próbálja újra.'),
('hu', 'auth', 'forgotPassword.errors.rateLimit', 'Túl sok kérés. Kérjük próbálja újra később.'),
('hu', 'auth', 'forgotPassword.errors.generic', 'Hiba történt. Kérjük próbálja újra.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Elfelejtett jelszó - sikeres üzenet
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'forgotPassword.success.title', 'E-mail elküldve'),
('hu', 'auth', 'forgotPassword.success.message', 'Ha létezik fiók ezzel az e-mail címmel ({email}), küldtünk egy linket a jelszó visszaállításához.'),
('hu', 'auth', 'forgotPassword.success.nextSteps', 'Következő lépések:'),
('hu', 'auth', 'forgotPassword.success.step1', 'Ellenőrizze a postafiókját'),
('hu', 'auth', 'forgotPassword.success.step2', 'Kattintson a jelszó visszaállítási linkre'),
('hu', 'auth', 'forgotPassword.success.step3', 'Állítson be új jelszót'),
('hu', 'auth', 'forgotPassword.success.checkSpam', 'Nem kapta meg az e-mailt? Ellenőrizze a spam mappát is.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jelszó visszaállítás oldal (reset-password)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'resetPassword.title', 'Jelszó visszaállítása'),
('hu', 'auth', 'resetPassword.description', 'Adjon meg egy új jelszót fiókjához.'),
('hu', 'auth', 'resetPassword.newPassword', 'Új jelszó'),
('hu', 'auth', 'resetPassword.confirmPassword', 'Jelszó megerősítése'),
('hu', 'auth', 'resetPassword.submit', 'Jelszó visszaállítása'),
('hu', 'auth', 'resetPassword.submitting', 'Visszaállítás...'),
('hu', 'auth', 'resetPassword.backToSignIn', 'Vissza a bejelentkezéshez'),
('hu', 'auth', 'resetPassword.requestNewLink', 'Új link kérése')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jelszó visszaállítás - hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'resetPassword.errors.passwordRequired', 'Kérjük adjon meg egy jelszót'),
('hu', 'auth', 'resetPassword.errors.passwordMinLength', 'A jelszónak legalább 8 karakter hosszúnak kell lennie'),
('hu', 'auth', 'resetPassword.errors.passwordUppercase', 'A jelszónak tartalmaznia kell legalább egy nagybetűt'),
('hu', 'auth', 'resetPassword.errors.passwordLowercase', 'A jelszónak tartalmaznia kell legalább egy kisbetűt'),
('hu', 'auth', 'resetPassword.errors.passwordNumber', 'A jelszónak tartalmaznia kell legalább egy számot'),
('hu', 'auth', 'resetPassword.errors.passwordSpecial', 'A jelszónak tartalmaznia kell legalább egy speciális karaktert'),
('hu', 'auth', 'resetPassword.errors.confirmRequired', 'Kérjük erősítse meg a jelszót'),
('hu', 'auth', 'resetPassword.errors.passwordMismatch', 'A jelszavak nem egyeznek'),
('hu', 'auth', 'resetPassword.errors.invalidToken', 'A jelszó visszaállítási link érvénytelen vagy lejárt'),
('hu', 'auth', 'resetPassword.errors.noToken', 'Hiányzó jelszó visszaállítási token'),
('hu', 'auth', 'resetPassword.errors.network', 'Hálózati hiba történt. Kérjük próbálja újra.'),
('hu', 'auth', 'resetPassword.errors.generic', 'Hiba történt. Kérjük próbálja újra.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jelszó visszaállítás - sikeres üzenet
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'resetPassword.success.title', 'Jelszó sikeresen visszaállítva'),
('hu', 'auth', 'resetPassword.success.message', 'A jelszava sikeresen megváltozott. Most már bejelentkezhet az új jelszavával.'),
('hu', 'auth', 'resetPassword.success.signIn', 'Bejelentkezés')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

-- Bejelentkezés oldal
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'signIn.title', 'Welcome'),
('en', 'auth', 'signIn.description', 'Please sign in to access your account.'),
('en', 'auth', 'signIn.email', 'Email'),
('en', 'auth', 'signIn.emailPlaceholder', 'example@email.com'),
('en', 'auth', 'signIn.password', 'Password'),
('en', 'auth', 'signIn.forgotPassword', 'Forgot your password?'),
('en', 'auth', 'signIn.submit', 'Sign In'),
('en', 'auth', 'signIn.submitting', 'Signing in...'),
('en', 'auth', 'signIn.googleSignIn', 'Sign in with Google'),
('en', 'auth', 'signIn.noAccount', 'Don''t have an account?'),
('en', 'auth', 'signIn.register', 'Register here')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Bejelentkezés - hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'signIn.errors.invalidEmail', 'Invalid email format.'),
('en', 'auth', 'signIn.errors.emailNotVerified', 'Your email address has not been verified yet. Please verify your email to sign in.'),
('en', 'auth', 'signIn.errors.invalidCredentials', 'Invalid email or password. Please check your credentials.'),
('en', 'auth', 'signIn.errors.userNotFound', 'No account found with this email. Please register first.'),
('en', 'auth', 'signIn.errors.accountLocked', 'Account temporarily locked. Please try again later.'),
('en', 'auth', 'signIn.errors.rateLimit', 'Too many login attempts. Please wait and try again.'),
('en', 'auth', 'signIn.errors.generic', 'Login error occurred. Please try again.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Bejelentkezés - email megerősítés értesítés
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'signIn.verification.title', 'Email verification required'),
('en', 'auth', 'signIn.verification.registered', 'Registration successful! Check your inbox for the verification email, then sign in.'),
('en', 'auth', 'signIn.verification.required', 'Please verify your email address using the link in the registration email before signing in.'),
('en', 'auth', 'signIn.verification.checkSpam', 'Check your inbox (including spam folder) for the verification email.'),
('en', 'auth', 'signIn.verification.resend', 'Resend verification email'),
('en', 'auth', 'signIn.verification.newAccount', 'Create new account')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Bejelentkezés - Email OTP (jelszó nélküli bejelentkezés)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'signIn.emailOtp.useEmailCode', 'Sign in with email code'),
('en', 'auth', 'signIn.emailOtp.usePassword', 'Sign in with password'),
('en', 'auth', 'signIn.emailOtp.send', 'Send code'),
('en', 'auth', 'signIn.emailOtp.resend', 'Resend code'),
('en', 'auth', 'signIn.emailOtp.verify', 'Verify'),
('en', 'auth', 'signIn.emailOtp.code', 'Email code'),
('en', 'auth', 'signIn.emailOtp.codePlaceholder', '000000'),
('en', 'auth', 'signIn.emailOtp.codeHint', 'Enter the 6-digit code from your email'),
('en', 'auth', 'signIn.emailOtp.errors.codeRequired', 'Please enter the code'),
('en', 'auth', 'signIn.emailOtp.errors.invalidCode', 'Invalid or expired code')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Regisztráció oldal
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'signUp.title', 'Create Account'),
('en', 'auth', 'signUp.description', 'Enter your details to create an account'),
('en', 'auth', 'signUp.name', 'Full Name'),
('en', 'auth', 'signUp.namePlaceholder', 'John Doe'),
('en', 'auth', 'signUp.email', 'Email'),
('en', 'auth', 'signUp.emailPlaceholder', 'example@email.com'),
('en', 'auth', 'signUp.password', 'Password'),
('en', 'auth', 'signUp.confirmPassword', 'Confirm Password'),
('en', 'auth', 'signUp.submit', 'Create Account'),
('en', 'auth', 'signUp.submitting', 'Creating account...'),
('en', 'auth', 'signUp.googleSignUp', 'Sign up with Google'),
('en', 'auth', 'signUp.hasAccount', 'Already have an account?'),
('en', 'auth', 'signUp.signIn', 'Sign In')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Regisztráció - email megerősítés figyelmeztetés
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'signUp.verification.warning', 'Email verification required'),
('en', 'auth', 'signUp.verification.warningText', 'You will receive a verification email after registration. Email verification is required to sign in.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Regisztráció - sikeres
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'signUp.success.title', 'Account created successfully!'),
('en', 'auth', 'signUp.success.emailSent', 'We sent a verification email to {email}.'),
('en', 'auth', 'signUp.success.nextSteps', 'Next steps:'),
('en', 'auth', 'signUp.success.step1', 'Check your inbox (including spam folder)'),
('en', 'auth', 'signUp.success.step2', 'Click the verification link in the email'),
('en', 'auth', 'signUp.success.step3', 'Then you can sign in to your account'),
('en', 'auth', 'signUp.success.verificationRequired', '⚠️ Email verification is required to sign in!'),
('en', 'auth', 'signUp.success.noEmail', 'Didn''t receive the email?'),
('en', 'auth', 'signUp.success.backToSignIn', 'Back to sign in'),
('en', 'auth', 'signUp.success.checkSpam', 'Check your spam folder if you don''t see the email.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Regisztráció - validációs hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'signUp.errors.nameRequired', 'Name is required'),
('en', 'auth', 'signUp.errors.nameMinLength', 'Name must be at least 2 characters'),
('en', 'auth', 'signUp.errors.emailRequired', 'Email is required'),
('en', 'auth', 'signUp.errors.emailInvalid', 'Please enter a valid email address'),
('en', 'auth', 'signUp.errors.passwordRequired', 'Password is required'),
('en', 'auth', 'signUp.errors.passwordMinLength', 'Password must be at least 8 characters'),
('en', 'auth', 'signUp.errors.passwordUppercase', 'Password must contain at least one uppercase letter'),
('en', 'auth', 'signUp.errors.passwordLowercase', 'Password must contain at least one lowercase letter'),
('en', 'auth', 'signUp.errors.passwordNumber', 'Password must contain at least one number'),
('en', 'auth', 'signUp.errors.passwordSpecial', 'Password must contain at least one special character'),
('en', 'auth', 'signUp.errors.confirmRequired', 'Please confirm your password'),
('en', 'auth', 'signUp.errors.passwordMismatch', 'Passwords do not match'),
('en', 'auth', 'signUp.errors.emailExists', 'An account with this email already exists. Please try signing in instead.'),
('en', 'auth', 'signUp.errors.network', 'Network error. Please check your connection and try again.'),
('en', 'auth', 'signUp.errors.generic', 'Registration failed. Please try again.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- Email újraküldés oldal
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'resend.title', 'Resend Verification Email'),
('en', 'auth', 'resend.description', 'Enter your email address to receive a new verification email.'),
('en', 'auth', 'resend.email', 'Email'),
('en', 'auth', 'resend.emailPlaceholder', 'example@email.com'),
('en', 'auth', 'resend.submit', 'Send Verification Email'),
('en', 'auth', 'resend.submitting', 'Sending...'),
('en', 'auth', 'resend.retryIn', 'Retry in {seconds}s'),
('en', 'auth', 'resend.backToSignIn', 'Back to sign in'),
('en', 'auth', 'resend.noAccount', 'Don''t have an account?'),
('en', 'auth', 'resend.register', 'Register here'),
('en', 'auth', 'resend.checkSpam', 'Didn''t receive the email? Check your spam folder.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Email újraküldés - állapot üzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'resend.success', 'Verification email sent successfully! Check your inbox.'),
('en', 'auth', 'resend.errors.emailRequired', 'Please enter your email address'),
('en', 'auth', 'resend.errors.emailInvalid', 'Please enter a valid email address'),
('en', 'auth', 'resend.errors.rateLimit', 'Too many requests. Please try again later.'),
('en', 'auth', 'resend.errors.notFound', 'This email address is not registered.'),
('en', 'auth', 'resend.errors.alreadyVerified', 'This email address has already been verified.'),
('en', 'auth', 'resend.errors.generic', 'Error sending email.'),
('en', 'auth', 'resend.errors.network', 'Network error. Please try again.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- 2FA ellenőrzés oldal (verify-2fa)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'verify2fa.title', 'Kétfaktoros hitelesítés'),
('hu', 'auth', 'verify2fa.description', 'Adja meg hitelesítő alkalmazásból származó kódot.'),
('hu', 'auth', 'verify2fa.code', 'Hitelesítő kód'),
('hu', 'auth', 'verify2fa.codePlaceholder', '000000'),
('hu', 'auth', 'verify2fa.codeHint', 'Adja meg a 6 számjegyű kódot hitelesítő alkalmazásból'),
('hu', 'auth', 'verify2fa.backupCode', 'Tartalék kód'),
('hu', 'auth', 'verify2fa.backupCodePlaceholder', 'xxxx-xxxx-xxxx'),
('hu', 'auth', 'verify2fa.backupCodeHint', 'Adja meg az egyik tartalék kódot'),
('hu', 'auth', 'verify2fa.trustDevice', 'Eszköz megbízhatónak jelölése 30 napra'),
('hu', 'auth', 'verify2fa.submit', 'Ellenőrzés'),
('hu', 'auth', 'verify2fa.verifying', 'Ellenőrzés...'),
('hu', 'auth', 'verify2fa.useBackupCode', 'Tartalék kód használata'),
('hu', 'auth', 'verify2fa.useAuthenticator', 'Hitelesítő alkalmazás használata'),
('hu', 'auth', 'verify2fa.sendOTP', 'Kód küldése emailben'),
('hu', 'auth', 'verify2fa.backToSignIn', 'Vissza a bejelentkezéshez')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'verify2fa.title', 'Two-Factor Authentication'),
('en', 'auth', 'verify2fa.description', 'Enter the code from your authenticator app.'),
('en', 'auth', 'verify2fa.code', 'Authentication Code'),
('en', 'auth', 'verify2fa.codePlaceholder', '000000'),
('en', 'auth', 'verify2fa.codeHint', 'Enter the 6-digit code from your authenticator app'),
('en', 'auth', 'verify2fa.backupCode', 'Backup Code'),
('en', 'auth', 'verify2fa.backupCodePlaceholder', 'xxxx-xxxx-xxxx'),
('en', 'auth', 'verify2fa.backupCodeHint', 'Enter one of your backup codes'),
('en', 'auth', 'verify2fa.trustDevice', 'Trust this device for 30 days'),
('en', 'auth', 'verify2fa.submit', 'Verify'),
('en', 'auth', 'verify2fa.verifying', 'Verifying...'),
('en', 'auth', 'verify2fa.useBackupCode', 'Use backup code'),
('en', 'auth', 'verify2fa.useAuthenticator', 'Use authenticator app'),
('en', 'auth', 'verify2fa.sendOTP', 'Send code via email'),
('en', 'auth', 'verify2fa.backToSignIn', 'Back to sign in')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- 2FA ellenőrzés - hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'verify2fa.errors.invalidCode', 'Érvénytelen kód. Kérjük próbálja újra.'),
('hu', 'auth', 'verify2fa.errors.expiredCode', 'A kód lejárt. Kérjük próbáljon új kódot.'),
('hu', 'auth', 'verify2fa.errors.invalidBackupCode', 'Érvénytelen tartalék kód.'),
('hu', 'auth', 'verify2fa.errors.otpSendFailed', 'Az email küldése sikertelen.'),
('hu', 'auth', 'verify2fa.errors.generic', 'Ellenőrzési hiba történt.'),
('hu', 'auth', 'verify2fa.otpSent', 'Ellenőrző kód elküldve email címére. Ellenőrizze a postafiókját.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'verify2fa.errors.invalidCode', 'Invalid code. Please try again.'),
('en', 'auth', 'verify2fa.errors.expiredCode', 'Code expired. Please try a new code.'),
('en', 'auth', 'verify2fa.errors.invalidBackupCode', 'Invalid backup code.'),
('en', 'auth', 'verify2fa.errors.otpSendFailed', 'Failed to send email.'),
('en', 'auth', 'verify2fa.errors.generic', 'Verification error occurred.'),
('en', 'auth', 'verify2fa.otpSent', 'Verification code sent to your email. Check your inbox.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Elfelejtett jelszó oldal (forgot-password) - English
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'forgotPassword.title', 'Forgot Password'),
('en', 'auth', 'forgotPassword.description', 'Enter your email address and we''ll send you a link to reset your password.'),
('en', 'auth', 'forgotPassword.email', 'Email'),
('en', 'auth', 'forgotPassword.emailPlaceholder', 'example@email.com'),
('en', 'auth', 'forgotPassword.submit', 'Send Password Reset Link'),
('en', 'auth', 'forgotPassword.submitting', 'Sending...'),
('en', 'auth', 'forgotPassword.backToSignIn', 'Back to sign in'),
('en', 'auth', 'forgotPassword.info', 'Enter the email address associated with your account. If an account exists, we''ll send you a link to reset your password.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Elfelejtett jelszó - hibaüzenetek - English
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'forgotPassword.errors.emailRequired', 'Please enter your email address'),
('en', 'auth', 'forgotPassword.errors.emailInvalid', 'Please enter a valid email address'),
('en', 'auth', 'forgotPassword.errors.network', 'Network error occurred. Please try again.'),
('en', 'auth', 'forgotPassword.errors.rateLimit', 'Too many requests. Please try again later.'),
('en', 'auth', 'forgotPassword.errors.generic', 'An error occurred. Please try again.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Elfelejtett jelszó - sikeres üzenet - English
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'forgotPassword.success.title', 'Email Sent'),
('en', 'auth', 'forgotPassword.success.message', 'If an account exists with this email address ({email}), we''ve sent a password reset link.'),
('en', 'auth', 'forgotPassword.success.nextSteps', 'Next steps:'),
('en', 'auth', 'forgotPassword.success.step1', 'Check your inbox'),
('en', 'auth', 'forgotPassword.success.step2', 'Click the password reset link'),
('en', 'auth', 'forgotPassword.success.step3', 'Set a new password'),
('en', 'auth', 'forgotPassword.success.checkSpam', 'Didn''t receive the email? Check your spam folder.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jelszó visszaállítás oldal (reset-password) - English
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'resetPassword.title', 'Reset Password'),
('en', 'auth', 'resetPassword.description', 'Enter a new password for your account.'),
('en', 'auth', 'resetPassword.newPassword', 'New Password'),
('en', 'auth', 'resetPassword.confirmPassword', 'Confirm Password'),
('en', 'auth', 'resetPassword.submit', 'Reset Password'),
('en', 'auth', 'resetPassword.submitting', 'Resetting...'),
('en', 'auth', 'resetPassword.backToSignIn', 'Back to sign in'),
('en', 'auth', 'resetPassword.requestNewLink', 'Request new link')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jelszó visszaállítás - hibaüzenetek - English
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'resetPassword.errors.passwordRequired', 'Please enter a password'),
('en', 'auth', 'resetPassword.errors.passwordMinLength', 'Password must be at least 8 characters long'),
('en', 'auth', 'resetPassword.errors.passwordUppercase', 'Password must contain at least one uppercase letter'),
('en', 'auth', 'resetPassword.errors.passwordLowercase', 'Password must contain at least one lowercase letter'),
('en', 'auth', 'resetPassword.errors.passwordNumber', 'Password must contain at least one number'),
('en', 'auth', 'resetPassword.errors.passwordSpecial', 'Password must contain at least one special character'),
('en', 'auth', 'resetPassword.errors.confirmRequired', 'Please confirm your password'),
('en', 'auth', 'resetPassword.errors.passwordMismatch', 'Passwords do not match'),
('en', 'auth', 'resetPassword.errors.invalidToken', 'The password reset link is invalid or has expired'),
('en', 'auth', 'resetPassword.errors.noToken', 'Missing password reset token'),
('en', 'auth', 'resetPassword.errors.network', 'Network error occurred. Please try again.'),
('en', 'auth', 'resetPassword.errors.generic', 'An error occurred. Please try again.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jelszó visszaállítás - sikeres üzenet - English
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'resetPassword.success.title', 'Password Reset Successfully'),
('en', 'auth', 'resetPassword.success.message', 'Your password has been changed successfully. You can now sign in with your new password.'),
('en', 'auth', 'resetPassword.success.signIn', 'Sign In')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Demo mód figyelmeztetés
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'auth', 'demo.notice', 'Demo mód: Ez egy bemutató környezet. A rendszer minden nap visszaáll az alapállapotba – a regisztrációk, beállítások és minden elvégzett művelet elvész. Kizárólag tesztelési célra használható.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'auth', 'demo.notice', 'Demo mode: This is a demonstration environment. The system resets to its default state every day – registrations, settings and all performed actions will be lost. For testing purposes only.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Seed: translations_user — Users app translations (menu, columns, lists)
-- =============================================================================
-- USER NAMESPACE - Felhasználók alkalmazás fordításai
-- =============================================================================
-- Ez a namespace tartalmazza a Users app összes szövegét.
-- Szekciók: menu, users, groups, roles, permissions, resources, common
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

-- Menü elemek (menu.json labelKey alapján)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'menu.users', 'Felhasználók'),
('hu', 'users', 'menu.accessManagement', 'Hozzáférés-kezelés'),
('hu', 'users', 'menu.groups', 'Csoportok'),
('hu', 'users', 'menu.roles', 'Szerepkörök'),
('hu', 'users', 'menu.permissions', 'Jogosultságok'),
('hu', 'users', 'menu.resources', 'Erőforrások')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultságok (requiredPermission alapján)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'permissions.users.users.view', 'Felhasználók megtekintése'),
('hu', 'users', 'permissions.users.groups.view', 'Csoportok megtekintése'),
('hu', 'users', 'permissions.users.roles.view', 'Szerepkörök megtekintése'),
('hu', 'users', 'permissions.users.permissions.view', 'Jogosultságok megtekintése'),
('hu', 'users', 'permissions.users.resources.view', 'Erőforrások megtekintése')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználók lista
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'users.list.label', 'Felhasználók'),
('hu', 'users', 'users.list.description', 'A rendszerben regisztrált felhasználók listája')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználók oszlopfejlécek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'users.columns.name', 'Teljes név'),
('hu', 'users', 'users.columns.email', 'E-mail cím'),
('hu', 'users', 'users.columns.username', 'Felhasználónév'),
('hu', 'users', 'users.columns.emailVerified', 'E-mail megerősítve'),
('hu', 'users', 'users.columns.createdAt', 'Regisztráció dátuma'),
('hu', 'users', 'users.columns.isActive', 'Állapot'),
('hu', 'users', 'users.columns.provider', 'Provider')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználók szűrők
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'users.filters.active', 'Aktív'),
('hu', 'users', 'users.filters.inactive', 'Inaktív'),
('hu', 'users', 'users.filters.reset', 'Szűrők törlése'),
('hu', 'users', 'users.filters.searchPlaceholder', 'Keresés név vagy e-mail alapján...')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználók provider típusok
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'users.providers.credential', 'E-mail/jelszó'),
('hu', 'users', 'users.providers.google', 'Google'),
('hu', 'users', 'users.providers.facebook', 'Facebook'),
('hu', 'users', 'users.providers.github', 'GitHub')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoportok lista
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.list.label', 'Csoportok'),
('hu', 'users', 'groups.list.description', 'A rendszerben definiált felhasználói csoportok')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoportok oszlopfejlécek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.columns.name', 'Csoport neve'),
('hu', 'users', 'groups.columns.description', 'Leírás'),
('hu', 'users', 'groups.columns.createdAt', 'Létrehozás dátuma')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkörök lista
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.list.label', 'Szerepkörök'),
('hu', 'users', 'roles.list.description', 'A rendszerben definiált szerepkörök')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkörök oszlopfejlécek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.columns.name', 'Szerepkör neve'),
('hu', 'users', 'roles.columns.description', 'Leírás'),
('hu', 'users', 'roles.columns.createdAt', 'Létrehozás dátuma')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultságok lista
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'permissions.list.label', 'Jogosultságok'),
('hu', 'users', 'permissions.list.description', 'A rendszerben definiált jogosultságok')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultságok oszlopfejlécek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'permissions.columns.name', 'Jogosultság neve'),
('hu', 'users', 'permissions.columns.description', 'Leírás'),
('hu', 'users', 'permissions.columns.resourceName', 'Erőforrás'),
('hu', 'users', 'permissions.columns.createdAt', 'Létrehozás dátuma')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Erőforrások lista
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'resources.list.label', 'Erőforrások'),
('hu', 'users', 'resources.list.description', 'A rendszerben definiált védett erőforrások')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Erőforrások oszlopfejlécek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'resources.columns.name', 'Erőforrás neve'),
('hu', 'users', 'resources.columns.description', 'Leírás'),
('hu', 'users', 'resources.columns.createdAt', 'Létrehozás dátuma')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználók műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'users.actions.open', 'Részletek')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználó részletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'users.detail.title', 'Felhasználó részletei'),
('hu', 'users', 'users.detail.error', 'A felhasználó adatainak betöltése sikertelen'),
('hu', 'users', 'users.detail.groups', 'Csoportok'),
('hu', 'users', 'users.detail.roles', 'Szerepkörök'),
('hu', 'users', 'users.detail.noGroups', 'Nincs csoporthoz rendelve'),
('hu', 'users', 'users.detail.noRoles', 'Nincs szerepkörhöz rendelve'),
('hu', 'users', 'users.detail.addGroup', 'Hozzáadás'),
('hu', 'users', 'users.detail.addRole', 'Hozzáadás'),
('hu', 'users', 'users.detail.searchGroup', 'Keresés...'),
('hu', 'users', 'users.detail.searchRole', 'Keresés...'),
('hu', 'users', 'users.detail.noGroupsAvailable', 'Nincs elérhető csoport'),
('hu', 'users', 'users.detail.noRolesAvailable', 'Nincs elérhető szerepkör'),
('hu', 'users', 'users.detail.groupAdded', 'Felhasználó hozzáadva a csoporthoz'),
('hu', 'users', 'users.detail.groupRemoved', 'Felhasználó eltávolítva a csoportból'),
('hu', 'users', 'users.detail.roleAdded', 'Szerepkör hozzárendelve'),
('hu', 'users', 'users.detail.roleRemoved', 'Szerepkör eltávolítva'),
('hu', 'users', 'users.detail.groupAddError', 'Nem sikerült hozzáadni a csoporthoz'),
('hu', 'users', 'users.detail.groupRemoveError', 'Nem sikerült eltávolítani a csoportból'),
('hu', 'users', 'users.detail.roleAddError', 'Nem sikerült hozzárendelni a szerepkört'),
('hu', 'users', 'users.detail.roleRemoveError', 'Nem sikerült eltávolítani a szerepkört'),
('hu', 'users', 'users.detail.saveSuccess', 'A változtatások sikeresen mentve'),
('hu', 'users', 'users.detail.saveError', 'A változtatások mentése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználó aktív státusz és inaktiválás
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'users.detail.accountStatus', 'Fiók állapota'),
('hu', 'users', 'users.detail.active', 'Aktív'),
('hu', 'users', 'users.detail.inactive', 'Inaktív'),
('hu', 'users', 'users.detail.deactivateUser', 'Felhasználó inaktiválása'),
('hu', 'users', 'users.detail.activateUser', 'Felhasználó aktiválása'),
('hu', 'users', 'users.detail.deactivateDescription', 'Biztosan inaktiválni szeretnéd ezt a felhasználót ({name} - {email})? Az inaktív felhasználó nem tud bejelentkezni a rendszerbe.'),
('hu', 'users', 'users.detail.activateDescription', 'Biztosan aktiválni szeretnéd ezt a felhasználót ({name} - {email})?'),
('hu', 'users', 'users.detail.deactivateConfirm', 'Inaktiválás'),
('hu', 'users', 'users.detail.activateConfirm', 'Aktiválás'),
('hu', 'users', 'users.detail.deactivateSuccess', 'A felhasználó sikeresen inaktiválva'),
('hu', 'users', 'users.detail.activateSuccess', 'A felhasználó sikeresen aktiválva'),
('hu', 'users', 'users.detail.deactivateError', 'A felhasználó állapotának módosítása sikertelen'),
('hu', 'users', 'users.detail.deleteUser', 'Felhasználó törlése')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport részletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.detail.title', 'Csoport részletei'),
('hu', 'users', 'groups.detail.name', 'Csoport neve'),
('hu', 'users', 'groups.detail.description', 'Leírás'),
('hu', 'users', 'groups.detail.members', 'Csoport tagjai'),
('hu', 'users', 'groups.detail.error', 'A csoport adatainak betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.actions.removeUser', 'Eltávolítás a csoportból')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználó hozzáadása csoporthoz
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.addUser.button', 'Felhasználó hozzáadása'),
('hu', 'users', 'groups.addUser.title', 'Felhasználó hozzáadása a csoporthoz'),
('hu', 'users', 'groups.addUser.description', 'Válassz egy felhasználót, akit hozzá szeretnél adni ehhez a csoporthoz.'),
('hu', 'users', 'groups.addUser.selectLabel', 'Felhasználó'),
('hu', 'users', 'groups.addUser.selectPlaceholder', 'Válassz felhasználót...'),
('hu', 'users', 'groups.addUser.searchPlaceholder', 'Keresés...'),
('hu', 'users', 'groups.addUser.noResults', 'Nincs találat.'),
('hu', 'users', 'groups.addUser.confirm', 'Hozzáadás'),
('hu', 'users', 'groups.addUser.success', 'A felhasználó sikeresen hozzáadva a csoporthoz'),
('hu', 'users', 'groups.addUser.error', 'A felhasználó hozzáadása sikertelen'),
('hu', 'users', 'groups.addUser.loadError', 'Az elérhető felhasználók betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználó eltávolítása csoportból
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.removeUser.title', 'Felhasználó eltávolítása'),
('hu', 'users', 'groups.removeUser.description', 'Biztosan el szeretnéd távolítani ezt a felhasználót ({name} - {email}) a csoportból?'),
('hu', 'users', 'groups.removeUser.confirm', 'Eltávolítás'),
('hu', 'users', 'groups.removeUser.cancel', 'Mégse'),
('hu', 'users', 'groups.removeUser.success', 'A felhasználó sikeresen eltávolítva a csoportból'),
('hu', 'users', 'groups.removeUser.error', 'A felhasználó eltávolítása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Közös hibaüzenetek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'common.error.loadFailed', 'Az adatok betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkör részletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.detail.title', 'Szerepkör részletei'),
('hu', 'users', 'roles.detail.name', 'Szerepkör neve'),
('hu', 'users', 'roles.detail.description', 'Leírás'),
('hu', 'users', 'roles.detail.permissions', 'Jogosultságok'),
('hu', 'users', 'roles.detail.members', 'Tagok'),
('hu', 'users', 'roles.detail.error', 'A szerepkör adatainak betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkör műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.actions.removePermission', 'Eltávolítás a szerepkörből'),
('hu', 'users', 'roles.actions.removeUser', 'Eltávolítás a szerepkörből')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultság hozzáadása szerepkörhöz
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.addPermission.button', 'Jogosultság hozzáadása'),
('hu', 'users', 'roles.addPermission.title', 'Jogosultság hozzáadása a szerepkörhöz'),
('hu', 'users', 'roles.addPermission.description', 'Válassz egy jogosultságot, amit hozzá szeretnél adni ehhez a szerepkörhöz.'),
('hu', 'users', 'roles.addPermission.selectLabel', 'Jogosultság'),
('hu', 'users', 'roles.addPermission.selectPlaceholder', 'Válassz jogosultságot...'),
('hu', 'users', 'roles.addPermission.searchPlaceholder', 'Keresés...'),
('hu', 'users', 'roles.addPermission.noResults', 'Nincs találat.'),
('hu', 'users', 'roles.addPermission.confirm', 'Hozzáadás'),
('hu', 'users', 'roles.addPermission.success', 'A jogosultság sikeresen hozzáadva a szerepkörhöz'),
('hu', 'users', 'roles.addPermission.error', 'A jogosultság hozzáadása sikertelen'),
('hu', 'users', 'roles.addPermission.loadError', 'Az elérhető jogosultságok betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultság eltávolítása szerepkörből
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.removePermission.title', 'Jogosultság eltávolítása'),
('hu', 'users', 'roles.removePermission.description', 'Biztosan el szeretnéd távolítani a(z) {name} jogosultságot a szerepkörből?'),
('hu', 'users', 'roles.removePermission.confirm', 'Eltávolítás'),
('hu', 'users', 'roles.removePermission.cancel', 'Mégse'),
('hu', 'users', 'roles.removePermission.success', 'A jogosultság sikeresen eltávolítva a szerepkörből'),
('hu', 'users', 'roles.removePermission.error', 'A jogosultság eltávolítása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználó hozzáadása szerepkörhöz
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.addUser.button', 'Felhasználó hozzáadása'),
('hu', 'users', 'roles.addUser.title', 'Felhasználó hozzáadása a szerepkörhöz'),
('hu', 'users', 'roles.addUser.description', 'Válassz egy felhasználót, akit hozzá szeretnél adni ehhez a szerepkörhöz.'),
('hu', 'users', 'roles.addUser.selectLabel', 'Felhasználó'),
('hu', 'users', 'roles.addUser.selectPlaceholder', 'Válassz felhasználót...'),
('hu', 'users', 'roles.addUser.searchPlaceholder', 'Keresés...'),
('hu', 'users', 'roles.addUser.noResults', 'Nincs találat.'),
('hu', 'users', 'roles.addUser.confirm', 'Hozzáadás'),
('hu', 'users', 'roles.addUser.success', 'A felhasználó sikeresen hozzáadva a szerepkörhöz'),
('hu', 'users', 'roles.addUser.error', 'A felhasználó hozzáadása sikertelen'),
('hu', 'users', 'roles.addUser.loadError', 'Az elérhető felhasználók betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Felhasználó eltávolítása szerepkörből
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.removeUser.title', 'Felhasználó eltávolítása'),
('hu', 'users', 'roles.removeUser.description', 'Biztosan el szeretnéd távolítani ezt a felhasználót ({name} - {email}) a szerepkörből?'),
('hu', 'users', 'roles.removeUser.confirm', 'Eltávolítás'),
('hu', 'users', 'roles.removeUser.cancel', 'Mégse'),
('hu', 'users', 'roles.removeUser.success', 'A felhasználó sikeresen eltávolítva a szerepkörből'),
('hu', 'users', 'roles.removeUser.error', 'A felhasználó eltávolítása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport jogosultság részletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.detail.permissions', 'Jogosultságok')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport jogosultság műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.actions.removePermission', 'Eltávolítás a csoportból')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultság hozzáadása csoporthoz
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.addPermission.button', 'Jogosultság hozzáadása'),
('hu', 'users', 'groups.addPermission.title', 'Jogosultság hozzáadása a csoporthoz'),
('hu', 'users', 'groups.addPermission.description', 'Válassz egy jogosultságot, amit hozzá szeretnél adni ehhez a csoporthoz.'),
('hu', 'users', 'groups.addPermission.selectLabel', 'Jogosultság'),
('hu', 'users', 'groups.addPermission.selectPlaceholder', 'Válassz jogosultságot...'),
('hu', 'users', 'groups.addPermission.searchPlaceholder', 'Keresés...'),
('hu', 'users', 'groups.addPermission.noResults', 'Nincs találat.'),
('hu', 'users', 'groups.addPermission.confirm', 'Hozzáadás'),
('hu', 'users', 'groups.addPermission.success', 'A jogosultság sikeresen hozzáadva a csoporthoz'),
('hu', 'users', 'groups.addPermission.error', 'A jogosultság hozzáadása sikertelen'),
('hu', 'users', 'groups.addPermission.loadError', 'Az elérhető jogosultságok betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultság eltávolítása csoportból
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.removePermission.title', 'Jogosultság eltávolítása'),
('hu', 'users', 'groups.removePermission.description', 'Biztosan el szeretnéd távolítani a(z) {name} jogosultságot a csoportból?'),
('hu', 'users', 'groups.removePermission.confirm', 'Eltávolítás'),
('hu', 'users', 'groups.removePermission.cancel', 'Mégse'),
('hu', 'users', 'groups.removePermission.success', 'A jogosultság sikeresen eltávolítva a csoportból'),
('hu', 'users', 'groups.removePermission.error', 'A jogosultság eltávolítása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

-- Menu items
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'menu.users', 'Users'),
('en', 'users', 'menu.accessManagement', 'Access Management'),
('en', 'users', 'menu.groups', 'Groups'),
('en', 'users', 'menu.roles', 'Roles'),
('en', 'users', 'menu.permissions', 'Permissions'),
('en', 'users', 'menu.resources', 'Resources')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Permissions (requiredPermission based)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'permissions.users.users.view', 'View users'),
('en', 'users', 'permissions.users.groups.view', 'View groups'),
('en', 'users', 'permissions.users.roles.view', 'View roles'),
('en', 'users', 'permissions.users.permissions.view', 'View permissions'),
('en', 'users', 'permissions.users.resources.view', 'View resources')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Users list
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'users.list.label', 'Users'),
('en', 'users', 'users.list.description', 'List of registered users in the system')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Users column headers
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'users.columns.name', 'Full name'),
('en', 'users', 'users.columns.email', 'Email'),
('en', 'users', 'users.columns.username', 'Username'),
('en', 'users', 'users.columns.emailVerified', 'Email verified'),
('en', 'users', 'users.columns.createdAt', 'Registration date'),
('en', 'users', 'users.columns.isActive', 'Status'),
('en', 'users', 'users.columns.provider', 'Provider')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Users filters
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'users.filters.active', 'Active'),
('en', 'users', 'users.filters.inactive', 'Inactive'),
('en', 'users', 'users.filters.reset', 'Reset filters'),
('en', 'users', 'users.filters.searchPlaceholder', 'Search by name or email...')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Users provider types
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'users.providers.credential', 'Email/Password'),
('en', 'users', 'users.providers.google', 'Google'),
('en', 'users', 'users.providers.facebook', 'Facebook'),
('en', 'users', 'users.providers.github', 'GitHub')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Groups list
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.list.label', 'Groups'),
('en', 'users', 'groups.list.description', 'User groups defined in the system')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Groups column headers
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.columns.name', 'Group name'),
('en', 'users', 'groups.columns.description', 'Description'),
('en', 'users', 'groups.columns.createdAt', 'Created at')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Roles list
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.list.label', 'Roles'),
('en', 'users', 'roles.list.description', 'Roles defined in the system')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Roles column headers
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.columns.name', 'Role name'),
('en', 'users', 'roles.columns.description', 'Description'),
('en', 'users', 'roles.columns.createdAt', 'Created at')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Permissions list
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'permissions.list.label', 'Permissions'),
('en', 'users', 'permissions.list.description', 'Permissions defined in the system')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Permissions column headers
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'permissions.columns.name', 'Permission name'),
('en', 'users', 'permissions.columns.description', 'Description'),
('en', 'users', 'permissions.columns.resourceName', 'Resource'),
('en', 'users', 'permissions.columns.createdAt', 'Created at')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Resources list
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'resources.list.label', 'Resources'),
('en', 'users', 'resources.list.description', 'Protected resources defined in the system')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Resources column headers
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'resources.columns.name', 'Resource name'),
('en', 'users', 'resources.columns.description', 'Description'),
('en', 'users', 'resources.columns.createdAt', 'Created at')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Users actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'users.actions.open', 'Details')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- User detail
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'users.detail.title', 'User details'),
('en', 'users', 'users.detail.error', 'Failed to load user data'),
('en', 'users', 'users.detail.groups', 'Groups'),
('en', 'users', 'users.detail.roles', 'Roles'),
('en', 'users', 'users.detail.noGroups', 'Not assigned to any group'),
('en', 'users', 'users.detail.noRoles', 'Not assigned to any role'),
('en', 'users', 'users.detail.addGroup', 'Add'),
('en', 'users', 'users.detail.addRole', 'Add'),
('en', 'users', 'users.detail.searchGroup', 'Search...'),
('en', 'users', 'users.detail.searchRole', 'Search...'),
('en', 'users', 'users.detail.noGroupsAvailable', 'No groups available'),
('en', 'users', 'users.detail.noRolesAvailable', 'No roles available'),
('en', 'users', 'users.detail.groupAdded', 'User added to group'),
('en', 'users', 'users.detail.groupRemoved', 'User removed from group'),
('en', 'users', 'users.detail.roleAdded', 'Role assigned'),
('en', 'users', 'users.detail.roleRemoved', 'Role removed'),
('en', 'users', 'users.detail.groupAddError', 'Failed to add to group'),
('en', 'users', 'users.detail.groupRemoveError', 'Failed to remove from group'),
('en', 'users', 'users.detail.roleAddError', 'Failed to assign role'),
('en', 'users', 'users.detail.roleRemoveError', 'Failed to remove role'),
('en', 'users', 'users.detail.saveSuccess', 'Changes saved successfully'),
('en', 'users', 'users.detail.saveError', 'Failed to save changes')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- User active status and deactivation
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'users.detail.accountStatus', 'Account status'),
('en', 'users', 'users.detail.active', 'Active'),
('en', 'users', 'users.detail.inactive', 'Inactive'),
('en', 'users', 'users.detail.deactivateUser', 'Deactivate user'),
('en', 'users', 'users.detail.activateUser', 'Activate user'),
('en', 'users', 'users.detail.deactivateDescription', 'Are you sure you want to deactivate this user ({name} - {email})? Inactive users cannot log in to the system.'),
('en', 'users', 'users.detail.activateDescription', 'Are you sure you want to activate this user ({name} - {email})?'),
('en', 'users', 'users.detail.deactivateConfirm', 'Deactivate'),
('en', 'users', 'users.detail.activateConfirm', 'Activate'),
('en', 'users', 'users.detail.deactivateSuccess', 'User successfully deactivated'),
('en', 'users', 'users.detail.activateSuccess', 'User successfully activated'),
('en', 'users', 'users.detail.deactivateError', 'Failed to change user status'),
('en', 'users', 'users.detail.deleteUser', 'Delete user')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Group detail
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.detail.title', 'Group details'),
('en', 'users', 'groups.detail.name', 'Group name'),
('en', 'users', 'groups.detail.description', 'Description'),
('en', 'users', 'groups.detail.members', 'Group members'),
('en', 'users', 'groups.detail.error', 'Failed to load group data')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Group actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.actions.removeUser', 'Remove from group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Add user to group
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.addUser.button', 'Add User'),
('en', 'users', 'groups.addUser.title', 'Add User to Group'),
('en', 'users', 'groups.addUser.description', 'Select a user to add to this group.'),
('en', 'users', 'groups.addUser.selectLabel', 'User'),
('en', 'users', 'groups.addUser.selectPlaceholder', 'Select user...'),
('en', 'users', 'groups.addUser.searchPlaceholder', 'Search...'),
('en', 'users', 'groups.addUser.noResults', 'No results found.'),
('en', 'users', 'groups.addUser.confirm', 'Add'),
('en', 'users', 'groups.addUser.success', 'User successfully added to group'),
('en', 'users', 'groups.addUser.error', 'Failed to add user to group'),
('en', 'users', 'groups.addUser.loadError', 'Failed to load available users')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Remove user from group
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.removeUser.title', 'Remove User'),
('en', 'users', 'groups.removeUser.description', 'Are you sure you want to remove this user ({name} - {email}) from the group?'),
('en', 'users', 'groups.removeUser.confirm', 'Remove'),
('en', 'users', 'groups.removeUser.cancel', 'Cancel'),
('en', 'users', 'groups.removeUser.success', 'User successfully removed from group'),
('en', 'users', 'groups.removeUser.error', 'Failed to remove user from group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Common error messages
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'common.error.loadFailed', 'Failed to load data')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Role detail
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.detail.title', 'Role details'),
('en', 'users', 'roles.detail.name', 'Role name'),
('en', 'users', 'roles.detail.description', 'Description'),
('en', 'users', 'roles.detail.permissions', 'Permissions'),
('en', 'users', 'roles.detail.members', 'Members'),
('en', 'users', 'roles.detail.error', 'Failed to load role data')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Role actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.actions.removePermission', 'Remove from role'),
('en', 'users', 'roles.actions.removeUser', 'Remove from role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Add permission to role
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.addPermission.button', 'Add Permission'),
('en', 'users', 'roles.addPermission.title', 'Add Permission to Role'),
('en', 'users', 'roles.addPermission.description', 'Select a permission to add to this role.'),
('en', 'users', 'roles.addPermission.selectLabel', 'Permission'),
('en', 'users', 'roles.addPermission.selectPlaceholder', 'Select permission...'),
('en', 'users', 'roles.addPermission.searchPlaceholder', 'Search...'),
('en', 'users', 'roles.addPermission.noResults', 'No results found.'),
('en', 'users', 'roles.addPermission.confirm', 'Add'),
('en', 'users', 'roles.addPermission.success', 'Permission successfully added to role'),
('en', 'users', 'roles.addPermission.error', 'Failed to add permission to role'),
('en', 'users', 'roles.addPermission.loadError', 'Failed to load available permissions')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Remove permission from role
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.removePermission.title', 'Remove Permission'),
('en', 'users', 'roles.removePermission.description', 'Are you sure you want to remove the {name} permission from this role?'),
('en', 'users', 'roles.removePermission.confirm', 'Remove'),
('en', 'users', 'roles.removePermission.cancel', 'Cancel'),
('en', 'users', 'roles.removePermission.success', 'Permission successfully removed from role'),
('en', 'users', 'roles.removePermission.error', 'Failed to remove permission from role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Add user to role
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.addUser.button', 'Add User'),
('en', 'users', 'roles.addUser.title', 'Add User to Role'),
('en', 'users', 'roles.addUser.description', 'Select a user to add to this role.'),
('en', 'users', 'roles.addUser.selectLabel', 'User'),
('en', 'users', 'roles.addUser.selectPlaceholder', 'Select user...'),
('en', 'users', 'roles.addUser.searchPlaceholder', 'Search...'),
('en', 'users', 'roles.addUser.noResults', 'No results found.'),
('en', 'users', 'roles.addUser.confirm', 'Add'),
('en', 'users', 'roles.addUser.success', 'User successfully added to role'),
('en', 'users', 'roles.addUser.error', 'Failed to add user to role'),
('en', 'users', 'roles.addUser.loadError', 'Failed to load available users')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Remove user from role
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.removeUser.title', 'Remove User'),
('en', 'users', 'roles.removeUser.description', 'Are you sure you want to remove this user ({name} - {email}) from this role?'),
('en', 'users', 'roles.removeUser.confirm', 'Remove'),
('en', 'users', 'roles.removeUser.cancel', 'Cancel'),
('en', 'users', 'roles.removeUser.success', 'User successfully removed from role'),
('en', 'users', 'roles.removeUser.error', 'Failed to remove user from role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Group detail - permissions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.detail.permissions', 'Permissions')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Group actions - permissions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.actions.removePermission', 'Remove from group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Add permission to group
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.addPermission.button', 'Add Permission'),
('en', 'users', 'groups.addPermission.title', 'Add Permission to Group'),
('en', 'users', 'groups.addPermission.description', 'Select a permission to add to this group.'),
('en', 'users', 'groups.addPermission.selectLabel', 'Permission'),
('en', 'users', 'groups.addPermission.selectPlaceholder', 'Select permission...'),
('en', 'users', 'groups.addPermission.searchPlaceholder', 'Search...'),
('en', 'users', 'groups.addPermission.noResults', 'No results found.'),
('en', 'users', 'groups.addPermission.confirm', 'Add'),
('en', 'users', 'groups.addPermission.success', 'Permission successfully added to group'),
('en', 'users', 'groups.addPermission.error', 'Failed to add permission to group'),
('en', 'users', 'groups.addPermission.loadError', 'Failed to load available permissions')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Remove permission from group
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.removePermission.title', 'Remove Permission'),
('en', 'users', 'groups.removePermission.description', 'Are you sure you want to remove the {name} permission from this group?'),
('en', 'users', 'groups.removePermission.confirm', 'Remove'),
('en', 'users', 'groups.removePermission.cancel', 'Cancel'),
('en', 'users', 'groups.removePermission.success', 'Permission successfully removed from group'),
('en', 'users', 'groups.removePermission.error', 'Failed to remove permission from group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkör létrehozása
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.create.button', 'Új szerepkör'),
('hu', 'users', 'roles.create.title', 'Új szerepkör létrehozása'),
('hu', 'users', 'roles.create.confirm', 'Létrehozás'),
('hu', 'users', 'roles.create.success', 'A szerepkör sikeresen létrehozva'),
('hu', 'users', 'roles.create.error', 'A szerepkör létrehozása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Create role (en)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.create.button', 'New Role'),
('en', 'users', 'roles.create.title', 'Create New Role'),
('en', 'users', 'roles.create.confirm', 'Create'),
('en', 'users', 'roles.create.success', 'Role created successfully'),
('en', 'users', 'roles.create.error', 'Failed to create role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport létrehozása
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.create.button', 'Új csoport'),
('hu', 'users', 'groups.create.title', 'Új csoport létrehozása'),
('hu', 'users', 'groups.create.confirm', 'Létrehozás'),
('hu', 'users', 'groups.create.success', 'A csoport sikeresen létrehozva'),
('hu', 'users', 'groups.create.error', 'A csoport létrehozása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Create group (en)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.create.button', 'New Group'),
('en', 'users', 'groups.create.title', 'Create New Group'),
('en', 'users', 'groups.create.confirm', 'Create'),
('en', 'users', 'groups.create.success', 'Group created successfully'),
('en', 'users', 'groups.create.error', 'Failed to create group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkör szerkesztése
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.edit.saveSuccess', 'A szerepkör sikeresen módosítva'),
('hu', 'users', 'roles.edit.saveError', 'A szerepkör módosítása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Edit role (en)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.edit.saveSuccess', 'Role updated successfully'),
('en', 'users', 'roles.edit.saveError', 'Failed to update role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport szerkesztése
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.edit.saveSuccess', 'A csoport sikeresen módosítva'),
('hu', 'users', 'groups.edit.saveError', 'A csoport módosítása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Edit group (en)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.edit.saveSuccess', 'Group updated successfully'),
('en', 'users', 'groups.edit.saveError', 'Failed to update group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkör törlése (hu)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.delete.button', 'Törlés'),
('hu', 'users', 'roles.delete.title', 'Szerepkör törlése'),
('hu', 'users', 'roles.delete.description', 'Biztosan törölni szeretnéd a(z) {name} szerepkört? Ez a művelet nem vonható vissza, és az összes kapcsolódó felhasználó-hozzárendelés és jogosultság is törlődik.'),
('hu', 'users', 'roles.delete.confirm', 'Törlés'),
('hu', 'users', 'roles.delete.success', 'A szerepkör sikeresen törölve'),
('hu', 'users', 'roles.delete.error', 'A szerepkör törlése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Delete role (en)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.delete.button', 'Delete'),
('en', 'users', 'roles.delete.title', 'Delete Role'),
('en', 'users', 'roles.delete.description', 'Are you sure you want to delete the {name} role? This action cannot be undone, and all related user assignments and permissions will also be removed.'),
('en', 'users', 'roles.delete.confirm', 'Delete'),
('en', 'users', 'roles.delete.success', 'Role deleted successfully'),
('en', 'users', 'roles.delete.error', 'Failed to delete role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport törlése (hu)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.delete.button', 'Törlés'),
('hu', 'users', 'groups.delete.title', 'Csoport törlése'),
('hu', 'users', 'groups.delete.description', 'Biztosan törölni szeretnéd a(z) {name} csoportot? Ez a művelet nem vonható vissza, és az összes kapcsolódó felhasználó-hozzárendelés és jogosultság is törlődik.'),
('hu', 'users', 'groups.delete.confirm', 'Törlés'),
('hu', 'users', 'groups.delete.success', 'A csoport sikeresen törölve'),
('hu', 'users', 'groups.delete.error', 'A csoport törlése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Delete group (en)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.delete.button', 'Delete'),
('en', 'users', 'groups.delete.title', 'Delete Group'),
('en', 'users', 'groups.delete.description', 'Are you sure you want to delete the {name} group? This action cannot be undone, and all related user assignments and permissions will also be removed.'),
('en', 'users', 'groups.delete.confirm', 'Delete'),
('en', 'users', 'groups.delete.success', 'Group deleted successfully'),
('en', 'users', 'groups.delete.error', 'Failed to delete group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Jogosultság és erőforrás részletek (PermissionDetail, ResourceDetail)
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'permissions.detail.title', 'Jogosultság részletei'),
('hu', 'users', 'resources.detail.title', 'Erőforrás részletei')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'permissions.detail.title', 'Permission details'),
('en', 'users', 'resources.detail.title', 'Resource details')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Seed: translations_user_apps — Users app translations for app assignments (groups, roles)
-- =============================================================================
-- USER NAMESPACE - App hozzárendelés fordítások
-- =============================================================================
-- Ez a fájl tartalmazza az app hozzárendeléshez szükséges fordításokat
-- csoportokhoz és szerepkörökhöz
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

-- App oszlopfejlécek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'apps.columns.name', 'App neve'),
('hu', 'users', 'apps.columns.description', 'Leírás'),
('hu', 'users', 'apps.columns.category', 'Kategória')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- App műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'apps.actions.open', 'Megnyitás')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- App megnyitás hibák
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.openApp.error', 'Az alkalmazás megnyitása sikertelen'),
('hu', 'users', 'roles.openApp.error', 'Az alkalmazás megnyitása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport app részletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.detail.apps', 'Alkalmazások')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport app műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.actions.removeApp', 'Eltávolítás a csoportból')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- App hozzáadása csoporthoz
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.addApp.button', 'Alkalmazás hozzáadása'),
('hu', 'users', 'groups.addApp.title', 'Alkalmazás hozzáadása a csoporthoz'),
('hu', 'users', 'groups.addApp.description', 'Válassz egy alkalmazást, amit hozzá szeretnél adni ehhez a csoporthoz.'),
('hu', 'users', 'groups.addApp.selectLabel', 'Alkalmazás'),
('hu', 'users', 'groups.addApp.selectPlaceholder', 'Válassz alkalmazást...'),
('hu', 'users', 'groups.addApp.searchPlaceholder', 'Keresés...'),
('hu', 'users', 'groups.addApp.noResults', 'Nincs találat.'),
('hu', 'users', 'groups.addApp.confirm', 'Hozzáadás'),
('hu', 'users', 'groups.addApp.success', 'Az alkalmazás sikeresen hozzáadva a csoporthoz'),
('hu', 'users', 'groups.addApp.error', 'Az alkalmazás hozzáadása sikertelen'),
('hu', 'users', 'groups.addApp.loadError', 'Az elérhető alkalmazások betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- App eltávolítása csoportból
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.removeApp.title', 'Alkalmazás eltávolítása'),
('hu', 'users', 'groups.removeApp.description', 'Biztosan el szeretnéd távolítani a(z) {name} alkalmazást a csoportból?'),
('hu', 'users', 'groups.removeApp.confirm', 'Eltávolítás'),
('hu', 'users', 'groups.removeApp.cancel', 'Mégse'),
('hu', 'users', 'groups.removeApp.success', 'Az alkalmazás sikeresen eltávolítva a csoportból'),
('hu', 'users', 'groups.removeApp.error', 'Az alkalmazás eltávolítása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkör app részletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.detail.apps', 'Alkalmazások')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkör app műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.actions.removeApp', 'Eltávolítás a szerepkörből')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- App hozzáadása szerepkörhöz
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.addApp.button', 'Alkalmazás hozzáadása'),
('hu', 'users', 'roles.addApp.title', 'Alkalmazás hozzáadása a szerepkörhöz'),
('hu', 'users', 'roles.addApp.description', 'Válassz egy alkalmazást, amit hozzá szeretnél adni ehhez a szerepkörhöz.'),
('hu', 'users', 'roles.addApp.selectLabel', 'Alkalmazás'),
('hu', 'users', 'roles.addApp.selectPlaceholder', 'Válassz alkalmazást...'),
('hu', 'users', 'roles.addApp.searchPlaceholder', 'Keresés...'),
('hu', 'users', 'roles.addApp.noResults', 'Nincs találat.'),
('hu', 'users', 'roles.addApp.confirm', 'Hozzáadás'),
('hu', 'users', 'roles.addApp.success', 'Az alkalmazás sikeresen hozzáadva a szerepkörhöz'),
('hu', 'users', 'roles.addApp.error', 'Az alkalmazás hozzáadása sikertelen'),
('hu', 'users', 'roles.addApp.loadError', 'Az elérhető alkalmazások betöltése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- App eltávolítása szerepkörből
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'roles.removeApp.title', 'Alkalmazás eltávolítása'),
('hu', 'users', 'roles.removeApp.description', 'Biztosan el szeretnéd távolítani a(z) {name} alkalmazást a szerepkörből?'),
('hu', 'users', 'roles.removeApp.confirm', 'Eltávolítás'),
('hu', 'users', 'roles.removeApp.cancel', 'Mégse'),
('hu', 'users', 'roles.removeApp.success', 'Az alkalmazás sikeresen eltávolítva a szerepkörből'),
('hu', 'users', 'roles.removeApp.error', 'Az alkalmazás eltávolítása sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Csoport és szerepkör törlés
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.delete.button', 'Csoport törlése'),
('hu', 'users', 'groups.delete.title', 'Csoport törlése'),
('hu', 'users', 'groups.delete.description', 'Biztosan törölni szeretnéd a(z) {name} csoportot? Ez a művelet nem vonható vissza.'),
('hu', 'users', 'groups.delete.confirm', 'Törlés'),
('hu', 'users', 'groups.delete.success', 'A csoport sikeresen törölve'),
('hu', 'users', 'groups.delete.error', 'A csoport törlése sikertelen'),
('hu', 'users', 'roles.delete.button', 'Szerepkör törlése'),
('hu', 'users', 'roles.delete.title', 'Szerepkör törlése'),
('hu', 'users', 'roles.delete.description', 'Biztosan törölni szeretnéd a(z) {name} szerepkört? Ez a művelet nem vonható vissza.'),
('hu', 'users', 'roles.delete.confirm', 'Törlés'),
('hu', 'users', 'roles.delete.success', 'A szerepkör sikeresen törölve'),
('hu', 'users', 'roles.delete.error', 'A szerepkör törlése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerkesztés
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'users', 'groups.edit.saveSuccess', 'A változtatások sikeresen mentve'),
('hu', 'users', 'groups.edit.saveError', 'A változtatások mentése sikertelen'),
('hu', 'users', 'roles.edit.saveSuccess', 'A változtatások sikeresen mentve'),
('hu', 'users', 'roles.edit.saveError', 'A változtatások mentése sikertelen')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

-- App column headers
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'apps.columns.name', 'App name'),
('en', 'users', 'apps.columns.description', 'Description'),
('en', 'users', 'apps.columns.category', 'Category')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- App actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'apps.actions.open', 'Open')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- App open errors
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.openApp.error', 'Failed to open application'),
('en', 'users', 'roles.openApp.error', 'Failed to open application')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Group app details
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.detail.apps', 'Applications')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Group app actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.actions.removeApp', 'Remove from group')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Add app to group
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.addApp.button', 'Add Application'),
('en', 'users', 'groups.addApp.title', 'Add Application to Group'),
('en', 'users', 'groups.addApp.description', 'Select an application to add to this group.'),
('en', 'users', 'groups.addApp.selectLabel', 'Application'),
('en', 'users', 'groups.addApp.selectPlaceholder', 'Select application...'),
('en', 'users', 'groups.addApp.searchPlaceholder', 'Search...'),
('en', 'users', 'groups.addApp.noResults', 'No results found.'),
('en', 'users', 'groups.addApp.confirm', 'Add'),
('en', 'users', 'groups.addApp.success', 'Application successfully added to group'),
('en', 'users', 'groups.addApp.error', 'Failed to add application'),
('en', 'users', 'groups.addApp.loadError', 'Failed to load available applications')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Remove app from group
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.removeApp.title', 'Remove Application'),
('en', 'users', 'groups.removeApp.description', 'Are you sure you want to remove the {name} application from this group?'),
('en', 'users', 'groups.removeApp.confirm', 'Remove'),
('en', 'users', 'groups.removeApp.cancel', 'Cancel'),
('en', 'users', 'groups.removeApp.success', 'Application successfully removed from group'),
('en', 'users', 'groups.removeApp.error', 'Failed to remove application')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Role app details
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.detail.apps', 'Applications')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Role app actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.actions.removeApp', 'Remove from role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Add app to role
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.addApp.button', 'Add Application'),
('en', 'users', 'roles.addApp.title', 'Add Application to Role'),
('en', 'users', 'roles.addApp.description', 'Select an application to add to this role.'),
('en', 'users', 'roles.addApp.selectLabel', 'Application'),
('en', 'users', 'roles.addApp.selectPlaceholder', 'Select application...'),
('en', 'users', 'roles.addApp.searchPlaceholder', 'Search...'),
('en', 'users', 'roles.addApp.noResults', 'No results found.'),
('en', 'users', 'roles.addApp.confirm', 'Add'),
('en', 'users', 'roles.addApp.success', 'Application successfully added to role'),
('en', 'users', 'roles.addApp.error', 'Failed to add application'),
('en', 'users', 'roles.addApp.loadError', 'Failed to load available applications')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Remove app from role
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'roles.removeApp.title', 'Remove Application'),
('en', 'users', 'roles.removeApp.description', 'Are you sure you want to remove the {name} application from this role?'),
('en', 'users', 'roles.removeApp.confirm', 'Remove'),
('en', 'users', 'roles.removeApp.cancel', 'Cancel'),
('en', 'users', 'roles.removeApp.success', 'Application successfully removed from role'),
('en', 'users', 'roles.removeApp.error', 'Failed to remove application')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Group and role deletion
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.delete.button', 'Delete Group'),
('en', 'users', 'groups.delete.title', 'Delete Group'),
('en', 'users', 'groups.delete.description', 'Are you sure you want to delete the {name} group? This action cannot be undone.'),
('en', 'users', 'groups.delete.confirm', 'Delete'),
('en', 'users', 'groups.delete.success', 'Group successfully deleted'),
('en', 'users', 'groups.delete.error', 'Failed to delete group'),
('en', 'users', 'roles.delete.button', 'Delete Role'),
('en', 'users', 'roles.delete.title', 'Delete Role'),
('en', 'users', 'roles.delete.description', 'Are you sure you want to delete the {name} role? This action cannot be undone.'),
('en', 'users', 'roles.delete.confirm', 'Delete'),
('en', 'users', 'roles.delete.success', 'Role successfully deleted'),
('en', 'users', 'roles.delete.error', 'Failed to delete role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Edit
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'users', 'groups.edit.saveSuccess', 'Changes saved successfully'),
('en', 'users', 'groups.edit.saveError', 'Failed to save changes'),
('en', 'users', 'roles.edit.saveSuccess', 'Changes saved successfully'),
('en', 'users', 'roles.edit.saveError', 'Failed to save changes')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Seed: translations_notifications — Notification system translations (NotificationCenter component)
-- =============================================================================
-- NOTIFICATIONS NAMESPACE - Értesítési rendszer fordításai
-- =============================================================================
-- Ez a namespace tartalmazza az értesítési rendszer szövegeit:
-- NotificationCenter komponens, értesítési műveletek
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

-- Értesítési központ
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'notifications', 'title', 'Értesítések'),
('hu', 'notifications', 'empty', 'Nincsenek értesítések')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Értesítési műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'notifications', 'actions.refresh', 'Frissítés'),
('hu', 'notifications', 'actions.markAllRead', 'Összes olvasva'),
('hu', 'notifications', 'actions.markRead', 'Olvasottá tétel'),
('hu', 'notifications', 'actions.deleteAll', 'Összes törlése'),
('hu', 'notifications', 'actions.delete', 'Törlés'),
('hu', 'notifications', 'actions.close', 'Bezárás'),
('hu', 'notifications', 'actions.viewDetails', 'Részletek')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Értesítési lista
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'notifications', 'list.title', 'Értesítések'),
('hu', 'notifications', 'list.description', 'Az összes értesítésed egy helyen'),
('hu', 'notifications', 'list.columns.type', 'Típus'),
('hu', 'notifications', 'list.columns.title', 'Cím'),
('hu', 'notifications', 'list.columns.message', 'Üzenet'),
('hu', 'notifications', 'list.columns.app', 'Alkalmazás'),
('hu', 'notifications', 'list.columns.createdAt', 'Létrehozva'),
('hu', 'notifications', 'list.actions.open', 'Megnyitás'),
('hu', 'notifications', 'list.actions.markAsRead', 'Olvasottá tétel'),
('hu', 'notifications', 'list.actions.delete', 'Törlés'),
('hu', 'notifications', 'list.deleteSuccess', 'Értesítés sikeresen törölve'),
('hu', 'notifications', 'list.deleteError', 'Hiba történt az értesítés törlésekor'),
('hu', 'notifications', 'list.markReadSuccess', 'Értesítés olvasottá téve'),
('hu', 'notifications', 'list.markReadError', 'Hiba történt az értesítés olvasottá tételekor')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Értesítés részletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'notifications', 'detail.title', 'Értesítés részletei'),
('hu', 'notifications', 'detail.notificationTitle', 'Cím'),
('hu', 'notifications', 'detail.message', 'Üzenet'),
('hu', 'notifications', 'detail.details', 'Részletek'),
('hu', 'notifications', 'detail.type', 'Típus'),
('hu', 'notifications', 'detail.app', 'Alkalmazás'),
('hu', 'notifications', 'detail.status', 'Állapot'),
('hu', 'notifications', 'detail.read', 'Olvasott'),
('hu', 'notifications', 'detail.unread', 'Olvasatlan'),
('hu', 'notifications', 'detail.createdAt', 'Létrehozva'),
('hu', 'notifications', 'detail.readAt', 'Olvasva'),
('hu', 'notifications', 'detail.markAsRead', 'Olvasottá tétel'),
('hu', 'notifications', 'detail.openApp', 'Alkalmazás megnyitása'),
('hu', 'notifications', 'detail.delete', 'Törlés'),
('hu', 'notifications', 'detail.deleteTitle', 'Értesítés törlése'),
('hu', 'notifications', 'detail.deleteDescription', 'Biztosan törölni szeretnéd ezt az értesítést: {title}?'),
('hu', 'notifications', 'detail.deleteConfirm', 'Törlés'),
('hu', 'notifications', 'detail.deleteSuccess', 'Értesítés sikeresen törölve'),
('hu', 'notifications', 'detail.deleteError', 'Hiba történt az értesítés törlésekor'),
('hu', 'notifications', 'detail.markReadSuccess', 'Értesítés olvasottá téve'),
('hu', 'notifications', 'detail.markReadError', 'Hiba történt az értesítés olvasottá tételekor'),
('hu', 'notifications', 'detail.appOpened', 'Alkalmazás megnyitva'),
('hu', 'notifications', 'detail.appOpenError', 'Hiba történt az alkalmazás megnyitásakor'),
('hu', 'notifications', 'detail.notFound', 'Értesítés nem található'),
('hu', 'notifications', 'detail.error', 'Hiba történt az értesítés betöltésekor')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

-- Értesítési központ
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'notifications', 'title', 'Notifications'),
('en', 'notifications', 'empty', 'No notifications')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Értesítési műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'notifications', 'actions.refresh', 'Refresh'),
('en', 'notifications', 'actions.markAllRead', 'Mark all as read'),
('en', 'notifications', 'actions.markRead', 'Mark as read'),
('en', 'notifications', 'actions.deleteAll', 'Delete all'),
('en', 'notifications', 'actions.delete', 'Delete'),
('en', 'notifications', 'actions.close', 'Close'),
('en', 'notifications', 'actions.viewDetails', 'View details')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Értesítési lista
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'notifications', 'list.title', 'Notifications'),
('en', 'notifications', 'list.description', 'All your notifications in one place'),
('en', 'notifications', 'list.columns.type', 'Type'),
('en', 'notifications', 'list.columns.title', 'Title'),
('en', 'notifications', 'list.columns.message', 'Message'),
('en', 'notifications', 'list.columns.app', 'Application'),
('en', 'notifications', 'list.columns.createdAt', 'Created'),
('en', 'notifications', 'list.actions.open', 'Open'),
('en', 'notifications', 'list.actions.markAsRead', 'Mark as read'),
('en', 'notifications', 'list.actions.delete', 'Delete'),
('en', 'notifications', 'list.deleteSuccess', 'Notification deleted successfully'),
('en', 'notifications', 'list.deleteError', 'Failed to delete notification'),
('en', 'notifications', 'list.markReadSuccess', 'Notification marked as read'),
('en', 'notifications', 'list.markReadError', 'Failed to mark notification as read')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Notification details
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'notifications', 'detail.title', 'Notification Details'),
('en', 'notifications', 'detail.notificationTitle', 'Title'),
('en', 'notifications', 'detail.message', 'Message'),
('en', 'notifications', 'detail.details', 'Details'),
('en', 'notifications', 'detail.type', 'Type'),
('en', 'notifications', 'detail.app', 'Application'),
('en', 'notifications', 'detail.status', 'Status'),
('en', 'notifications', 'detail.read', 'Read'),
('en', 'notifications', 'detail.unread', 'Unread'),
('en', 'notifications', 'detail.createdAt', 'Created'),
('en', 'notifications', 'detail.readAt', 'Read at'),
('en', 'notifications', 'detail.markAsRead', 'Mark as read'),
('en', 'notifications', 'detail.openApp', 'Open application'),
('en', 'notifications', 'detail.delete', 'Delete'),
('en', 'notifications', 'detail.deleteTitle', 'Delete notification'),
('en', 'notifications', 'detail.deleteDescription', 'Are you sure you want to delete this notification: {title}?'),
('en', 'notifications', 'detail.deleteConfirm', 'Delete'),
('en', 'notifications', 'detail.deleteSuccess', 'Notification deleted successfully'),
('en', 'notifications', 'detail.deleteError', 'Failed to delete notification'),
('en', 'notifications', 'detail.markReadSuccess', 'Notification marked as read'),
('en', 'notifications', 'detail.markReadError', 'Failed to mark notification as read'),
('en', 'notifications', 'detail.appOpened', 'Application opened'),
('en', 'notifications', 'detail.appOpenError', 'Failed to open application'),
('en', 'notifications', 'detail.notFound', 'Notification not found'),
('en', 'notifications', 'detail.error', 'Failed to load notification')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Seed: translations_plugin_manager — Plugin Manager app translations
-- Plugin Manager app translations
-- Namespace: plugin-manager

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
    -- Menu
    ('hu', 'plugin-manager', 'menu.store', 'Elérhető alkalmazások'),
    ('en', 'plugin-manager', 'menu.store', 'Available Apps'),
    ('hu', 'plugin-manager', 'menu.installed', 'Telepített alkalmazások'),
    ('en', 'plugin-manager', 'menu.installed', 'Installed Apps'),
    ('hu', 'plugin-manager', 'menu.manualInstall', 'Manuális telepítés'),
    ('en', 'plugin-manager', 'menu.manualInstall', 'Manual Install'),

    -- Upload page
    ('hu', 'plugin-manager', 'upload.title', 'Alkalmazás feltöltése'),
    ('en', 'plugin-manager', 'upload.title', 'Upload App'),
    ('hu', 'plugin-manager', 'upload.description', 'Telepítsen új alkalmazást a rendszerbe'),
    ('en', 'plugin-manager', 'upload.description', 'Install a new app to the system'),
    ('hu', 'plugin-manager', 'upload.dragDropLabel', 'Húzza ide az alkalmazás fájlt vagy kattintson a tallózáshoz'),
    ('en', 'plugin-manager', 'upload.dragDropLabel', 'Drag and drop app file or click to browse'),
    ('hu', 'plugin-manager', 'upload.dragDropText', 'Húzza ide az alkalmazás fájlt'),
    ('en', 'plugin-manager', 'upload.dragDropText', 'Drag & drop your app file here'),
    ('hu', 'plugin-manager', 'upload.orBrowse', 'vagy kattintson az alábbi gombra'),
    ('en', 'plugin-manager', 'upload.orBrowse', 'or click the button below to browse'),
    ('hu', 'plugin-manager', 'upload.browseFiles', 'Fájl tallózása'),
    ('en', 'plugin-manager', 'upload.browseFiles', 'Browse Files'),
    ('hu', 'plugin-manager', 'upload.uploadButton', 'Alkalmazás feltöltése'),
    ('en', 'plugin-manager', 'upload.uploadButton', 'Upload App'),
    ('hu', 'plugin-manager', 'upload.validating', 'Alkalmazás validálása folyamatban...'),
    ('en', 'plugin-manager', 'upload.validating', 'Validating app...'),
    ('hu', 'plugin-manager', 'upload.uploading', 'Alkalmazás feltöltése folyamatban...'),
    ('en', 'plugin-manager', 'upload.uploading', 'Uploading app...'),
    ('hu', 'plugin-manager', 'upload.success', '"{pluginId}" alkalmazás sikeresen telepítve!'),
    ('en', 'plugin-manager', 'upload.success', 'App "{pluginId}" installed successfully!'),

    -- Upload errors
    ('hu', 'plugin-manager', 'upload.errors.invalidExtension', 'Csak {extension} fájlok engedélyezettek'),
    ('en', 'plugin-manager', 'upload.errors.invalidExtension', 'Only {extension} files are allowed'),
    ('hu', 'plugin-manager', 'upload.errors.fileTooLarge', 'A fájl mérete meghaladja a {maxSize} MB limitet ({actualSize} MB)'),
    ('en', 'plugin-manager', 'upload.errors.fileTooLarge', 'File size exceeds {maxSize} MB limit ({actualSize} MB)'),
    ('hu', 'plugin-manager', 'upload.errors.uploadFailed', 'Feltöltés sikertelen'),
    ('en', 'plugin-manager', 'upload.errors.uploadFailed', 'Upload failed'),
    ('hu', 'plugin-manager', 'upload.errors.networkError', 'Hálózati hiba. Ellenőrizze a kapcsolatot és próbálja újra.'),
    ('en', 'plugin-manager', 'upload.errors.networkError', 'Network error. Please check your connection and try again.'),
    ('hu', 'plugin-manager', 'upload.errors.duplicatePlugin', 'A(z) "{pluginId}" azonosítójú alkalmazás már telepítve van'),
    ('en', 'plugin-manager', 'upload.errors.duplicatePlugin', 'App with ID "{pluginId}" is already installed'),

    -- List page
    ('hu', 'plugin-manager', 'list.title', 'Telepített alkalmazások'),
    ('en', 'plugin-manager', 'list.title', 'Installed Apps'),
    ('hu', 'plugin-manager', 'list.description', 'A rendszerbe telepített alkalmazások listája'),
    ('en', 'plugin-manager', 'list.description', 'List of apps installed in the system'),

    -- List columns
    ('hu', 'plugin-manager', 'list.columns.name', 'Név'),
    ('en', 'plugin-manager', 'list.columns.name', 'Name'),
    ('hu', 'plugin-manager', 'list.columns.version', 'Verzió'),
    ('en', 'plugin-manager', 'list.columns.version', 'Version'),
    ('hu', 'plugin-manager', 'list.columns.author', 'Szerző'),
    ('en', 'plugin-manager', 'list.columns.author', 'Author'),
    ('hu', 'plugin-manager', 'list.columns.status', 'Állapot'),
    ('en', 'plugin-manager', 'list.columns.status', 'Status'),
    ('hu', 'plugin-manager', 'list.columns.installedAt', 'Telepítve'),
    ('en', 'plugin-manager', 'list.columns.installedAt', 'Installed At'),

    -- List status
    ('hu', 'plugin-manager', 'list.status.active', 'Aktív'),
    ('en', 'plugin-manager', 'list.status.active', 'Active'),
    ('hu', 'plugin-manager', 'list.status.inactive', 'Inaktív'),
    ('en', 'plugin-manager', 'list.status.inactive', 'Inactive'),

    -- List filters
    ('hu', 'plugin-manager', 'list.filters.searchPlaceholder', 'Keresés...'),
    ('en', 'plugin-manager', 'list.filters.searchPlaceholder', 'Search...'),
    ('hu', 'plugin-manager', 'list.filters.reset', 'Szűrők törlése'),
    ('en', 'plugin-manager', 'list.filters.reset', 'Reset filters'),

    -- List actions
    ('hu', 'plugin-manager', 'list.actions.viewDetails', 'Részletek'),
    ('en', 'plugin-manager', 'list.actions.viewDetails', 'View Details'),

    -- Detail page
    ('hu', 'plugin-manager', 'detail.title', 'Alkalmazás részletei'),
    ('en', 'plugin-manager', 'detail.title', 'App Details'),
    ('hu', 'plugin-manager', 'detail.error', 'Hiba történt az alkalmazás betöltése során'),
    ('en', 'plugin-manager', 'detail.error', 'Error loading app'),
    ('hu', 'plugin-manager', 'detail.status', 'Állapot'),
    ('en', 'plugin-manager', 'detail.status', 'Status'),
    ('hu', 'plugin-manager', 'detail.appId', 'Plugin azonosító'),
    ('en', 'plugin-manager', 'detail.appId', 'Plugin ID'),
    ('hu', 'plugin-manager', 'detail.version', 'Verzió'),
    ('en', 'plugin-manager', 'detail.version', 'Version'),
    ('hu', 'plugin-manager', 'detail.author', 'Szerző'),
    ('en', 'plugin-manager', 'detail.author', 'Author'),
    ('hu', 'plugin-manager', 'detail.description', 'Leírás'),
    ('en', 'plugin-manager', 'detail.description', 'Description'),
    ('hu', 'plugin-manager', 'detail.category', 'Kategória'),
    ('en', 'plugin-manager', 'detail.category', 'Category'),
    ('hu', 'plugin-manager', 'detail.minVersion', 'Minimum ElyOS verzió'),
    ('en', 'plugin-manager', 'detail.minVersion', 'Minimum ElyOS Version'),
    ('hu', 'plugin-manager', 'detail.installedAt', 'Telepítve'),
    ('en', 'plugin-manager', 'detail.installedAt', 'Installed At'),
    ('hu', 'plugin-manager', 'detail.updatedAt', 'Frissítve'),
    ('en', 'plugin-manager', 'detail.updatedAt', 'Updated At'),
    ('hu', 'plugin-manager', 'detail.permissions', 'Engedélyek'),
    ('en', 'plugin-manager', 'detail.permissions', 'Permissions'),
    ('hu', 'plugin-manager', 'detail.dependencies', 'Függőségek'),
    ('en', 'plugin-manager', 'detail.dependencies', 'Dependencies'),
    ('hu', 'plugin-manager', 'detail.basicInfo', 'Alapvető információk'),
    ('en', 'plugin-manager', 'detail.basicInfo', 'Basic Information'),
    ('hu', 'plugin-manager', 'detail.details', 'Részletek'),
    ('en', 'plugin-manager', 'detail.details', 'Details'),
    ('hu', 'plugin-manager', 'detail.permissionsDescription', 'Az alkalmazás által használt engedélyek'),
    ('en', 'plugin-manager', 'detail.permissionsDescription', 'Permissions used by the app'),
    ('hu', 'plugin-manager', 'detail.systemInfo', 'Rendszer információk'),
    ('en', 'plugin-manager', 'detail.systemInfo', 'System Information'),

    -- Detail actions
    ('hu', 'plugin-manager', 'detail.uninstall', 'Alkalmazás eltávolítása'),
    ('en', 'plugin-manager', 'detail.uninstall', 'Uninstall App'),
    ('hu', 'plugin-manager', 'detail.uninstallTitle', 'Alkalmazás eltávolítása'),
    ('en', 'plugin-manager', 'detail.uninstallTitle', 'Uninstall App'),
    ('hu', 'plugin-manager', 'detail.uninstallDescription', 'Biztosan el szeretné távolítani a(z) "{name}" alkalmazást? Ez a művelet nem vonható vissza.'),
    ('en', 'plugin-manager', 'detail.uninstallDescription', 'Are you sure you want to uninstall the "{name}" app? This action cannot be undone.'),
    ('hu', 'plugin-manager', 'detail.uninstallConfirm', 'Eltávolítás'),
    ('en', 'plugin-manager', 'detail.uninstallConfirm', 'Uninstall'),
    ('hu', 'plugin-manager', 'detail.uninstallSuccess', 'Alkalmazás sikeresen eltávolítva'),
    ('en', 'plugin-manager', 'detail.uninstallSuccess', 'App uninstalled successfully'),
    ('hu', 'plugin-manager', 'detail.uninstallError', 'Hiba történt az alkalmazás eltávolítása során'),
    ('en', 'plugin-manager', 'detail.uninstallError', 'Error uninstalling app'),

    -- Preview page
    ('hu', 'plugin-manager', 'preview.title', 'Alkalmazás előnézet'),
    ('en', 'plugin-manager', 'preview.title', 'App Preview'),
    ('hu', 'plugin-manager', 'preview.version', 'Verzió'),
    ('en', 'plugin-manager', 'preview.version', 'Version'),
    ('hu', 'plugin-manager', 'preview.description', 'Leírás'),
    ('en', 'plugin-manager', 'preview.description', 'Description'),
    ('hu', 'plugin-manager', 'preview.author', 'Szerző'),
    ('en', 'plugin-manager', 'preview.author', 'Author'),
    ('hu', 'plugin-manager', 'preview.pluginId', 'Plugin azonosító'),
    ('en', 'plugin-manager', 'preview.pluginId', 'Plugin ID'),
    ('hu', 'plugin-manager', 'preview.permissions', 'Engedélyek'),
    ('en', 'plugin-manager', 'preview.permissions', 'Permissions'),
    ('hu', 'plugin-manager', 'preview.permissionsDescription', 'Ez az alkalmazás a következő engedélyeket igényli'),
    ('en', 'plugin-manager', 'preview.permissionsDescription', 'This app requires the following permissions'),
    ('hu', 'plugin-manager', 'preview.permissionsInfo', 'Az engedélyek megadása után az alkalmazás hozzáférhet ezekhez a funkciókhoz'),
    ('en', 'plugin-manager', 'preview.permissionsInfo', 'After granting permissions, the app will have access to these features'),
    ('hu', 'plugin-manager', 'preview.dependencies', 'Függőségek'),
    ('en', 'plugin-manager', 'preview.dependencies', 'Dependencies'),
    ('hu', 'plugin-manager', 'preview.dependenciesDescription', 'Az alkalmazás működéséhez szükséges külső csomagok'),
    ('en', 'plugin-manager', 'preview.dependenciesDescription', 'External packages required for the app to function'),
    ('hu', 'plugin-manager', 'preview.additionalInfo', 'További információk'),
    ('en', 'plugin-manager', 'preview.additionalInfo', 'Additional Information'),
    ('hu', 'plugin-manager', 'preview.minVersion', 'Minimum ElyOS verzió'),
    ('en', 'plugin-manager', 'preview.minVersion', 'Minimum ElyOS Version'),
    ('hu', 'plugin-manager', 'preview.locales', 'Támogatott nyelvek'),
    ('en', 'plugin-manager', 'preview.locales', 'Supported Languages'),
    ('hu', 'plugin-manager', 'preview.entryPoint', 'Belépési pont'),
    ('en', 'plugin-manager', 'preview.entryPoint', 'Entry Point'),
    ('hu', 'plugin-manager', 'preview.warnings', 'Figyelmeztetések'),
    ('en', 'plugin-manager', 'preview.warnings', 'Warnings'),
    ('hu', 'plugin-manager', 'preview.install', 'Telepítés'),
    ('en', 'plugin-manager', 'preview.install', 'Install'),
    ('hu', 'plugin-manager', 'preview.installing', 'Telepítés...'),
    ('en', 'plugin-manager', 'preview.installing', 'Installing...'),
    ('hu', 'plugin-manager', 'preview.installSuccess', 'Alkalmazás sikeresen telepítve'),
    ('en', 'plugin-manager', 'preview.installSuccess', 'App installed successfully'),
    ('hu', 'plugin-manager', 'preview.installError', 'Hiba történt az alkalmazás telepítése során'),
    ('en', 'plugin-manager', 'preview.installError', 'Error installing app'),

    -- Store page
    ('hu', 'plugin-manager', 'store.title', 'Elérhető alkalmazások'),
    ('en', 'plugin-manager', 'store.title', 'Available Apps'),
    ('hu', 'plugin-manager', 'store.description', 'Böngésszen és telepítsen új alkalmazásokat'),
    ('en', 'plugin-manager', 'store.description', 'Browse and install new apps'),
    ('hu', 'plugin-manager', 'store.comingSoon', 'Hamarosan elérhető'),
    ('en', 'plugin-manager', 'store.comingSoon', 'Coming Soon'),
    ('hu', 'plugin-manager', 'store.comingSoonDescription', 'Hamarosan itt lesznek az elérhető külső alkalmazások. Addig is használhatja a manuális telepítés funkciót.'),
    ('en', 'plugin-manager', 'store.comingSoonDescription', 'Available external apps will be here soon. In the meantime, you can use the manual installation feature.'),
    ('hu', 'plugin-manager', 'store.features.browse', 'Alkalmazások böngészése'),
    ('en', 'plugin-manager', 'store.features.browse', 'Browse apps'),
    ('hu', 'plugin-manager', 'store.features.install', 'Egyszerű telepítés'),
    ('en', 'plugin-manager', 'store.features.install', 'Easy installation'),

    -- Dev Plugins menu item
    ('hu', 'plugin-manager', 'menu.devPlugins', 'Fejlesztői pluginok'),
    ('en', 'plugin-manager', 'menu.devPlugins', 'Dev Plugins'),

    -- Dev Plugins page
    ('hu', 'plugin-manager', 'devPlugins.title', 'Fejlesztői plugin betöltő'),
    ('en', 'plugin-manager', 'devPlugins.title', 'Dev Plugin Loader'),
    ('hu', 'plugin-manager', 'devPlugins.description', 'Tölts be és tesztelj pluginokat a helyi fejlesztői szerverről'),
    ('en', 'plugin-manager', 'devPlugins.description', 'Load and test plugins from your local dev server'),
    ('hu', 'plugin-manager', 'devPlugins.loaded', 'Betöltött fejlesztői pluginok'),
    ('en', 'plugin-manager', 'devPlugins.loaded', 'Loaded Dev Plugins'),

    -- Validation errors
    ('hu', 'plugin-manager', 'validation.errors.INVALID_ZIP', 'Érvénytelen ZIP fájl'),
    ('en', 'plugin-manager', 'validation.errors.INVALID_ZIP', 'Invalid ZIP file'),
    ('hu', 'plugin-manager', 'validation.errors.MISSING_MANIFEST', 'A manifest.json fájl hiányzik a csomagból'),
    ('en', 'plugin-manager', 'validation.errors.MISSING_MANIFEST', 'manifest.json file is missing from the package'),
    ('hu', 'plugin-manager', 'validation.errors.INVALID_MANIFEST', 'Érvénytelen manifest.json fájl'),
    ('en', 'plugin-manager', 'validation.errors.INVALID_MANIFEST', 'Invalid manifest.json file'),
    ('hu', 'plugin-manager', 'validation.errors.DUPLICATE_PLUGIN_ID', 'A(z) "{pluginId}" azonosítójú alkalmazás már létezik'),
    ('en', 'plugin-manager', 'validation.errors.DUPLICATE_PLUGIN_ID', 'App with ID "{pluginId}" already exists'),
    ('hu', 'plugin-manager', 'validation.errors.DANGEROUS_CODE_PATTERN', 'Veszélyes kódminta: "{pattern}" a {file} fájlban ({line}. sor)'),
    ('en', 'plugin-manager', 'validation.errors.DANGEROUS_CODE_PATTERN', 'Dangerous pattern "{pattern}" found in {file}:{line}'),
    ('hu', 'plugin-manager', 'validation.errors.INVALID_DEPENDENCY', 'A(z) "{dependency}" függőség nem engedélyezett'),
    ('en', 'plugin-manager', 'validation.errors.INVALID_DEPENDENCY', 'Dependency "{dependency}" is not allowed'),
    ('hu', 'plugin-manager', 'validation.errors.INVALID_EXTENSION', 'Érvénytelen fájlkiterjesztés'),
    ('en', 'plugin-manager', 'validation.errors.INVALID_EXTENSION', 'Invalid file extension'),
    ('hu', 'plugin-manager', 'validation.errors.FILE_TOO_LARGE', 'A fájl mérete túl nagy'),
    ('en', 'plugin-manager', 'validation.errors.FILE_TOO_LARGE', 'File size is too large')
ON CONFLICT (locale, namespace, key) DO UPDATE SET
    value = EXCLUDED.value;

-- Seed: translations_chat — Chat app translations (UserList, ConversationList, ChatWindow)
-- =============================================================================
-- CHAT NAMESPACE - Chat alkalmazás fordításai
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'chat', 'userList.title', 'Felhasználók'),
('hu', 'chat', 'userList.loading', 'Betöltés...'),
('hu', 'chat', 'userList.noResults', 'Nincs találat'),
('hu', 'chat', 'userList.online', 'Online ({count})'),
('hu', 'chat', 'userList.offline', 'Offline ({count})')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'chat', 'conversationList.title', 'Beszélgetések'),
('hu', 'chat', 'conversationList.empty', 'Még nincs beszélgetésed'),
('hu', 'chat', 'conversationList.hint', 'Válassz egy felhasználót a jobb oldalon')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'chat', 'chatWindow.selectConversation', 'Válassz egy beszélgetést'),
('hu', 'chat', 'chatWindow.noMessages', 'Még nincs üzenet ebben a beszélgetésben')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'chat', 'userList.title', 'Users'),
('en', 'chat', 'userList.loading', 'Loading...'),
('en', 'chat', 'userList.noResults', 'No results'),
('en', 'chat', 'userList.online', 'Online ({count})'),
('en', 'chat', 'userList.offline', 'Offline ({count})')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'chat', 'conversationList.title', 'Conversations'),
('en', 'chat', 'conversationList.empty', 'No conversations yet'),
('en', 'chat', 'conversationList.hint', 'Select a user on the right')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'chat', 'chatWindow.selectConversation', 'Select a conversation'),
('en', 'chat', 'chatWindow.noMessages', 'No messages in this conversation yet')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Seed: translations_help — Help app translations
-- =============================================================================
-- HELP NAMESPACE - Súgó alkalmazás fordításai
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'help', 'notFound', 'Nem található súgó'),
('hu', 'help', 'generalContent', 'Általános súgó alkalmazás tartalom.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'help', 'notFound', 'Help not found'),
('en', 'help', 'generalContent', 'General help application content.')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Seed: translations_map — Map app translations
-- =============================================================================
-- MAP NAMESPACE - Térkép alkalmazás fordításai
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'map', 'tabs.search', 'Keresés'),
('hu', 'map', 'tabs.route', 'Útvonal'),
('hu', 'map', 'search.label', 'Hely keresése'),
('hu', 'map', 'search.placeholder', 'pl. Parlament, Budapest'),
('hu', 'map', 'search.button', 'Keresés'),
('hu', 'map', 'search.notFound', 'Nem található ilyen hely.'),
('hu', 'map', 'search.error', 'Hiba történt a keresés során.'),
('hu', 'map', 'search.clear', 'Törlés'),
('hu', 'map', 'route.startLabel', 'Indulás'),
('hu', 'map', 'route.startPlaceholder', 'pl. Budapest, Keleti'),
('hu', 'map', 'route.endLabel', 'Érkezés'),
('hu', 'map', 'route.endPlaceholder', 'pl. Debrecen, Főpályaudvar'),
('hu', 'map', 'route.modeLabel', 'Közlekedési mód'),
('hu', 'map', 'route.modeAuto', 'Autó'),
('hu', 'map', 'route.modePedestrian', 'Gyalog'),
('hu', 'map', 'route.modeBicycle', 'Kerékpár'),
('hu', 'map', 'route.settings', 'Beállítások'),
('hu', 'map', 'route.avoidTolls', 'Fizetős utak kerülése'),
('hu', 'map', 'route.avoidHighways', 'Autópályák kerülése'),
('hu', 'map', 'route.avoidFerries', 'Kompok kerülése'),
('hu', 'map', 'route.planButton', 'Útvonal tervezése'),
('hu', 'map', 'route.planning', 'Tervezés...'),
('hu', 'map', 'route.clear', 'Törlés'),
('hu', 'map', 'route.distance', 'Távolság'),
('hu', 'map', 'route.duration', 'Menetidő'),
('hu', 'map', 'route.notFound', 'Nem sikerült útvonalat találni.'),
('hu', 'map', 'route.serverError', 'Szerver hiba ({status}). Próbáld újra.'),
('hu', 'map', 'route.invalidResponse', 'Érvénytelen válasz a szervertől.'),
('hu', 'map', 'route.emptyFields', 'Kérlek add meg az indulási és érkezési helyet.'),
('hu', 'map', 'route.geocodeError', 'Nem található: "{place}"'),
('hu', 'map', 'route.error', 'Hiba történt az útvonal tervezése során.'),
('hu', 'map', 'locate.button', 'Aktuális hely használata'),
('hu', 'map', 'locate.notSupported', 'A böngésző nem támogatja a helymeghatározást.'),
('hu', 'map', 'locate.error', 'Nem sikerült lekérni az aktuális helyet.'),
('hu', 'map', 'depart', 'Indulás'),
('hu', 'map', 'arrive', 'Érkezés')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'map', 'tabs.search', 'Search'),
('en', 'map', 'tabs.route', 'Route'),
('en', 'map', 'search.label', 'Search place'),
('en', 'map', 'search.placeholder', 'e.g. Parliament, Budapest'),
('en', 'map', 'search.button', 'Search'),
('en', 'map', 'search.notFound', 'No places found.'),
('en', 'map', 'search.error', 'An error occurred during search.'),
('en', 'map', 'search.clear', 'Clear'),
('en', 'map', 'route.startLabel', 'From'),
('en', 'map', 'route.startPlaceholder', 'e.g. Budapest, Keleti'),
('en', 'map', 'route.endLabel', 'To'),
('en', 'map', 'route.endPlaceholder', 'e.g. Debrecen, Main Station'),
('en', 'map', 'route.modeLabel', 'Travel mode'),
('en', 'map', 'route.modeAuto', 'Car'),
('en', 'map', 'route.modePedestrian', 'Walking'),
('en', 'map', 'route.modeBicycle', 'Bicycle'),
('en', 'map', 'route.settings', 'Options'),
('en', 'map', 'route.avoidTolls', 'Avoid toll roads'),
('en', 'map', 'route.avoidHighways', 'Avoid highways'),
('en', 'map', 'route.avoidFerries', 'Avoid ferries'),
('en', 'map', 'route.planButton', 'Plan route'),
('en', 'map', 'route.planning', 'Planning...'),
('en', 'map', 'route.clear', 'Clear'),
('en', 'map', 'route.distance', 'Distance'),
('en', 'map', 'route.duration', 'Duration'),
('en', 'map', 'route.notFound', 'Could not find a route.'),
('en', 'map', 'route.serverError', 'Server error ({status}). Please try again.'),
('en', 'map', 'route.invalidResponse', 'Invalid response from server.'),
('en', 'map', 'route.emptyFields', 'Please enter both a start and end location.'),
('en', 'map', 'route.geocodeError', 'Not found: "{place}"'),
('en', 'map', 'route.error', 'An error occurred while planning the route.'),
('en', 'map', 'locate.button', 'Use current location'),
('en', 'map', 'locate.notSupported', 'Geolocation is not supported by this browser.'),
('en', 'map', 'locate.error', 'Could not retrieve current location.'),
('en', 'map', 'depart', 'From'),
('en', 'map', 'arrive', 'To')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Seed: translations_activity — Activity log action key translations (activity namespace)
-- =============================================================================
-- ACTIVITY NAMESPACE - Aktivitás napló action key fordítások
-- =============================================================================
-- Ez a namespace tartalmazza az activity log bejegyzések lefordított szövegeit.
-- Az action_key mező értéke a key oszlopnak felel meg.
-- A {{kulcs}} helyőrzők a context JSON mezőből kerülnek behelyettesítésre.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MAGYAR (hu) fordítások
-- -----------------------------------------------------------------------------

-- Felhasználó műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'activity', 'user.login', 'Bejelentkezés'),
('hu', 'activity', 'user.logout', 'Kijelentkezés'),
('hu', 'activity', 'user.profile.updated', 'Profil frissítve'),
('hu', 'activity', 'user.activated', 'Felhasználó aktiválva'),
('hu', 'activity', 'user.deactivated', 'Felhasználó deaktiválva'),
('hu', 'activity', 'user.group.added', 'Felhasználó csoporthoz adva'),
('hu', 'activity', 'user.group.removed', 'Felhasználó csoportból eltávolítva'),
('hu', 'activity', 'user.role.assigned', 'Szerepkör hozzárendelve'),
('hu', 'activity', 'user.role.removed', 'Szerepkör eltávolítva')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Szerepkör műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'activity', 'role.created', 'Szerepkör létrehozva'),
('hu', 'activity', 'role.deleted', 'Szerepkör törölve'),
('hu', 'activity', 'role.permission.added', 'Jogosultság hozzáadva a szerepkörhöz'),
('hu', 'activity', 'role.permission.removed', 'Jogosultság eltávolítva a szerepkörből')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Plugin műveletek
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('hu', 'activity', 'plugin.installed', 'Plugin telepítve'),
('hu', 'activity', 'plugin.uninstalled', 'Plugin eltávolítva')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- -----------------------------------------------------------------------------
-- ANGOL (en) fordítások
-- -----------------------------------------------------------------------------

-- User actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'activity', 'user.login', 'Login'),
('en', 'activity', 'user.logout', 'Logout'),
('en', 'activity', 'user.profile.updated', 'Profile updated'),
('en', 'activity', 'user.activated', 'User activated'),
('en', 'activity', 'user.deactivated', 'User deactivated'),
('en', 'activity', 'user.group.added', 'User added to group'),
('en', 'activity', 'user.group.removed', 'User removed from group'),
('en', 'activity', 'user.role.assigned', 'Role assigned'),
('en', 'activity', 'user.role.removed', 'Role removed')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Role actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'activity', 'role.created', 'Role created'),
('en', 'activity', 'role.deleted', 'Role deleted'),
('en', 'activity', 'role.permission.added', 'Permission added to role'),
('en', 'activity', 'role.permission.removed', 'Permission removed from role')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Plugin actions
INSERT INTO platform.translations (locale, namespace, key, value) VALUES
('en', 'activity', 'plugin.installed', 'Plugin installed'),
('en', 'activity', 'plugin.uninstalled', 'Plugin uninstalled')
ON CONFLICT (locale, namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Seed: apps — Application registry with metadata
-- Apps seed data
-- Migrated from existing metadata.ts files (users, settings, help)
-- Uses ON CONFLICT DO UPDATE for idempotency (upsert logic)

INSERT INTO platform.apps (
    app_id,
    name,
    description,
    version,
    icon,
    icon_style,
    category,
    permissions,
    multi_instance,
    default_size,
    min_size,
    max_size,
    author,
    keywords,
    help_id,
    is_active,
    is_public,
    sort_order
) VALUES
    -- Users app (system category) - Admin only
    (
        'users',
        '{"hu": "Felhasználók", "en": "Users"}'::jsonb,
        '{"hu": "Felhasználói fiókok kezelése és adminisztráció", "en": "User account management and administration"}'::jsonb,
        '1.0.0',
        'UsersRound',
        'icon',
        'system',
        '[{"resource": "users", "action": "read"}, {"resource": "users", "action": "write"}, {"resource": "users", "action": "delete"}]'::jsonb,
        false,
        '{"width": 1000, "height": 800}'::jsonb,
        '{"width": 700, "height": 600}'::jsonb,
        NULL,
        'System',
        '["felhasználók", "admin", "fiókok", "kezelés", "users", "accounts", "management"]'::jsonb,
        NULL,
        true,
        false,
        10
    ),
    -- Settings app (system category) - Public
    (
        'settings',
        '{"hu": "Beállítások", "en": "Settings"}'::jsonb,
        '{"hu": "Rendszer beállítások és testreszabási lehetőségek", "en": "System settings and customization options"}'::jsonb,
        '1.0.0',
        'Settings',
        'icon',
        'system',
        '[{"resource": "system", "action": "read"}, {"resource": "system", "action": "write"}]'::jsonb,
        false,
        '{"width": 1050, "height": 700}'::jsonb,
        '{"width": 1050, "height": 500}'::jsonb,
        NULL,
        'System',
        '["beállítások", "konfiguráció", "testreszabás", "rendszer", "settings", "configuration", "customization"]'::jsonb,
        NULL,
        true,
        true,
        20
    ),
    -- Help app (utilities category) - Public
    (
        'help',
        '{"hu": "Súgó", "en": "Help"}'::jsonb,
        '{"hu": "Rendszer dokumentáció és felhasználói útmutatók", "en": "System documentation and user guides"}'::jsonb,
        '1.0.0',
        'MessageCircleQuestionMark',
        'icon',
        'utilities',
        '[{"resource": "documentation", "action": "read"}]'::jsonb,
        true,
        '{"width": 800, "height": 600}'::jsonb,
        '{"width": 500, "height": 400}'::jsonb,
        NULL,
        'System',
        '["súgó", "dokumentáció", "útmutató", "help", "documentation", "guide"]'::jsonb,
        NULL,
        true,
        true,
        100
    ),
    -- Log app (system category) - Public
    (
        'log',
        '{"hu": "Napló", "en": "Log"}'::jsonb,
        '{"hu": "Rendszer naplók", "en": "System logs"}'::jsonb,
        '1.0.0',
        'ClipboardClock',
        'icon',
        'system',
        '[{"resource": "documentation", "action": "read"}]'::jsonb,
        true,
        '{"width": 900, "height": 600, "maximized": true}'::jsonb,
        '{"width": 900, "height": 500}'::jsonb,
        NULL,
        'System',
        '["napló", "hiba", "aktivitás", "log", "error", "activity"]'::jsonb,
        NULL,
        true,
        true,
        95
    ),
    -- Notification Demo app (system category) - Public
    (
        'notification-demo',
        '{"hu": "Értesítési Demo", "en": "Notification Demo"}'::jsonb,
        '{"hu": "Értesítési rendszer demo és tesztelő alkalmazás", "en": "Notification system demo and testing application"}'::jsonb,
        '1.0.0',
        'Bell',
        'icon',
        'system',
        '[]'::jsonb,
        false,
        '{"width": 800, "height": 600}'::jsonb,
        '{"width": 600, "height": 400}'::jsonb,
        NULL,
        'System',
        '["értesítés", "notification", "demo", "teszt", "test"]'::jsonb,
        NULL,
        false,
        true,
        90
    ),
    -- Notifications app (utilities category) - Public
    (
        'notifications',
        '{"hu": "Értesítések", "en": "Notifications"}'::jsonb,
        '{"hu": "Az összes értesítésed egy helyen", "en": "All your notifications in one place"}'::jsonb,
        '1.0.0',
        'Bell',
        'icon',
        'utilities',
        '[]'::jsonb,
        false,
        '{"width": 1200, "height": 700, "maximized": true}'::jsonb,
        '{"width": 800, "height": 500}'::jsonb,
        NULL,
        'System',
        '["értesítés", "notification", "üzenet", "message"]'::jsonb,
        NULL,
        true,
        true,
        85
    ),
    -- Chat app (communication category) - Public
    (
        'chat',
        '{"hu": "Üzenetek", "en": "Chat"}'::jsonb,
        '{"hu": "Belső üzenetküldő rendszer", "en": "Internal messaging system"}'::jsonb,
        '1.0.0',
        'MessageCircle',
        'icon',
        'communication',
        '[]'::jsonb,
        false,
        '{"width": 1200, "height": 700}'::jsonb,
        '{"width": 900, "height": 600}'::jsonb,
        NULL,
        'System',
        '["üzenet", "chat", "beszélgetés", "message", "conversation"]'::jsonb,
        NULL,
        true,
        true,
        80
    ),
    -- Plugin Manager app (system category) - Admin only
    (
        'plugin-manager',
        '{"hu": "Alkalmazások", "en": "Apps"}'::jsonb,
        '{"hu": "Alkalmazások feltöltése és telepítése", "en": "Upload and install apps"}'::jsonb,
        '1.0.0',
        'Package',
        'icon',
        'system',
        '[{"resource": "plugins", "action": "write"}]'::jsonb,
        false,
        '{"width": 800, "height": 600}'::jsonb,
        '{"width": 600, "height": 500}'::jsonb,
        NULL,
        'System',
        '["plugin", "bővítmény", "telepítés", "feltöltés", "install", "upload", "package"]'::jsonb,
        NULL,
        true,
        false,
        15
    ),
    -- Map app (utilities category) - Public
    (
        'map',
        '{"hu": "Térkép", "en": "Map"}'::jsonb,
        '{"hu": "Interaktív térkép és útvonaltervező", "en": "Interactive map and route planner"}'::jsonb,
        '1.0.0',
        'Map',
        'icon',
        'utilities',
        '[]'::jsonb,
        true,
        '{"width": 1000, "height": 650}'::jsonb,
        '{"width": 700, "height": 450}'::jsonb,
        NULL,
        'System',
        '["térkép", "útvonal", "navigáció", "map", "route", "navigation", "gps"]'::jsonb,
        NULL,
        true,
        true,
        75
    )
ON CONFLICT (app_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    icon = EXCLUDED.icon,
    icon_style = EXCLUDED.icon_style,
    category = EXCLUDED.category,
    permissions = EXCLUDED.permissions,
    multi_instance = EXCLUDED.multi_instance,
    default_size = EXCLUDED.default_size,
    min_size = EXCLUDED.min_size,
    max_size = EXCLUDED.max_size,
    author = EXCLUDED.author,
    keywords = EXCLUDED.keywords,
    help_id = EXCLUDED.help_id,
    is_active = EXCLUDED.is_active,
    is_public = EXCLUDED.is_public,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- Reset the sequence to continue after our manually inserted IDs
SELECT setval('platform.apps_id_seq', (SELECT MAX(id) FROM platform.apps));

-- Seed: role_app_access — Role-app access assignments for access control
-- Role App Access Seed Data
-- This file assigns apps to roles

-- Sysadmin role: all apps
INSERT INTO auth.role_app_access (role_id, app_id)
SELECT 1, id FROM platform.apps
ON CONFLICT DO NOTHING;

-- Admin role: most apps except system-critical ones
INSERT INTO auth.role_app_access (role_id, app_id) VALUES
  (2, 1),  -- Users app
  (2, 2),  -- Settings app
  (2, 3),  -- Dashboard app
  (2, 4),  -- Content app
  (2, 5),  -- Analytics app
  (2, 6)   -- Reports app
ON CONFLICT DO NOTHING;

-- Editor role: content-related apps
INSERT INTO auth.role_app_access (role_id, app_id) VALUES
  (3, 3),  -- Dashboard app
  (3, 4),  -- Content app
  (3, 6)   -- Reports app
ON CONFLICT DO NOTHING;

-- User role: basic apps
INSERT INTO auth.role_app_access (role_id, app_id) VALUES
  (4, 3),  -- Dashboard app
  (4, 4)   -- Content app
ON CONFLICT DO NOTHING;

-- Seed: group_app_access — Group-app access assignments for access control
-- Group App Access Seed Data
-- This file assigns apps to groups

-- Sysadmin group: all apps
INSERT INTO auth.group_app_access (group_id, app_id)
SELECT 1, id FROM platform.apps
ON CONFLICT DO NOTHING;

-- Admin group: most apps
INSERT INTO auth.group_app_access (group_id, app_id) VALUES
  (2, 1),  -- Users app
  (2, 2),  -- Settings app
  (2, 3),  -- Dashboard app
  (2, 4),  -- Content app
  (2, 5),  -- Analytics app
  (2, 6)   -- Reports app
ON CONFLICT DO NOTHING;

-- Content editor group: content-related apps
INSERT INTO auth.group_app_access (group_id, app_id) VALUES
  (3, 3),  -- Dashboard app
  (3, 4),  -- Content app
  (3, 6)   -- Reports app
ON CONFLICT DO NOTHING;

-- Public user group: basic apps
INSERT INTO auth.group_app_access (group_id, app_id) VALUES
  (4, 3),  -- Dashboard app
  (4, 4)   -- Content app
ON CONFLICT DO NOTHING;

-- Seed: email_templates — Email templates for all system emails (HU/EN)
-- Seed data for email_templates table
-- All email templates for the system (Hungarian and English)
-- Design: Clean, professional light theme

-- WELCOME template - Hungarian
INSERT INTO platform.email_templates (template_type, locale, name, subject_template, html_template, text_template, required_data, optional_data, is_active)
VALUES (
	'welcome',
	'hu',
	'Üdvözlő email',
	'Üdvözlünk a {{appName}} rendszerben!',
	'<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Üdvözlünk - {{appName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
		<tr>
			<td align="center" style="padding: 48px 24px;">
				<!-- Main Card -->
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px;">
					<!-- Logo -->
					<tr>
						<td align="center" style="padding: 32px 32px 24px;">
							<span style="font-size: 24px; font-weight: 700; color: #3b82f6;">{{appNameHtml}}</span>
						</td>
					</tr>
					<!-- Content -->
					<tr>
						<td style="padding: 0 32px 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">Üdvözlünk, {{name}}!</h1>
							<p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #52525b; text-align: center;">
								Örülünk, hogy csatlakozott hozzánk. A fiókja sikeresen létrejött és készen áll a kezdésre.
							</p>
							<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
								<tr>
									<td align="center">
										<a href="{{dashboardUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">Kezdés</a>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					<!-- Footer -->
					<tr>
						<td style="padding: 24px 32px; border-top: 1px solid #e4e4e7;">
							<p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
								Ez az e-mail a {{email}} címre lett küldve.<br>
								Ha nem Ön hozta létre ezt a fiókot, hagyja figyelmen kívül.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>',
	'Üdvözlünk a {{appName}} rendszerben, {{name}}!

A fiókja sikeresen létrejött.

Üdvözlettel,
A {{appName}} csapata',
	'["name", "email", "appName", "appNameHtml"]',
	'["dashboardUrl", "unsubscribeUrl"]',
	true
)
ON CONFLICT (template_type, locale) DO UPDATE SET
	name = EXCLUDED.name,
	subject_template = EXCLUDED.subject_template,
	html_template = EXCLUDED.html_template,
	text_template = EXCLUDED.text_template,
	required_data = EXCLUDED.required_data,
	optional_data = EXCLUDED.optional_data,
	is_active = EXCLUDED.is_active,
	updated_at = NOW();

-- WELCOME template - English
INSERT INTO platform.email_templates (template_type, locale, name, subject_template, html_template, text_template, required_data, optional_data, is_active)
VALUES (
	'welcome',
	'en',
	'Welcome email',
	'Welcome to {{appName}}!',
	'<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Welcome - {{appName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
		<tr>
			<td align="center" style="padding: 48px 24px;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td align="center" style="padding: 32px 32px 24px;">
							<span style="font-size: 24px; font-weight: 700; color: #3b82f6;">{{appNameHtml}}</span>
						</td>
					</tr>
					<tr>
						<td style="padding: 0 32px 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">Welcome, {{name}}!</h1>
							<p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #52525b; text-align: center;">
								We''re excited to have you join us. Your account has been successfully created.
							</p>
							<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
								<tr>
									<td align="center">
										<a href="{{dashboardUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">Get Started</a>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 32px; border-top: 1px solid #e4e4e7;">
							<p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
								This email was sent to {{email}}.<br>
								If you didn''t create this account, please ignore this email.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>',
	'Welcome to {{appName}}, {{name}}!

Your account has been successfully created.

Best regards,
The {{appName}} Team',
	'["name", "email", "appName", "appNameHtml"]',
	'["dashboardUrl", "unsubscribeUrl"]',
	true
)
ON CONFLICT (template_type, locale) DO UPDATE SET
	name = EXCLUDED.name,
	subject_template = EXCLUDED.subject_template,
	html_template = EXCLUDED.html_template,
	text_template = EXCLUDED.text_template,
	required_data = EXCLUDED.required_data,
	optional_data = EXCLUDED.optional_data,
	is_active = EXCLUDED.is_active,
	updated_at = NOW();

-- PASSWORD_RESET template - Hungarian
INSERT INTO platform.email_templates (template_type, locale, name, subject_template, html_template, text_template, required_data, optional_data, is_active)
VALUES (
	'password_reset',
	'hu',
	'Jelszó visszaállítás',
	'{{appName}} - Jelszó visszaállítás',
	'<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Jelszó visszaállítás - {{appName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
		<tr>
			<td align="center" style="padding: 48px 24px;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td align="center" style="padding: 32px 32px 24px;">
							<span style="font-size: 24px; font-weight: 700; color: #3b82f6;">{{appNameHtml}}</span>
						</td>
					</tr>
					<tr>
						<td style="padding: 0 32px 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">Jelszó visszaállítás</h1>
							<p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #52525b; text-align: center;">
								Kedves {{name}},
							</p>
							<p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #52525b; text-align: center;">
								Jelszó visszaállítási kérelmet kaptunk a fiókjához.
							</p>
							<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
								<tr>
									<td align="center">
										<a href="{{resetLink}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">Jelszó visszaállítása</a>
									</td>
								</tr>
							</table>
							<p style="margin: 24px 0 0; font-size: 12px; color: #71717a; text-align: center;">
								A link {{expirationTime}} múlva lejár.<br>
								Ha nem Ön kérte, hagyja figyelmen kívül.
							</p>
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 32px; border-top: 1px solid #e4e4e7;">
							<p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
								Ez az e-mail a {{email}} címre lett küldve.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>',
	'Jelszó visszaállítás - {{appName}}

Kedves {{name}}!

Jelszó visszaállítási kérelmet kaptunk.
Visszaállítás: {{resetLink}}

A link {{expirationTime}} múlva lejár.

Üdvözlettel,
A {{appName}} csapata',
	'["name", "email", "resetLink", "appName", "appNameHtml", "expirationTime"]',
	'[]',
	true
)
ON CONFLICT (template_type, locale) DO UPDATE SET
	name = EXCLUDED.name,
	subject_template = EXCLUDED.subject_template,
	html_template = EXCLUDED.html_template,
	text_template = EXCLUDED.text_template,
	required_data = EXCLUDED.required_data,
	optional_data = EXCLUDED.optional_data,
	is_active = EXCLUDED.is_active,
	updated_at = NOW();

-- PASSWORD_RESET template - English
INSERT INTO platform.email_templates (template_type, locale, name, subject_template, html_template, text_template, required_data, optional_data, is_active)
VALUES (
	'password_reset',
	'en',
	'Password Reset',
	'{{appName}} - Password Reset',
	'<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Password Reset - {{appName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
		<tr>
			<td align="center" style="padding: 48px 24px;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td align="center" style="padding: 32px 32px 24px;">
							<span style="font-size: 24px; font-weight: 700; color: #3b82f6;">{{appNameHtml}}</span>
						</td>
					</tr>
					<tr>
						<td style="padding: 0 32px 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">Password Reset</h1>
							<p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #52525b; text-align: center;">
								Hello {{name}},
							</p>
							<p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #52525b; text-align: center;">
								We received a request to reset your password.
							</p>
							<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
								<tr>
									<td align="center">
										<a href="{{resetLink}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">Reset Password</a>
									</td>
								</tr>
							</table>
							<p style="margin: 24px 0 0; font-size: 12px; color: #71717a; text-align: center;">
								This link expires in {{expirationTime}}.<br>
								If you didn''t request this, please ignore.
							</p>
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 32px; border-top: 1px solid #e4e4e7;">
							<p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
								This email was sent to {{email}}.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>',
	'Password Reset - {{appName}}

Hello {{name}},

Reset your password: {{resetLink}}

This link expires in {{expirationTime}}.

Best regards,
The {{appName}} Team',
	'["name", "email", "resetLink", "appName", "appNameHtml", "expirationTime"]',
	'[]',
	true
)
ON CONFLICT (template_type, locale) DO UPDATE SET
	name = EXCLUDED.name,
	subject_template = EXCLUDED.subject_template,
	html_template = EXCLUDED.html_template,
	text_template = EXCLUDED.text_template,
	required_data = EXCLUDED.required_data,
	optional_data = EXCLUDED.optional_data,
	is_active = EXCLUDED.is_active,
	updated_at = NOW();


-- EMAIL_VERIFICATION template - Hungarian
INSERT INTO platform.email_templates (template_type, locale, name, subject_template, html_template, text_template, required_data, optional_data, is_active)
VALUES (
	'email_verification',
	'hu',
	'E-mail megerősítés',
	'Erősítse meg az e-mail címét - {{appName}}',
	'<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>E-mail megerősítés - {{appName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
		<tr>
			<td align="center" style="padding: 48px 24px;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td align="center" style="padding: 32px 32px 24px;">
							<span style="font-size: 24px; font-weight: 700; color: #3b82f6;">{{appNameHtml}}</span>
						</td>
					</tr>
					<tr>
						<td style="padding: 0 32px 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">E-mail megerősítés</h1>
							<p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #52525b; text-align: center;">
								Kedves {{name}}! Kérjük, erősítse meg az email címét az alábbi gombra kattintva.
							</p>
							<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
								<tr>
									<td align="center">
										<a href="{{verificationUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">E-mail megerősítése</a>
									</td>
								</tr>
							</table>
							<p style="margin: 24px 0 0; font-size: 12px; color: #71717a; text-align: center;">
								A link {{expirationTime}} múlva lejár.
							</p>
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 32px; border-top: 1px solid #e4e4e7;">
							<p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
								Ez az e-mail a {{email}} címre lett küldve.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>',
	'E-mail megerősítés - {{appName}}

Kedves {{name}}!

Erősítse meg az e-mail címét: {{verificationUrl}}

A link {{expirationTime}} múlva lejár.

Üdvözlettel,
A {{appName}} csapata',
	'["name", "email", "verificationUrl", "appName", "appNameHtml"]',
	'["expirationTime"]',
	true
)
ON CONFLICT (template_type, locale) DO UPDATE SET
	name = EXCLUDED.name,
	subject_template = EXCLUDED.subject_template,
	html_template = EXCLUDED.html_template,
	text_template = EXCLUDED.text_template,
	required_data = EXCLUDED.required_data,
	optional_data = EXCLUDED.optional_data,
	is_active = EXCLUDED.is_active,
	updated_at = NOW();

-- EMAIL_VERIFICATION template - English
INSERT INTO platform.email_templates (template_type, locale, name, subject_template, html_template, text_template, required_data, optional_data, is_active)
VALUES (
	'email_verification',
	'en',
	'Email Verification',
	'Verify your email - {{appName}}',
	'<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Email Verification - {{appName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
		<tr>
			<td align="center" style="padding: 48px 24px;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td align="center" style="padding: 32px 32px 24px;">
							<span style="font-size: 24px; font-weight: 700; color: #3b82f6;">{{appNameHtml}}</span>
						</td>
					</tr>
					<tr>
						<td style="padding: 0 32px 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">Verify Your Email</h1>
							<p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #52525b; text-align: center;">
								Hi {{name}}! Please verify your email address by clicking the button below.
							</p>
							<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
								<tr>
									<td align="center">
										<a href="{{verificationUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">Verify Email</a>
									</td>
								</tr>
							</table>
							<p style="margin: 24px 0 0; font-size: 12px; color: #71717a; text-align: center;">
								This link expires in {{expirationTime}}.
							</p>
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 32px; border-top: 1px solid #e4e4e7;">
							<p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
								This email was sent to {{email}}.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>',
	'Email Verification - {{appName}}

Hi {{name}}!

Verify your email: {{verificationUrl}}

This link expires in {{expirationTime}}.

Best regards,
The {{appName}} Team',
	'["name", "email", "verificationUrl", "appName", "appNameHtml"]',
	'["expirationTime"]',
	true
)
ON CONFLICT (template_type, locale) DO UPDATE SET
	name = EXCLUDED.name,
	subject_template = EXCLUDED.subject_template,
	html_template = EXCLUDED.html_template,
	text_template = EXCLUDED.text_template,
	required_data = EXCLUDED.required_data,
	optional_data = EXCLUDED.optional_data,
	is_active = EXCLUDED.is_active,
	updated_at = NOW();

-- NOTIFICATION template - Hungarian
INSERT INTO platform.email_templates (template_type, locale, name, subject_template, html_template, text_template, required_data, optional_data, is_active)
VALUES (
	'notification',
	'hu',
	'Értesítés',
	'{{title}} - {{appName}}',
	'<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>{{title}} - {{appName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
		<tr>
			<td align="center" style="padding: 48px 24px;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td align="center" style="padding: 32px 32px 24px;">
							<span style="font-size: 24px; font-weight: 700; color: #3b82f6;">{{appNameHtml}}</span>
						</td>
					</tr>
					<tr>
						<td style="padding: 0 32px 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">{{title}}</h1>
							<p style="margin: 0 0 8px; font-size: 14px; color: #52525b; text-align: center;">Kedves {{name}},</p>
							<div style="margin: 16px 0; padding: 16px; background-color: #f4f4f5; border-radius: 6px;">
								<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #18181b;">{{message}}</p>
							</div>
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 32px; border-top: 1px solid #e4e4e7;">
							<p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
								Ez az értesítés a {{email}} címre lett küldve.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>',
	'{{title}} - {{appName}}

Kedves {{name}}!

{{message}}

Üdvözlettel,
A {{appName}} csapata',
	'["name", "email", "title", "message", "appName", "appNameHtml", "type"]',
	'["details", "actionUrl", "actionText", "timestamp", "priority", "unsubscribeUrl"]',
	true
)
ON CONFLICT (template_type, locale) DO UPDATE SET
	name = EXCLUDED.name,
	subject_template = EXCLUDED.subject_template,
	html_template = EXCLUDED.html_template,
	text_template = EXCLUDED.text_template,
	required_data = EXCLUDED.required_data,
	optional_data = EXCLUDED.optional_data,
	is_active = EXCLUDED.is_active,
	updated_at = NOW();

-- NOTIFICATION template - English
INSERT INTO platform.email_templates (template_type, locale, name, subject_template, html_template, text_template, required_data, optional_data, is_active)
VALUES (
	'notification',
	'en',
	'Notification',
	'{{title}} - {{appName}}',
	'<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>{{title}} - {{appName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
		<tr>
			<td align="center" style="padding: 48px 24px;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td align="center" style="padding: 32px 32px 24px;">
							<span style="font-size: 24px; font-weight: 700; color: #3b82f6;">{{appNameHtml}}</span>
						</td>
					</tr>
					<tr>
						<td style="padding: 0 32px 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">{{title}}</h1>
							<p style="margin: 0 0 8px; font-size: 14px; color: #52525b; text-align: center;">Hello {{name}},</p>
							<div style="margin: 16px 0; padding: 16px; background-color: #f4f4f5; border-radius: 6px;">
								<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #18181b;">{{message}}</p>
							</div>
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 32px; border-top: 1px solid #e4e4e7;">
							<p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
								This notification was sent to {{email}}.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>',
	'{{title}} - {{appName}}

Hello {{name}},

{{message}}

Best regards,
The {{appName}} Team',
	'["name", "email", "title", "message", "appName", "appNameHtml", "type"]',
	'["details", "actionUrl", "actionText", "timestamp", "priority", "unsubscribeUrl"]',
	true
)
ON CONFLICT (template_type, locale) DO UPDATE SET
	name = EXCLUDED.name,
	subject_template = EXCLUDED.subject_template,
	html_template = EXCLUDED.html_template,
	text_template = EXCLUDED.text_template,
	required_data = EXCLUDED.required_data,
	optional_data = EXCLUDED.optional_data,
	is_active = EXCLUDED.is_active,
	updated_at = NOW();


-- TWO_FACTOR_OTP template - Hungarian
INSERT INTO platform.email_templates (template_type, locale, name, subject_template, html_template, text_template, required_data, optional_data, is_active)
VALUES (
	'two_factor_otp',
	'hu',
	'Kétfaktoros hitelesítési kód',
	'{{appName}} - Hitelesítési kód: {{otp}}',
	'<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>2FA Kód - {{appName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
		<tr>
			<td align="center" style="padding: 48px 24px;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td align="center" style="padding: 32px 32px 24px;">
							<span style="font-size: 24px; font-weight: 700; color: #3b82f6;">{{appNameHtml}}</span>
						</td>
					</tr>
					<tr>
						<td style="padding: 0 32px 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">Hitelesítési kód</h1>
							<p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #52525b; text-align: center;">
								Kedves {{name}}, használja az alábbi kódot a bejelentkezéshez:
							</p>
							<div style="margin: 0 0 24px; padding: 20px; background-color: #f4f4f5; border-radius: 8px; text-align: center;">
								<span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #18181b; font-family: ''Courier New'', monospace;">{{otp}}</span>
							</div>
							<p style="margin: 0; font-size: 12px; color: #71717a; text-align: center;">
								A kód érvényessége: {{expirationTime}}<br>
								Ha nem Ön próbált bejelentkezni, változtassa meg a jelszavát.
							</p>
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 32px; border-top: 1px solid #e4e4e7;">
							<p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
								Ez az e-mail a {{email}} címre lett küldve.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>',
	'{{appName}} - Hitelesítési kód

Kedves {{name}}!

A hitelesítési kódod: {{otp}}

A kód érvényessége: {{expirationTime}}

Üdvözlettel,
A {{appName}} csapata',
	'["name", "email", "otp", "appName", "appNameHtml"]',
	'["expirationTime"]',
	true
)
ON CONFLICT (template_type, locale) DO UPDATE SET
	name = EXCLUDED.name,
	subject_template = EXCLUDED.subject_template,
	html_template = EXCLUDED.html_template,
	text_template = EXCLUDED.text_template,
	required_data = EXCLUDED.required_data,
	optional_data = EXCLUDED.optional_data,
	is_active = EXCLUDED.is_active,
	updated_at = NOW();

-- TWO_FACTOR_OTP template - English
INSERT INTO platform.email_templates (template_type, locale, name, subject_template, html_template, text_template, required_data, optional_data, is_active)
VALUES (
	'two_factor_otp',
	'en',
	'Two-Factor Authentication Code',
	'{{appName}} - Your code: {{otp}}',
	'<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>2FA Code - {{appName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
		<tr>
			<td align="center" style="padding: 48px 24px;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td align="center" style="padding: 32px 32px 24px;">
							<span style="font-size: 24px; font-weight: 700; color: #3b82f6;">{{appNameHtml}}</span>
						</td>
					</tr>
					<tr>
						<td style="padding: 0 32px 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">Authentication Code</h1>
							<p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #52525b; text-align: center;">
								Dear {{name}}, use the following code to sign in:
							</p>
							<div style="margin: 0 0 24px; padding: 20px; background-color: #f4f4f5; border-radius: 8px; text-align: center;">
								<span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #18181b; font-family: ''Courier New'', monospace;">{{otp}}</span>
							</div>
							<p style="margin: 0; font-size: 12px; color: #71717a; text-align: center;">
								This code is valid for {{expirationTime}}.<br>
								If you didn''t try to sign in, change your password.
							</p>
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 32px; border-top: 1px solid #e4e4e7;">
							<p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
								This email was sent to {{email}}.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>',
	'{{appName}} - Authentication Code

Dear {{name}},

Your code: {{otp}}

This code is valid for {{expirationTime}}.

Best regards,
The {{appName}} Team',
	'["name", "email", "otp", "appName", "appNameHtml"]',
	'["expirationTime"]',
	true
)
ON CONFLICT (template_type, locale) DO UPDATE SET
	name = EXCLUDED.name,
	subject_template = EXCLUDED.subject_template,
	html_template = EXCLUDED.html_template,
	text_template = EXCLUDED.text_template,
	required_data = EXCLUDED.required_data,
	optional_data = EXCLUDED.optional_data,
	is_active = EXCLUDED.is_active,
	updated_at = NOW();

-- EMAIL_OTP_SIGN_IN template - Hungarian
INSERT INTO platform.email_templates (template_type, locale, name, subject_template, html_template, text_template, required_data, optional_data, is_active)
VALUES (
	'email_otp_sign_in',
	'hu',
	'Bejelentkezési kód',
	'{{appName}} - Bejelentkezési kód: {{otp}}',
	'<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Bejelentkezési kód - {{appName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
		<tr>
			<td align="center" style="padding: 48px 24px;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td align="center" style="padding: 32px 32px 24px;">
							<span style="font-size: 24px; font-weight: 700; color: #3b82f6;">{{appNameHtml}}</span>
						</td>
					</tr>
					<tr>
						<td style="padding: 0 32px 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">Bejelentkezési kód</h1>
							<p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #52525b; text-align: center;">
								Használja az alábbi kódot a bejelentkezéshez:
							</p>
							<div style="margin: 0 0 24px; padding: 20px; background-color: #f4f4f5; border-radius: 8px; text-align: center;">
								<span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #18181b; font-family: ''Courier New'', monospace;">{{otp}}</span>
							</div>
							<p style="margin: 0; font-size: 12px; color: #71717a; text-align: center;">
								A kód érvényessége {{expirationTime}}<br>
								Ha nem Ön kérte, hagyja figyelmen kívül.
							</p>
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 32px; border-top: 1px solid #e4e4e7;">
							<p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
								Ez az e-mail a {{email}} címre lett küldve.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>',
	'{{appName}} - Bejelentkezési kód

A bejelentkezési kódod: {{otp}}

A kód érvényessége: {{expirationTime}}

Üdvözlettel,
A {{appName}} csapata',
	'["email", "otp", "appName", "appNameHtml"]',
	'["expirationTime"]',
	true
)
ON CONFLICT (template_type, locale) DO UPDATE SET
	name = EXCLUDED.name,
	subject_template = EXCLUDED.subject_template,
	html_template = EXCLUDED.html_template,
	text_template = EXCLUDED.text_template,
	required_data = EXCLUDED.required_data,
	optional_data = EXCLUDED.optional_data,
	is_active = EXCLUDED.is_active,
	updated_at = NOW();

-- EMAIL_OTP_SIGN_IN template - English
INSERT INTO platform.email_templates (template_type, locale, name, subject_template, html_template, text_template, required_data, optional_data, is_active)
VALUES (
	'email_otp_sign_in',
	'en',
	'Sign-in Code',
	'{{appName}} - Sign-in code: {{otp}}',
	'<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Sign-in Code - {{appName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
		<tr>
			<td align="center" style="padding: 48px 24px;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td align="center" style="padding: 32px 32px 24px;">
							<span style="font-size: 24px; font-weight: 700; color: #3b82f6;">{{appNameHtml}}</span>
						</td>
					</tr>
					<tr>
						<td style="padding: 0 32px 32px;">
							<h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">Sign-in Code</h1>
							<p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #52525b; text-align: center;">
								Use the following code to sign in:
							</p>
							<div style="margin: 0 0 24px; padding: 20px; background-color: #f4f4f5; border-radius: 8px; text-align: center;">
								<span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #18181b; font-family: ''Courier New'', monospace;">{{otp}}</span>
							</div>
							<p style="margin: 0; font-size: 12px; color: #71717a; text-align: center;">
								This code is valid for {{expirationTime}}.<br>
								If you didn''t request this, please ignore.
							</p>
						</td>
					</tr>
					<tr>
						<td style="padding: 24px 32px; border-top: 1px solid #e4e4e7;">
							<p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
								This email was sent to {{email}}.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>',
	'{{appName}} - Sign-in Code

Your sign-in code: {{otp}}

This code is valid for {{expirationTime}}.

Best regards,
The {{appName}} Team',
	'["email", "otp", "appName", "appNameHtml"]',
	'["expirationTime"]',
	true
)
ON CONFLICT (template_type, locale) DO UPDATE SET
	name = EXCLUDED.name,
	subject_template = EXCLUDED.subject_template,
	html_template = EXCLUDED.html_template,
	text_template = EXCLUDED.text_template,
	required_data = EXCLUDED.required_data,
	optional_data = EXCLUDED.optional_data,
	is_active = EXCLUDED.is_active,
	updated_at = NOW();

-- Seed: theme_presets — Predefined theme presets for appearance customization
-- =============================================================================
-- THEME PRESETS - Előre definiált megjelenési témák (többnyelvű)
-- =============================================================================

-- Magyar (hu)
INSERT INTO platform.theme_presets (locale, name, description, settings, is_default, sort_order, created_at, updated_at) VALUES
(
	'hu',
	'Kitsune',
	'Japán róka-szellem varázslatos színvilága',
	'{
		"theme": {
			"mode": "dark",
			"modeTaskbarStartMenu": "dark",
			"colorPrimaryHue": "50",
			"colorPrimaryLightness": "0.72",
			"colorPrimaryChroma": "0.12",
			"fontSize": "medium"
		},
		"background": {
			"type": "video",
			"value": "02.mp4"
		}
	}'::jsonb,
	false, 5, NOW(), NOW()
),
(
	'hu',
	'Füst',
	'Füstszerű árnyalatok hideg türkiz fényekkel',
	'{
		"theme": {
			"mode": "dark",
			"modeTaskbarStartMenu": "dark",
			"colorPrimaryHue": "185",
			"colorPrimaryLightness": "0.66",
			"colorPrimaryChroma": "0.12",
			"fontSize": "medium"
		},
		"background": {
			"type": "image",
			"value": "05.webp"
		}
	}'::jsonb,
	false, 6, NOW(), NOW()
),
(
	'hu',
	'Békés Harcos',
	'Nyugodt erő és belső béke harmóniája',
	'{
		"theme": {
			"mode": "light",
			"modeTaskbarStartMenu": "dark",
			"colorPrimaryHue": "200",
			"colorPrimaryLightness": "0.55",
			"colorPrimaryChroma": "0.14",
			"fontSize": "medium"
		},
		"background": {
			"type": "video",
			"value": "03.mp4"
		}
	}'::jsonb,
	false, 4, NOW(), NOW()
),
(
	'hu',
	'Hó',
	'Friss hótakaró kristálytiszta fehérsége',
	'{
		"theme": {
			"mode": "light",
			"modeTaskbarStartMenu": "dark",
			"colorPrimaryHue": "250",
			"colorPrimaryLightness": "0.54",
			"colorPrimaryChroma": "0.14",
			"fontSize": "medium"
		},
		"background": {
			"type": "image",
			"value": "08.webp"
		}
	}'::jsonb,
	false, 1, NOW(), NOW()
),
(
	'hu',
	'Éjfél',
	'Csillagtalan éjszaka csendes nyugalma',
	'{
		"theme": {
			"mode": "dark",
			"modeTaskbarStartMenu": "dark",
			"colorPrimaryHue": "250",
			"colorPrimaryLightness": "0.66",
			"colorPrimaryChroma": "0.12",
			"fontSize": "medium"
		},
		"background": {
			"type": "color",
			"value": "#0d0d0d"
		}
	}'::jsonb,
	false, 2, NOW(), NOW()
),
(
	'hu',
	'Sakura',
	'Japán cseresznyevirág tavaszi pompája',
	'{
		"theme": {
			"mode": "auto",
			"modeTaskbarStartMenu": "dark",
			"colorPrimaryHue": "340",
			"colorPrimaryLightness": "0.66",
			"colorPrimaryChroma": "0.12",
			"fontSize": "medium"
		},
		"background": {
			"type": "image",
			"value": "06.webp"
		}
	}'::jsonb,
	false, 3, NOW(), NOW()
),
(
	'hu',
	'Bíbor hajnal',
	'Japán cseresznyevirág tavaszi pompája',
	'{
		"theme": {
			"mode": "dark",
			"modeTaskbarStartMenu": "dark",
			"colorPrimaryHue": "15",
			"colorPrimaryLightness": "0.62",
			"colorPrimaryChroma": "0.12",
			"fontSize": "small"
		},
		"background": {
			"type": "video",
			"value": "04.mp4"
		}
	}'::jsonb,
	false, 3, NOW(), NOW()
)
ON CONFLICT (locale, name) DO UPDATE SET
	description = EXCLUDED.description,
	settings    = EXCLUDED.settings,
	is_default  = EXCLUDED.is_default,
	sort_order  = EXCLUDED.sort_order,
	updated_at  = NOW();

-- English (en)
INSERT INTO platform.theme_presets (locale, name, description, settings, is_default, sort_order, created_at, updated_at) VALUES
(
	'en',
	'Kitsune',
	'Magical colors of the Japanese fox spirit',
	'{
		"theme": {
			"mode": "dark",
			"modeTaskbarStartMenu": "dark",
			"colorPrimaryHue": "50",
			"colorPrimaryLightness": "0.72",
			"colorPrimaryChroma": "0.12",
			"fontSize": "medium"
		},
		"background": {
			"type": "video",
			"value": "02.mp4"
		}
	}'::jsonb,
	false, 5, NOW(), NOW()
),
(
	'en',
	'Smoke',
	'Smoky shades with cold turquoise lights',
	'{
		"theme": {
			"mode": "dark",
			"modeTaskbarStartMenu": "dark",
			"colorPrimaryHue": "185",
			"colorPrimaryLightness": "0.66",
			"colorPrimaryChroma": "0.12",
			"fontSize": "medium"
		},
		"background": {
			"type": "image",
			"value": "05.webp"
		}
	}'::jsonb,
	false, 6, NOW(), NOW()
),
(
	'en',
	'Peaceful Warrior',
	'Harmony of calm strength and inner peace',
	'{
		"theme": {
			"mode": "light",
			"modeTaskbarStartMenu": "dark",
			"colorPrimaryHue": "200",
			"colorPrimaryLightness": "0.55",
			"colorPrimaryChroma": "0.14",
			"fontSize": "medium"
		},
		"background": {
			"type": "video",
			"value": "03.mp4"
		}
	}'::jsonb,
	false, 4, NOW(), NOW()
),
(
	'en',
	'Snow',
	'Crystal clear whiteness of fresh snow',
	'{
		"theme": {
			"mode": "light",
			"modeTaskbarStartMenu": "dark",
			"colorPrimaryHue": "250",
			"colorPrimaryLightness": "0.54",
			"colorPrimaryChroma": "0.14",
			"fontSize": "medium"
		},
		"background": {
			"type": "image",
			"value": "08.webp"
		}
	}'::jsonb,
	false, 1, NOW(), NOW()
),
(
	'en',
	'Midnight',
	'Silent calm of a starless night',
	'{
		"theme": {
			"mode": "dark",
			"modeTaskbarStartMenu": "dark",
			"colorPrimaryHue": "250",
			"colorPrimaryLightness": "0.66",
			"colorPrimaryChroma": "0.12",
			"fontSize": "medium"
		},
		"background": {
			"type": "color",
			"value": "#0d0d0d"
		}
	}'::jsonb,
	false, 2, NOW(), NOW()
),
(
	'en',
	'Sakura',
	'Spring splendor of Japanese cherry blossom',
	'{
		"theme": {
			"mode": "auto",
			"modeTaskbarStartMenu": "dark",
			"colorPrimaryHue": "340",
			"colorPrimaryLightness": "0.66",
			"colorPrimaryChroma": "0.12",
			"fontSize": "medium"
		},
		"background": {
			"type": "image",
			"value": "06.webp"
		}
	}'::jsonb,
	false, 3, NOW(), NOW()
),
(
	'en',
	'Bíbor hajnal',
	'Japán cseresznyevirág tavaszi pompája',
	'{
		"theme": {
			"mode": "dark",
			"modeTaskbarStartMenu": "dark",
			"colorPrimaryHue": "15",
			"colorPrimaryLightness": "0.62",
			"colorPrimaryChroma": "0.12",
			"fontSize": "small"
		},
		"background": {
			"type": "video",
			"value": "04.mp4"
		}
	}'::jsonb,
	false, 3, NOW(), NOW()
)
ON CONFLICT (locale, name) DO UPDATE SET
	description = EXCLUDED.description,
	settings    = EXCLUDED.settings,
	is_default  = EXCLUDED.is_default,
	sort_order  = EXCLUDED.sort_order,
	updated_at  = NOW();

-- ============================================================
-- 6. Admin user email
-- ============================================================
-- Admin user email beállítása
UPDATE auth.users
SET email = 'szig83@gmail.com'
WHERE id = (SELECT id FROM auth.users ORDER BY id ASC LIMIT 1);

COMMIT;
