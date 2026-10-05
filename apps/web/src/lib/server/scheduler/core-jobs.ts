/**
 * Core karbantartó feladatok — kódból regisztrálva (`plugin_id IS NULL`),
 * ugyanazzal a lefoglalással, naplózással és admin felülettel, mint a plugin feladatok.
 */

import { EmailLogger } from '$lib/server/email/logger';
import { cleanupOldBackups, cleanupTempFiles } from '$lib/server/plugins/utils/filesystem';
import { getSchedulerConfig } from './config';
import { deleteOldRuns, markInterruptedRuns } from './repository';
import type { JobDefinition } from './registry';
import type { JobHandler } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface CoreJob extends Omit<JobDefinition, 'handler' | 'timezone'> {
	run: JobHandler;
}

export const CORE_JOBS: CoreJob[] = [
	{
		jobId: 'core.scheduler-runs-cleanup',
		schedule: '15 3 * * *',
		catchUp: 'once',
		timeoutSeconds: 300,
		description: {
			hu: 'Régi ütemezett futások törlése a naplóból',
			en: 'Delete old scheduled job runs from the log'
		},
		run: async (_params, ctx) => {
			const interrupted = await markInterruptedRuns();
			const days = getSchedulerConfig().runRetentionDays;
			const deleted = await deleteOldRuns(days);
			if (interrupted > 0) ctx.logger.warn(`${interrupted} interrupted runs closed`);
			return {
				summary: `${deleted} runs older than ${days} days deleted`,
				data: { deleted, interrupted }
			};
		}
	},
	{
		jobId: 'core.email-logs-cleanup',
		schedule: '30 3 * * *',
		catchUp: 'once',
		timeoutSeconds: 300,
		description: {
			hu: '90 napnál régebbi email naplók törlése',
			en: 'Delete email logs older than 90 days'
		},
		run: async () => {
			const deleted = await new EmailLogger().cleanupOldLogs(90);
			return { summary: `${deleted} email log entries deleted`, data: { deleted } };
		}
	},
	{
		jobId: 'core.plugin-temp-cleanup',
		schedule: '45 3 * * *',
		catchUp: 'once',
		timeoutSeconds: 300,
		description: {
			hu: 'Félbehagyott plugin feltöltések törlése (7 nap után)',
			en: 'Delete abandoned plugin uploads (after 7 days)'
		},
		run: async () => {
			await cleanupTempFiles(7 * DAY_MS);
			return { summary: 'Plugin temp files older than 7 days removed' };
		}
	},
	{
		jobId: 'core.plugin-backups-cleanup',
		schedule: '0 4 * * *',
		catchUp: 'once',
		timeoutSeconds: 300,
		description: {
			hu: 'Plugin frissítési mentések törlése (7 nap után)',
			en: 'Delete plugin update backups (after 7 days)'
		},
		run: async () => {
			await cleanupOldBackups(7 * DAY_MS);
			return { summary: 'Plugin backups older than 7 days removed' };
		}
	}
];

/** A core feladatok mentésre kész definíciói (a handler neve a jobId). */
export function coreJobDefinitions(): JobDefinition[] {
	const timezone = getSchedulerConfig().defaultTimezone;
	return CORE_JOBS.map((job) => ({
		jobId: job.jobId,
		handler: job.jobId,
		schedule: job.schedule,
		timezone,
		catchUp: job.catchUp,
		timeoutSeconds: job.timeoutSeconds,
		description: job.description
	}));
}

export function findCoreJobHandler(handler: string): JobHandler | null {
	return CORE_JOBS.find((job) => job.jobId === handler)?.run ?? null;
}
