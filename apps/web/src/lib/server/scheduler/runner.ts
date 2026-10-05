/**
 * Az ütemező futtatója: tick ciklus, lefoglalás, végrehajtás, naplózás.
 *
 * Folyamaton belül fut (nincs rendszer-cron): `tickSeconds`-onként lekérdezi az
 * esedékes feladatokat az adatbázisból, lefoglalja őket (SKIP LOCKED + lease),
 * a következő esedékességre lépteti, majd rendszer-kontextusban meghívja a
 * handlert. Egy feladat hibája nem állítja meg a ciklust.
 */

import { hostname } from 'os';
import { randomBytes } from 'crypto';
import { PluginErrorCode } from '@racona/database';
import type { ScheduledJobRunStatus, ScheduledJobTrigger } from '@racona/database';
import { captureServerException } from '$lib/monitoring/server';
import { sendNotification } from '$lib/server/socket';
import { ensureEmailService, ensureSocketIO } from '$lib/server/startup';
import { getSchedulerConfig, type SchedulerConfig } from './config';
import { createRunLogger, createSystemContext, normalizeJobResult } from './context';
import { coreJobDefinitions, findCoreJobHandler } from './core-jobs';
import { loadJobHandler } from './loader';
import { planRun } from './planning';
import { reconcileInstalledPlugins, syncCoreJobs } from './registry';
import {
	advanceAndInsertRun,
	claimDueJobs,
	finishRun,
	findSystemAdminUserIds,
	findUserIdsWithPermission,
	getPluginPermissions,
	insertManualRun,
	markFailureNotified,
	markInterruptedRuns,
	releaseLease,
	tryAcquireLease,
	updateJobAfterRun,
	type JobRecord
} from './repository';
import type { JobHandler, JobParams } from './types';

/** Ennyi egymást követő hiba után kap értesítést az adminisztrátor. */
export const FAILURE_NOTIFY_THRESHOLD = 3;

/** Az ütemezett feladatok kezelésének jogosultsága. */
export const SCHEDULER_MANAGE_PERMISSION = 'plugin.scheduler.manage';

class JobTimeoutError extends Error {
	constructor(seconds: number) {
		super(`${PluginErrorCode.JOB_TIMEOUT}: The job did not finish within ${seconds} seconds`);
	}
}

export class SchedulerError extends Error {
	constructor(
		readonly code: PluginErrorCode,
		message: string
	) {
		super(`${code}: ${message}`);
	}
}

export class Scheduler {
	readonly instanceId = `${hostname()}:${process.pid}:${randomBytes(3).toString('hex')}`;
	private config: SchedulerConfig = getSchedulerConfig();
	private timer: ReturnType<typeof setTimeout> | null = null;
	private stopping = false;
	private started = false;
	private ticking = false;
	private readonly running = new Set<Promise<void>>();

	/** Fut-e a tick ciklus ezen a példányon. */
	get isRunning(): boolean {
		return this.started && !this.stopping;
	}

	/**
	 * Indítás: megszakadt futások lezárása, core feladatok és plugin feladatok
	 * egyeztetése, majd az első tick a beállított késleltetéssel.
	 */
	async start(): Promise<void> {
		if (this.started) return;
		this.config = getSchedulerConfig();
		if (!this.config.enabled) {
			console.log('[Scheduler] Disabled (SCHEDULER_ENABLED=false)');
			return;
		}
		this.started = true;
		try {
			const interrupted = await markInterruptedRuns();
			if (interrupted > 0) console.warn(`[Scheduler] ${interrupted} interrupted runs closed`);
			await syncCoreJobs(coreJobDefinitions());
			await reconcileInstalledPlugins();
		} catch (err) {
			// Pl. a migráció még nem futott le — a ciklus ettől még indul, később újrapróbál
			console.error('[Scheduler] Startup synchronisation failed:', err);
			captureServerException(err, { area: 'scheduler', phase: 'start' });
		}
		if (this.stopping) return;
		console.log(
			`[Scheduler] Started (${this.instanceId}), tick: ${this.config.tickSeconds}s, first tick in ${this.config.startDelaySeconds}s`
		);
		this.scheduleTick(this.config.startDelaySeconds * 1000);
	}

