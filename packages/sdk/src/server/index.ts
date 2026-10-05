/**
 * @module
 * Type definitions for plugin server code (`server/functions.ts`, `server/jobs.ts`).
 *
 * Types only — the core passes the actual objects to the plugin functions.
 *
 * @example
 * ```ts
 * // server/jobs.ts
 * import type { ScheduledJobHandler } from '@racona/sdk/server';
 *
 * export const runDailyCheck: ScheduledJobHandler = async (params, ctx) => {
 * 	const { rows } = await ctx.db.query('SELECT id FROM app__my_plugin.items WHERE due <= now()');
 * 	ctx.logger.info(`${rows.length} items due`);
 * 	return { summary: `${rows.length} items processed` };
 * };
 * ```
 */

// ─── Shared services ────────────────────────────────────────────

/** Result of a database query (the subset of the `pg` result the plugins use). */
export interface PluginQueryResult<Row = Record<string, unknown>> {
	rows: Row[];
	rowCount: number | null;
}

/** A dedicated connection for transactions (`BEGIN` / `COMMIT` / `ROLLBACK`). Release it when done. */
export interface PluginDbClient {
	query<Row = Record<string, unknown>>(
		sql: string,
		params?: unknown[]
	): Promise<PluginQueryResult<Row>>;
	release(): void;
}

/** The shared `pg` pool of the core (not limited to the plugin schema). */
export interface PluginDb {
	query<Row = Record<string, unknown>>(
		sql: string,
		params?: unknown[]
	): Promise<PluginQueryResult<Row>>;
	connect(): Promise<PluginDbClient>;
}

/** Localized text, e.g. `{ hu: '…', en: '…' }`. */
export type LocalizedString = { hu: string; en: string; [locale: string]: string };

/**
 * Sends a templated email through the core. Available with the `notifications`
 * permission. The template name is prefixed with the plugin ID automatically.
 */
export interface PluginEmailService {
	send(params: {
		to: string | string[];
		template: string;
		data: Record<string, unknown>;
		locale?: string;
	}): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * Sends an in-app notification to named users. Available with the
 * `notifications` permission.
 */
export interface PluginNotificationService {
	send(params: {
		userId?: number;
		userIds?: number[];
		title: string | LocalizedString;
		message: string | LocalizedString;
		type?: 'info' | 'success' | 'warning' | 'error' | 'critical';
		data?: Record<string, unknown>;
	}): Promise<{ success: boolean; error?: string }>;
}

// ─── Remote functions ───────────────────────────────────────────

/** Context of a remote function (`server/functions.ts`), called by a signed-in user. */
export interface RemoteFunctionContext {
	pluginId: string;
	/** The calling user (the core sends it as a string, e.g. `"12"`) */
	userId: string;
	db: PluginDb;
	/** Core permissions of the caller; contains `'admin'` for system administrators */
	permissions: string[];
	/** Permissions of the plugin manifest */
	pluginPermissions: string[];
	email?: PluginEmailService;
	notifications?: PluginNotificationService;
}

// ─── Scheduled jobs ─────────────────────────────────────────────

/** What started a scheduled job run. */
export type ScheduledJobTrigger = 'schedule' | 'manual';

/** Parameters of a scheduled job handler. */
export interface ScheduledJobParams {
	/** The job ID from the manifest */
	jobId: string;
	/** ID of this run in the run history */
	runId: number;
	/** ISO timestamp: the due time; for a manual run the time it was started */
	scheduledFor: string;
	trigger: ScheduledJobTrigger;
}

/** Log lines end up in the run history shown in the Plugin Manager. */
export interface ScheduledJobLogger {
	info(message: string): void;
	warn(message: string): void;
	error(message: string): void;
}

/**
 * Context of a scheduled job handler (`server/jobs.ts`).
 *
 * There is no calling user: `userId` is `null` and `permissions` is empty, so
 * functions that check the caller's rights cannot be reused as they are.
 */
export interface ScheduledJobContext {
	pluginId: string;
	userId: null;
	trigger: ScheduledJobTrigger;
	/** The user who started a manual run, otherwise `null` */
	triggeredBy: number | null;
	db: PluginDb;
	permissions: [];
	pluginPermissions: string[];
	email?: PluginEmailService;
	notifications?: PluginNotificationService;
	logger: ScheduledJobLogger;
	/** Aborted when the job exceeds its timeout — check it in long loops */
	signal: AbortSignal;
}

/** Optional return value, stored in the run history (max. 16 KB JSON). */
export interface ScheduledJobResult {
	summary?: string;
	data?: Record<string, unknown>;
}

/**
 * A scheduled job handler, exported from `server/jobs.ts` and declared in the
 * manifest (`scheduledJobs[].handler`).
 *
 * A run happens at most once per due time. Write handlers so that they catch up
 * on everything that is due and not yet done, instead of assuming they run at
 * an exact moment.
 */
export type ScheduledJobHandler = (
	params: ScheduledJobParams,
	context: ScheduledJobContext
) => Promise<ScheduledJobResult | void>;

/** A scheduled job declaration in `manifest.json` (requires the `scheduler` permission). */
export interface ManifestScheduledJob {
	/** Job ID within the plugin (kebab-case, 3–50 characters) */
	id: string;
	/** Name of the exported function in `server/jobs.ts` */
	handler: string;
	/** 5-field cron expression, e.g. `"0 7 * * *"` (at least 5 minutes between runs) */
	schedule: string;
	/** IANA timezone (default: the core's SCHEDULER_DEFAULT_TIMEZONE, `Europe/Budapest`) */
	timezone?: string;
	description?: string | Record<string, string>;
	/** Timeout in seconds (10–3600, default 600) */
	timeoutSeconds?: number;
	/** Missed run (e.g. the server was down): run once on start-up (`'once'`, default) or skip it */
	catchUp?: 'once' | 'skip';
}
