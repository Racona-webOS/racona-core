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
		/** Reply-To address; when omitted, the system default (SMTP_REPLY_TO) applies. */
		replyTo?: string;
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

/** Metadata of a file stored by the plugin (`context.files`). */
export interface PluginFileInfo {
	/** File ID (UUID) — store this in your own table */
	id: string;
	/** The original file name (only for display and download) */
	originalName: string;
	/** MIME type detected from the file content */
	mimeType: string;
	/** Size in bytes */
	size: number;
	/** SHA-256 hash of the content (hex) */
	sha256: string;
	/** Your own reference, e.g. `'invoice:42'` (no personal data) */
	ref: string | null;
	/** The user who uploaded the file (`null` for scheduled jobs) */
	createdBy: number | null;
	createdAt: Date;
	/** `null` until you call `claim()`; unclaimed uploads are deleted after 24 hours */
	claimedAt: Date | null;
}

/**
 * Error thrown by `context.files`. Check `code` to show your own message.
 *
 * Codes: `FILE_NOT_FOUND`, `PERMISSION_DENIED`, `INVALID_INPUT`, `INVALID_MIME`,
 * `FILE_TOO_LARGE`, `INVALID_TOKEN`, `STORAGE_ERROR`.
 */
export interface PluginFileError extends Error {
	name: 'PluginFileError';
	code:
		| 'FILE_NOT_FOUND'
		| 'PERMISSION_DENIED'
		| 'INVALID_INPUT'
		| 'INVALID_MIME'
		| 'FILE_TOO_LARGE'
		| 'INVALID_TOKEN'
		| 'STORAGE_ERROR';
}

/**
 * File storage of the core. Available with the `file_access` permission.
 *
 * Files are stored on disk, only the metadata is in the database. The plugin
 * decides who may upload or download: create a link only after checking the
 * caller's rights. Supported types: PDF, JPEG, PNG, WEBP, DOCX, XLSX, ODT, ODS
 * (detected from the content). Default size limit: 10 MiB per file.
 *
 * Upload flow: `createUploadUrl()` in a remote function → the browser sends the
 * file with `sdk.files.upload(uploadUrl, file)` → another remote function
 * calls `claim(fileId)` and saves the ID.
 */
export interface PluginFileService {
	/** Store a file generated on the server (e.g. an export). It is claimed right away. */
	save(input: {
		data: Uint8Array;
		fileName: string;
		allowedMimeTypes?: string[];
		maxBytes?: number;
		ref?: string;
	}): Promise<PluginFileInfo>;
	/** Metadata, or `null` if the file does not exist (or belongs to another plugin). */
	get(fileId: string): Promise<PluginFileInfo | null>;
	/** The file content (loads the whole file into memory). */
	read(fileId: string): Promise<Uint8Array>;
	/** Delete the file and its metadata. Deleting a missing file is not an error. */
	delete(fileId: string): Promise<void>;
	/**
	 * Attach an uploaded file to your data. Only the uploader can claim it (in a
	 * scheduled job anyone). Claiming again is allowed.
	 */
	claim(fileId: string, options?: { ref?: string }): Promise<PluginFileInfo>;
	/**
	 * A signed upload link for the calling user (default 5 minutes, max. 15).
	 * Not available in scheduled jobs.
	 */
	createUploadUrl(options: {
		/** Accepted types (a subset of the supported ones) */
		allowedMimeTypes: string[];
		/** Size limit in bytes (at most the core limit) */
		maxBytes?: number;
		ref?: string;
		ttlSeconds?: number;
	}): Promise<{ uploadUrl: string; expiresAt: Date }>;
	/**
	 * A signed download link for the calling user (default 60 seconds, max. 10
	 * minutes). `inline` opens PDFs and images in the browser. Not available in
	 * scheduled jobs.
	 */
	createDownloadUrl(
		fileId: string,
		options?: { disposition?: 'inline' | 'attachment'; ttlSeconds?: number }
	): Promise<{ url: string; expiresAt: Date }>;
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
	/** File storage, with the `file_access` permission */
	files?: PluginFileService;
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
	/** File storage, with the `file_access` permission (no upload/download links here) */
	files?: PluginFileService;
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
