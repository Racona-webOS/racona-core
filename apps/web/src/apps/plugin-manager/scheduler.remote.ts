/**
 * Ütemezett feladatok — a Plugin kezelő parancsai.
 * Minden művelethez `plugin.scheduler.manage` jogosultság kell.
 */

import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { permissionRepository } from '$lib/server/database/repositories';
import {
	getScheduledJobRun,
	listScheduledJobRuns,
	listScheduledJobs,
	runScheduledJobNow,
	setScheduledJobEnabled
} from '$lib/server/scheduler/admin';
import type { ScheduledJobRunView, ScheduledJobView } from '$lib/server/scheduler/admin';

export type { ScheduledJobRunView, ScheduledJobView };

const MANAGE_PERMISSION = 'plugin.scheduler.manage';

type Result<T> = { success: true; data: T } | { success: false; error: string };

/** A hívó felhasználó azonosítója, ha jogosult; egyébként hibaüzenet. */
async function authorize(): Promise<{ userId: number } | { error: string }> {
	const { locals } = getRequestEvent();
	if (!locals.user?.id) return { error: 'User not authenticated' };
	const userId = parseInt(locals.user.id);
	const permissions = await permissionRepository.findPermissionsForUser(userId);
	if (!permissions.includes(MANAGE_PERMISSION)) {
		return { error: `Insufficient permissions. Requires ${MANAGE_PERMISSION} permission.` };
	}
	return { userId };
}

async function guarded<T>(fn: (userId: number) => Promise<T>): Promise<Result<T>> {
	const auth = await authorize();
	if ('error' in auth) return { success: false, error: auth.error };
	try {
		return { success: true, data: await fn(auth.userId) };
	} catch (err) {
		console.error('[PluginManager] Scheduled job action failed:', err);
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

const jobRefSchema = v.pipe(v.number(), v.integer(), v.minValue(1));

/** Feladatok: összes, egy pluginé (`pluginId`), vagy csak a core feladatok (`pluginId: null`). */
export const fetchScheduledJobs = command(
	v.object({ pluginId: v.optional(v.nullable(v.pipe(v.string(), v.minLength(1)))) }),
	async ({ pluginId }) => guarded(() => listScheduledJobs(pluginId))
);

export const fetchScheduledJobRuns = command(
	v.object({
		jobRef: jobRefSchema,
		limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(200)), 50),
		offset: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0)
	}),
	async ({ jobRef, limit, offset }) => guarded(() => listScheduledJobRuns(jobRef, limit, offset))
);

export const fetchScheduledJobRun = command(
	v.object({ runId: v.pipe(v.number(), v.integer(), v.minValue(1)) }),
	async ({ runId }) => guarded(() => getScheduledJobRun(runId))
);

export const updateScheduledJobEnabled = command(
	v.object({ jobRef: jobRefSchema, enabled: v.boolean() }),
	async ({ jobRef, enabled }) =>
		guarded((userId) => setScheduledJobEnabled(jobRef, enabled, userId))
);

export const runScheduledJob = command(v.object({ jobRef: jobRefSchema }), async ({ jobRef }) =>
	guarded((userId) => runScheduledJobNow(jobRef, userId))
);