	/** Leállítás: új feladat nem indul, a futókra legfeljebb `timeoutMs`-ig vár. */
	async stop(timeoutMs = 10_000): Promise<void> {
		this.stopping = true;
		if (this.timer) clearTimeout(this.timer);
		this.timer = null;
		if (this.running.size === 0) return;
		await Promise.race([
			Promise.allSettled([...this.running]),
			new Promise((resolve) => setTimeout(resolve, timeoutMs))
		]);
	}

	private scheduleTick(delayMs: number): void {
		if (this.stopping) return;
		this.timer = setTimeout(() => {
			void this.tick().finally(() => this.scheduleTick(this.config.tickSeconds * 1000));
		}, delayMs);
		// A időzítő ne tartsa életben a folyamatot (pl. tesztek, leállás)
		this.timer.unref?.();
	}

	/** Egy kör: az esedékes feladatok lefoglalása és elindítása. */
	async tick(): Promise<void> {
		if (this.stopping || this.ticking) return;
		this.ticking = true;
		try {
			const free = this.config.maxConcurrent - this.running.size;
			if (free <= 0) return;
			const jobs = await claimDueJobs(this.instanceId, free);
			for (const job of jobs) {
				await this.dispatch(job);
			}
		} catch (err) {
			console.error('[Scheduler] Tick failed:', err);
			captureServerException(err, { area: 'scheduler', phase: 'tick' });
		} finally {
			this.ticking = false;
		}
	}

	/** Egy lefoglalt feladat: léptetés, futás rögzítése, indítás (vagy kihagyás). */
	private async dispatch(job: JobRecord): Promise<void> {
		try {
			if (!job.nextRunAt) {
				await releaseLease(job.id, this.instanceId);
				return;
			}
			const plan = planRun(
				{
					schedule: job.schedule,
					timezone: job.timezone,
					catchUp: job.catchUp,
					nextRunAt: job.nextRunAt
				},
				new Date(),
				this.config.missedGraceSeconds
			);
			const status = plan.action === 'skip' ? 'skipped' : 'running';
			const runId = await advanceAndInsertRun(job, { ...plan, status }, this.instanceId);
			if (runId === null || plan.action === 'skip') {
				// Erre az időpontra már futott (vagy kihagyjuk): nincs végrehajtás
				await releaseLease(job.id, this.instanceId);
				return;
			}
			this.track(this.execute(job, runId, 'schedule', null, plan.scheduledFor));
		} catch (err) {
			console.error(`[Scheduler] Dispatch failed for ${jobLabel(job)}:`, err);
			captureServerException(err, { area: 'scheduler', phase: 'dispatch', jobRef: job.id });
			await releaseLease(job.id, this.instanceId).catch(() => {});
		}
	}

	/**
	 * Kézi futtatás az admin felületről. A következő esedékesség nem változik.
	 *
	 * @returns A futás azonosítója; a végrehajtás a háttérben folytatódik.
	 */
	async runNow(jobRef: number, userId: number | null): Promise<number> {
		const job = await tryAcquireLease(jobRef, this.instanceId);
		if (!job) {
			throw new SchedulerError(PluginErrorCode.JOB_ALREADY_RUNNING, 'The job is already running');
		}
		try {
			const runId = await insertManualRun(job, userId, this.instanceId);
			this.track(this.execute(job, runId, 'manual', userId, new Date()));
			return runId;
		} catch (err) {
			await releaseLease(job.id, this.instanceId).catch(() => {});
			throw err;
		}
	}

	private track(promise: Promise<void>): void {
		this.running.add(promise);
		void promise.finally(() => this.running.delete(promise));
	}

