/**
 * Ütemező — a job handlereknek átadott paraméterek és kontextus.
 * A pluginok ugyanezt a formát kapják (`@racona/sdk/server` típusai).
 */

import type { ScheduledJobTrigger } from '@racona/database';
import type {
	PluginDb,
	PluginEmailService,
	PluginNotificationService
} from '$lib/server/plugins/runtime/services';
import type { PluginFileService } from '$lib/server/plugins/files';

export interface JobParams {
	jobId: string;
	runId: number;
	/** ISO időbélyeg: az esedékesség; kézi futásnál az indítás ideje */
	scheduledFor: string;
	trigger: ScheduledJobTrigger;
}

export interface JobLogger {
	info(message: string): void;
	warn(message: string): void;
	error(message: string): void;
}

export interface JobContext {
	pluginId: string | null;
	/** Ütemezett futásnak nincs hívó felhasználója */
	userId: null;
	trigger: ScheduledJobTrigger;
	/** Kézi indításnál az indító felhasználó */
	triggeredBy: number | null;
	db: PluginDb;
	/** Nincs felhasználói jogosultság */
	permissions: [];
	pluginPermissions: string[];
	email?: PluginEmailService;
	notifications?: PluginNotificationService;
	/** Csak `file_access` joggal; fel- és letöltési link itt nem kérhető */
	files?: PluginFileService;
	logger: JobLogger;
	/** Időtúllépéskor abortál */
	signal: AbortSignal;
}

export interface JobResult {
	summary?: string;
	data?: Record<string, unknown>;
}

export type JobHandler = (params: JobParams, context: JobContext) => Promise<JobResult | void>;
