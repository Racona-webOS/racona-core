/**
 * Ütemezett feladatok (plugin és core) és a futásaik naplója.
 *
 * A plugin a manifestjében deklarálja a feladatait (`scheduledJobs`), a core
 * telepítéskor/frissítéskor ide szinkronizálja őket. A core feladatoknál a
 * `plugin_id` NULL. Lásd: .kiro/specs/plugin-scheduler.
 */

import {
	serial,
	bigserial,
	varchar,
	text,
	integer,
	boolean,
	jsonb,
	timestamp,
	index,
	unique,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { platformSchema as schema } from '../schema';
import { apps } from '../apps/apps';
import { users } from '../../auth/users/users';

/** Kimaradt futás kezelése: egyszer pótolja, vagy kihagyja. */
export type ScheduledJobCatchUp = 'once' | 'skip';

/** Mi indította a futást. */
export type ScheduledJobTrigger = 'schedule' | 'manual';

/** Egy futás állapota. */
export type ScheduledJobRunStatus = 'running' | 'success' | 'failed' | 'timeout' | 'skipped';

/** A feladat leírása: egyszerű szöveg vagy nyelvenként. */
export type ScheduledJobDescription = string | Record<string, string>;

/** Egy naplósor a futás `logs` mezőjében. */
export interface ScheduledJobLogLine {
	/** ISO időbélyeg */
	at: string;
	level: 'info' | 'warn' | 'error';
	message: string;
}

export const scheduledJobs = schema.table(
	'scheduled_jobs',
	{
		id: serial('id').primaryKey(),
		// NULL = core feladat
		pluginId: varchar('plugin_id', { length: 255 }).references(() => apps.appId, {
			onDelete: 'cascade'
		}),
		jobId: varchar('job_id', { length: 100 }).notNull(),
		handler: varchar('handler', { length: 100 }).notNull(),
		schedule: varchar('schedule', { length: 100 }).notNull(),
		timezone: varchar('timezone', { length: 64 }).notNull(),
		catchUp: varchar('catch_up', { length: 10 })
			.$type<ScheduledJobCatchUp>()
			.notNull()
			.default('once'),
		timeoutSeconds: integer('timeout_seconds').notNull().default(600),
		description: jsonb('description').$type<ScheduledJobDescription>(),
		enabled: boolean('enabled').notNull().default(true),
		nextRunAt: timestamp('next_run_at', { withTimezone: true }),
		lastRunAt: timestamp('last_run_at', { withTimezone: true }),
		lastStatus: varchar('last_status', { length: 20 }).$type<ScheduledJobRunStatus>(),
		lastError: text('last_error'),
		lastDurationMs: integer('last_duration_ms'),
		consecutiveFailures: integer('consecutive_failures').notNull().default(0),
		failureNotifiedAt: timestamp('failure_notified_at', { withTimezone: true }),
		lockedBy: varchar('locked_by', { length: 100 }),
		lockedUntil: timestamp('locked_until', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		// A core feladatok (plugin_id NULL) is egyediek legyenek
		unique('uq_scheduled_jobs_plugin_job').on(table.pluginId, table.jobId).nullsNotDistinct(),
		index('idx_scheduled_jobs_due').on(table.enabled, table.nextRunAt)
	]
);

export const scheduledJobRuns = schema.table(
	'scheduled_job_runs',
	{
		id: bigserial('id', { mode: 'number' }).primaryKey(),
		jobRef: integer('job_ref')
			.notNull()
			.references(() => scheduledJobs.id, { onDelete: 'cascade' }),
		// Denormalizált, a listázáshoz
		pluginId: varchar('plugin_id', { length: 255 }),
		jobId: varchar('job_id', { length: 100 }).notNull(),
		trigger: varchar('trigger', { length: 10 }).$type<ScheduledJobTrigger>().notNull(),
		triggeredBy: integer('triggered_by').references(() => users.id, { onDelete: 'set null' }),
		// Ütemezett futásnál az esedékesség; kézi futásnál NULL
		scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
		startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
		finishedAt: timestamp('finished_at', { withTimezone: true }),
		status: varchar('status', { length: 20 }).$type<ScheduledJobRunStatus>().notNull(),
		result: jsonb('result'),
		error: text('error'),
		logs: jsonb('logs').$type<ScheduledJobLogLine[]>(),
		instanceId: varchar('instance_id', { length: 100 })
	},
	(table) => [
		// Időpontonként egy ütemezett futás (a kézi futás scheduled_for-ja NULL, nem ütközik)
		uniqueIndex('uq_scheduled_job_runs_slot').on(table.jobRef, table.scheduledFor),
		index('idx_scheduled_job_runs_job_started').on(table.jobRef, table.startedAt),
		index('idx_scheduled_job_runs_started').on(table.startedAt)
	]
);

export type ScheduledJob = typeof scheduledJobs.$inferSelect;
export type NewScheduledJob = typeof scheduledJobs.$inferInsert;
export type ScheduledJobRun = typeof scheduledJobRuns.$inferSelect;
export type NewScheduledJobRun = typeof scheduledJobRuns.$inferInsert;
