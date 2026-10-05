/**
 * Ütemező konfiguráció — env változókból, alapértékekkel és határokkal.
 * A változók leírása: apps/web/.env.schema, docs/CONFIGURATION.md.
 */

import { env } from '$lib/env';

export interface SchedulerConfig {
	/** Fut-e az ütemező ezen a példányon. */
	enabled: boolean;
	/** Esedékes feladatok lekérdezésének gyakorisága (s). */
	tickSeconds: number;
	/** Az első tick késleltetése induláskor (s). */
	startDelaySeconds: number;
	/** Egyszerre futó feladatok példányonként. */
	maxConcurrent: number;
	/** Alapértelmezett futási időkorlát (s), ha a feladat nem ad meg sajátot. */
	jobTimeoutSeconds: number;
	/** `catchUp: 'skip'` esetén ennyi késés még nem számít kimaradásnak (s). */
	missedGraceSeconds: number;
	/** Alapértelmezett IANA időzóna. */
	defaultTimezone: string;
	/** A futásnapló megőrzése (nap). */
	runRetentionDays: number;
}

/** Egész szám az env-ből, határok közé szorítva; érvénytelen értéknél az alapérték. */
function intFromEnv(value: unknown, fallback: number, min: number, max: number): number {
	if (value === undefined || value === null || value === '') return fallback;
	const n = Number(value);
	if (!Number.isFinite(n)) return fallback;
	return Math.min(max, Math.max(min, Math.round(n)));
}

/** A konfiguráció beolvasása (minden hívásnál friss, a tesztek felülírhatják az env-et). */
export function getSchedulerConfig(): SchedulerConfig {
	const raw = env as unknown as Record<string, unknown>;
	const enabled = raw.SCHEDULER_ENABLED;
	const timezone = raw.SCHEDULER_DEFAULT_TIMEZONE;
	return {
		enabled: enabled !== false && enabled !== 'false',
		tickSeconds: intFromEnv(raw.SCHEDULER_TICK_SECONDS, 30, 5, 3600),
		startDelaySeconds: intFromEnv(raw.SCHEDULER_START_DELAY_SECONDS, 15, 0, 3600),
		maxConcurrent: intFromEnv(raw.SCHEDULER_MAX_CONCURRENT, 2, 1, 20),
		jobTimeoutSeconds: intFromEnv(raw.SCHEDULER_JOB_TIMEOUT_SECONDS, 600, 10, 3600),
		missedGraceSeconds: intFromEnv(raw.SCHEDULER_MISSED_GRACE_SECONDS, 300, 0, 86400),
		defaultTimezone:
			typeof timezone === 'string' && timezone.trim() ? timezone.trim() : 'Europe/Budapest',
		runRetentionDays: intFromEnv(raw.SCHEDULER_RUN_RETENTION_DAYS, 30, 1, 3650)
	};
}
