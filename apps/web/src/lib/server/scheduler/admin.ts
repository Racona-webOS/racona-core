/**
 * Ütemezett feladatok — adminisztrációs műveletek (Plugin kezelő).
 * A jogosultság-ellenőrzés a hívó (remote command) feladata.
 */

import { PluginErrorCode } from '@racona/database';
import type {
	ScheduledJobDescription,
	ScheduledJobLogLine,
	ScheduledJobRunStatus,
	ScheduledJobTrigger
} from '@racona/database';
import { activityLogService } from '$lib/server/activity-log/service';
import { nextSlot } from './cron';
import {
	getJob,
	getRun,
	listJobs,
	listRuns,
	setJobEnabled,
	type JobRecord,
	type RunRecord
} from './repository';
import { getScheduler, startScheduler } from './index';
import { jobLabel, Scheduler, SchedulerError } from './runner';

/** Egy feladat a felületnek (szerializálható). */
export interface ScheduledJobView {
	id: number;
	pluginId: string | null;
	jobId: string;
	handler: string;
	schedule: string;
	timezone: string;
	description: ScheduledJobDescription | null;
	enabled: boolean;
	nextRunAt: string | null;
	lastRunAt: string | null;
	lastStatus: ScheduledJobRunStatus | null;
	lastError: string | null;
	lastDurationMs: number | null;
	consecutiveFailures: number;
	/** Érvényes lease van rajta (éppen fut) */
	running: boolean;
}

/** Egy futás a felületnek (szerializálható). */
export interface ScheduledJobRunView {
	id: number;
	jobRef: number;
	trigger: ScheduledJobTrigger;
	triggeredByName: string | null;
	scheduledFor: string | null;
	startedAt: string;
	finishedAt: string | null;
	durationMs: number | null;
	status: ScheduledJobRunStatus;
	summary: string | null;
	result: unknown;
	error: string | null;
	logs: ScheduledJobLogLine[];
}

const iso = (value: Date | null): string | null => (value ? new Date(value).toISOString() : null);

function toJobView(job: JobRecord, now = new Date()): ScheduledJobView {
	return {
		id: job.id,
		pluginId: job.pluginId,
		jobId: job.jobId,
		handler: job.handler,
		schedule: job.schedule,
		timezone: job.timezone,
		description: job.description,
		enabled: job.enabled,
		nextRunAt: iso(job.nextRunAt),
		lastRunAt: iso(job.lastRunAt),
		lastStatus: job.lastStatus,
		lastError: job.lastError,
		lastDurationMs: job.lastDurationMs,
		consecutiveFailures: job.consecutiveFailures,
		running: !!job.lockedUntil && new Date(job.lockedUntil) > now
	};
}

function toRunView(run: RunRecord): ScheduledJobRunView {
	const result = run.result as { summary?: unknown } | null;
	return {
		id: run.id,
		jobRef: run.jobRef,
		trigger: run.trigger,
		triggeredByName: run.triggeredByName,
		scheduledFor: iso(run.scheduledFor),
		startedAt: new Date(run.startedAt).toISOString(),
		finishedAt: iso(run.finishedAt),
		durationMs: run.finishedAt
			? new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()
			: null,
		status: run.status,
		summary: typeof result?.summary === 'string' ? result.summary : null,
		result: run.result,
		error: run.error,
		logs: run.logs
	};
}

/** Feladatok: összes, egy pluginé, vagy (`null`) csak a core feladatok. */
export async function listScheduledJobs(pluginId?: string | null): Promise<ScheduledJobView[]> {
	const now = new Date();
	return (await listJobs(pluginId)).map((job) => toJobView(job, now));
}

export async function listScheduledJobRuns(
	jobRef: number,
	limit = 50,
	offset = 0
): Promise<ScheduledJobRunView[]> {
	return (await listRuns(jobRef, Math.min(Math.max(limit, 1), 200), Math.max(offset, 0))).map(
		toRunView
	);
}

export async function getScheduledJobRun(runId: number): Promise<ScheduledJobRunView | null> {
	const run = await getRun(runId);
	return run ? toRunView(run) : null;
}

/** Ki/bekapcsolás; bekapcsoláskor a következő esedékesség a most utáni első időpont. */
export async function setScheduledJobEnabled(
	jobRef: number,
	enabled: boolean,
	userId: number
): Promise<ScheduledJobView> {
	const job = await getJob(jobRef);
	if (!job) throw new SchedulerError(PluginErrorCode.JOB_NOT_FOUND, 'Scheduled job not found');
	const nextRunAt = enabled ? nextSlot(job.schedule, job.timezone, new Date()) : null;
	const updated = await setJobEnabled(jobRef, enabled, nextRunAt);
	if (!updated) throw new SchedulerError(PluginErrorCode.JOB_NOT_FOUND, 'Scheduled job not found');
	void activityLogService.log({
		actionKey: enabled ? 'scheduler.job.enabled' : 'scheduler.job.disabled',
		userId: String(userId),
		resourceType: 'scheduled_job',
		resourceId: String(jobRef),
		context: { job: jobLabel(job) }
	});
	return toJobView(updated);
}

/**
 * Azonnali futtatás. A futás a háttérben folytatódik; a visszaadott
 * azonosítóval a futás állapota lekérdezhető.
 */
export async function runScheduledJobNow(
	jobRef: number,
	userId: number
): Promise<{ runId: number }> {
	const job = await getJob(jobRef);
	if (!job) throw new SchedulerError(PluginErrorCode.JOB_NOT_FOUND, 'Scheduled job not found');
	// Kikapcsolt ütemezőnél (SCHEDULER_ENABLED=false) is futtatható kézzel
	const scheduler: Scheduler = getScheduler() ?? startScheduler() ?? new Scheduler();
	const runId = await scheduler.runNow(jobRef, userId);
	void activityLogService.log({
		actionKey: 'scheduler.job.run',
		userId: String(userId),
		resourceType: 'scheduled_job',
		resourceId: String(jobRef),
		context: { job: jobLabel(job), runId }
	});
	return { runId };
}
