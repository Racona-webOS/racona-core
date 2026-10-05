/**
 * Rendszer-kontextus a job handlereknek és a futásnapló gyűjtése.
 */

import type { ScheduledJobLogLine, ScheduledJobTrigger } from '@racona/database';
import {
	createPluginDb,
	createPluginEmailService,
	createPluginNotificationService
} from '$lib/server/plugins/runtime/services';
import type { JobContext, JobLogger } from './types';

/** Egy futás legfeljebb ennyi naplósort tárol. */
export const MAX_LOG_LINES = 200;
/** Egy naplósor legfeljebb ilyen hosszú. */
export const MAX_LOG_LINE_LENGTH = 1000;
/** A handler eredménye (JSON) legfeljebb ekkora lehet. */
export const MAX_RESULT_BYTES = 16 * 1024;

export interface RunLogger extends JobLogger {
	lines(): ScheduledJobLogLine[];
}

/**
 * Naplógyűjtő: a sorok a futás `logs` mezőjébe kerülnek, és a konzolra is
 * kiíródnak `[Scheduler] <prefix>` előtaggal.
 */
export function createRunLogger(prefix: string): RunLogger {
	const lines: ScheduledJobLogLine[] = [];
	let dropped = 0;
	const push = (level: ScheduledJobLogLine['level'], message: unknown) => {
		const text = String(message ?? '');
		const consoleFn =
			level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
		consoleFn(`[Scheduler] ${prefix}: ${text}`);
		if (lines.length >= MAX_LOG_LINES) {
			dropped++;
			return;
		}
		lines.push({
			at: new Date().toISOString(),
			level,
			message: text.length > MAX_LOG_LINE_LENGTH ? `${text.slice(0, MAX_LOG_LINE_LENGTH)}…` : text
		});
	};
	return {
		info: (message) => push('info', message),
		warn: (message) => push('warn', message),
		error: (message) => push('error', message),
		lines: () =>
			dropped > 0
				? [
						...lines,
						{
							at: new Date().toISOString(),
							level: 'warn',
							message: `${dropped} more log lines dropped`
						}
					]
				: [...lines]
	};
}

/** A handler visszatérési értéke a futásnaplóba: `{ summary?, data? }`, méretkorláttal. */
export function normalizeJobResult(value: unknown): Record<string, unknown> | null {
	if (value === undefined || value === null || typeof value !== 'object') return null;
	const raw = value as Record<string, unknown>;
	const result: Record<string, unknown> = {};
	if (typeof raw.summary === 'string') result.summary = raw.summary.slice(0, MAX_LOG_LINE_LENGTH);
	if (raw.data && typeof raw.data === 'object') result.data = raw.data;
	if (Object.keys(result).length === 0) return null;
	let json: string;
	try {
		json = JSON.stringify(result);
	} catch {
		return { summary: result.summary ?? null, truncated: true };
	}
	if (Buffer.byteLength(json, 'utf8') > MAX_RESULT_BYTES) {
		return { summary: result.summary ?? null, truncated: true };
	}
	return result;
}

/** A plugin (vagy core: `pluginId = null`) handlerének kontextusa. */
export function createSystemContext(params: {
	pluginId: string | null;
	pluginPermissions: string[];
	trigger: ScheduledJobTrigger;
	triggeredBy: number | null;
	logger: JobLogger;
	signal: AbortSignal;
}): JobContext {
	const { pluginId, pluginPermissions } = params;
	const email = pluginId ? createPluginEmailService(pluginId, pluginPermissions) : undefined;
	const notifications = pluginId
		? createPluginNotificationService(pluginId, pluginPermissions)
		: undefined;
	return {
		pluginId,
		userId: null,
		trigger: params.trigger,
		triggeredBy: params.triggeredBy,
		db: createPluginDb(),
		permissions: [],
		pluginPermissions,
		...(email ? { email } : {}),
		...(notifications ? { notifications } : {}),
		logger: params.logger,
		signal: params.signal
	};
}