	/** A handler futtatása időkorláttal, majd a futás és a feladat lezárása. */
	private async execute(
		job: JobRecord,
		runId: number,
		trigger: ScheduledJobTrigger,
		triggeredBy: number | null,
		scheduledFor: Date
	): Promise<void> {
		const label = jobLabel(job);
		const logger = createRunLogger(label);
		const controller = new AbortController();
		const startedAt = Date.now();
		let status: ScheduledJobRunStatus = 'success';
		let result: Record<string, unknown> | null = null;
		let errorMessage: string | null = null;
		let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

		try {
			await ensureEmailService();
			ensureSocketIO();

			const handler = await this.resolveHandler(job);
			const pluginPermissions = job.pluginId ? await getPluginPermissions(job.pluginId) : [];
			const context = createSystemContext({
				pluginId: job.pluginId,
				pluginPermissions,
				trigger,
				triggeredBy,
				logger,
				signal: controller.signal
			});
			const params: JobParams = {
				jobId: job.jobId,
				runId,
				scheduledFor: scheduledFor.toISOString(),
				trigger
			};

			const value = await Promise.race([
				handler(params, context),
				new Promise<never>((_, reject) => {
					timeoutHandle = setTimeout(
						() => reject(new JobTimeoutError(job.timeoutSeconds)),
						job.timeoutSeconds * 1000
					);
				})
			]);
			result = normalizeJobResult(value);
		} catch (err) {
			if (err instanceof JobTimeoutError) {
				status = 'timeout';
				controller.abort(err);
			} else {
				status = 'failed';
			}
			errorMessage = err instanceof Error ? err.message : String(err);
			logger.error(errorMessage);
			if (status === 'failed') {
				captureServerException(err, { area: 'scheduler', jobRef: job.id, pluginId: job.pluginId });
			}
		} finally {
			if (timeoutHandle) clearTimeout(timeoutHandle);
		}

		const durationMs = Date.now() - startedAt;
		try {
			await finishRun(runId, { status, result, error: errorMessage, logs: logger.lines() });
			const updated = await updateJobAfterRun(job.id, this.instanceId, {
				status,
				error: errorMessage,
				durationMs
			});
			if (updated) await this.notifyRepeatedFailure(updated);
		} catch (err) {
			console.error(`[Scheduler] Failed to record the run of ${label}:`, err);
			captureServerException(err, { area: 'scheduler', phase: 'finish', jobRef: job.id });
		}
	}

	private async resolveHandler(job: JobRecord): Promise<JobHandler> {
		if (job.pluginId) return loadJobHandler(job.pluginId, job.handler);
		const handler = findCoreJobHandler(job.handler);
		if (!handler) throw new Error(`Unknown core job: ${job.handler}`);
		return handler;
	}

	/** Ismétlődő hiba után egyszeri értesítés az ütemezett feladatok kezelőinek. */
	private async notifyRepeatedFailure(job: JobRecord): Promise<void> {
		if (job.consecutiveFailures < FAILURE_NOTIFY_THRESHOLD || job.failureNotifiedAt) return;
		try {
			const userIds = [
				...new Set([
					...(await findUserIdsWithPermission(SCHEDULER_MANAGE_PERMISSION)),
					...(await findSystemAdminUserIds())
				])
			];
			if (userIds.length > 0) {
				const label = jobLabel(job);
				await sendNotification({
					userIds,
					appName: 'plugin-manager',
					title: {
						hu: 'Ismétlődő hiba egy ütemezett feladatban',
						en: 'Scheduled job keeps failing'
					},
					message: {
						hu: `A(z) ${label} feladat ${job.consecutiveFailures} egymást követő futása sikertelen volt. Utolsó hiba: ${job.lastError ?? '—'}`,
						en: `The last ${job.consecutiveFailures} runs of ${label} failed. Last error: ${job.lastError ?? '—'}`
					},
					type: 'error',
					data: { scheduledJobRef: job.id, pluginId: job.pluginId, jobId: job.jobId }
				});
			}
			await markFailureNotified(job.id);
		} catch (err) {
			console.error(`[Scheduler] Failure notification failed for ${jobLabel(job)}:`, err);
		}
	}
}

export function jobLabel(job: Pick<JobRecord, 'pluginId' | 'jobId'>): string {
	return job.pluginId ? `${job.pluginId}/${job.jobId}` : job.jobId;
}
