// @vitest-environment node
/**
 * Integrációs teszt valódi PostgreSQL-lel (.kiro/specs/plugin-scheduler, 4.2–4.5, 6.1–6.3, 7.5, 7.6;
 * Property 1, 4, 5).
 *
 * Csak akkor fut, ha SCHEDULER_IT=1, és a DATABASE_URL (vagy a ../../.env.local)
 * egy olyan adatbázisra mutat, amelyen a 0008_scheduler migráció lefutott:
 *
 *   SCHEDULER_IT=1 bunx vitest --run src/lib/server/scheduler/__tests__/scheduler.integration.test.ts
 *
 * Egy ideiglenes `scheduler-it` plugint hoz létre (apps sor + server/jobs.js egy
 * temp mappában), és a végén törli.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { config as loadEnv } from 'dotenv';
import type { PluginManifest } from '@racona/database';

const RUN = process.env.SCHEDULER_IT === '1';
const PLUGIN_ID = 'scheduler-it';
const pluginsRoot = mkdtempSync(path.join(tmpdir(), 'racona-scheduler-it-'));

vi.mock('$lib/server/plugins/utils/filesystem', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/server/plugins/utils/filesystem')>()),
	getPluginDir: (pluginId: string) => path.join(pluginsRoot, pluginId)
}));
vi.mock('$lib/server/startup', () => ({
	ensureEmailService: async () => {},
	ensureSocketIO: () => {},
	ensureI18n: async () => {}
}));
vi.mock('$lib/server/socket', () => ({ sendNotification: vi.fn(async () => []) }));
vi.mock('$lib/monitoring/server', () => ({ captureServerException: () => {} }));
vi.mock('$app/environment', () => ({ building: false, dev: true, browser: false }));

const JOBS_JS = `
export async function okJob(params, ctx) {
	globalThis.__schedulerIt.calls.push({ ...params, userId: ctx.userId, hasDb: typeof ctx.db.query === 'function' });
	ctx.logger.info('hello from okJob');
	return { summary: 'ok', data: { n: 1 } };
}
export async function slowJob() {
	await new Promise((r) => setTimeout(r, 500));
	return { summary: 'slow done' };
}
export async function failJob() {
	throw new Error('boom');
}
`;

const manifest = (jobs: Array<{ id: string; handler: string; schedule?: string }>) =>
	({
		id: PLUGIN_ID,
		name: 'Scheduler IT',
		version: '1.0.0',
		description: 'test',
		author: 'test',
		entry: 'dist/index.js',
		icon: 'icon.svg',
		permissions: ['scheduler'],
		scheduledJobs: jobs.map((j) => ({ schedule: '0 6 * * *', ...j }))
	}) as PluginManifest;

type Pool = import('pg').Pool;

describe.skipIf(!RUN)('scheduler (integration)', () => {
	let pool: Pool;
	let registry: typeof import('../registry');
	let repo: typeof import('../repository');
	let runnerModule: typeof import('../runner');

	const shared = globalThis as typeof globalThis & { __schedulerIt?: { calls: unknown[] } };
	const calls = shared.__schedulerIt?.calls ?? [];
	shared.__schedulerIt = { calls };

	async function jobRef(jobId: string): Promise<number> {
		const r = await pool.query(
			`SELECT id FROM platform.scheduled_jobs WHERE plugin_id = $1 AND job_id = $2`,
			[PLUGIN_ID, jobId]
		);
		return r.rows[0].id;
	}

	async function makeDue(jobId: string): Promise<void> {
		await pool.query(
			`UPDATE platform.scheduled_jobs SET next_run_at = now() - interval '1 second', locked_by = NULL, locked_until = NULL
			  WHERE plugin_id = $1 AND job_id = $2`,
			[PLUGIN_ID, jobId]
		);
	}

	async function waitForRuns(ref: number, count: number, timeoutMs = 5000) {
		const start = Date.now();
		while (Date.now() - start < timeoutMs) {
			const r = await pool.query(
				`SELECT * FROM platform.scheduled_job_runs WHERE job_ref = $1 AND status <> 'running' ORDER BY id`,
				[ref]
			);
			if (r.rows.length >= count) return r.rows;
			await new Promise((res) => setTimeout(res, 50));
		}
		throw new Error('timeout waiting for runs');
	}

	beforeAll(async () => {
		loadEnv({ path: path.resolve(__dirname, '../../../../../../../.env.local'), quiet: true });
		process.env.SCHEDULER_TICK_SECONDS = '5';

		const dir = path.join(pluginsRoot, PLUGIN_ID, 'server');
		mkdirSync(dir, { recursive: true });
		writeFileSync(path.join(dir, 'jobs.js'), JOBS_JS);
		writeFileSync(path.join(pluginsRoot, PLUGIN_ID, 'manifest.json'), JSON.stringify(manifest([])));

		pool = (await import('$lib/server/database')).client;
		registry = await import('../registry');
		repo = await import('../repository');
		runnerModule = await import('../runner');

		await pool.query(`DELETE FROM platform.apps WHERE app_id = $1`, [PLUGIN_ID]);
		await pool.query(
			`INSERT INTO platform.apps (app_id, name, version, icon, category, default_size, min_size, app_type,
			                            plugin_permissions, plugin_status)
			 VALUES ($1, '{"hu":"IT","en":"IT"}', '1.0.0', 'icon.svg', 'test', '{"width":1,"height":1}',
			         '{"width":1,"height":1}', 'plugin', '["scheduler"]', 'active')`,
			[PLUGIN_ID]
		);
	});

	afterAll(async () => {
		if (pool) {
			await pool.query(`DELETE FROM platform.apps WHERE app_id = $1`, [PLUGIN_ID]);
		}
		rmSync(pluginsRoot, { recursive: true, force: true });
	});

	it('syncPluginJobs creates jobs with a future next_run_at and is idempotent (Property 4)', async () => {
		const m = manifest([
			{ id: 'ok-job', handler: 'okJob' },
			{ id: 'slow-job', handler: 'slowJob' },
			{ id: 'fail-job', handler: 'failJob' }
		]);
		await registry.syncPluginJobs(PLUGIN_ID, m);
		await pool.query(
			`UPDATE platform.scheduled_jobs SET enabled = FALSE WHERE plugin_id = $1 AND job_id = 'slow-job'`,
			[PLUGIN_ID]
		);
		await registry.syncPluginJobs(PLUGIN_ID, m);

		const r = await pool.query(
			`SELECT job_id, enabled, next_run_at FROM platform.scheduled_jobs WHERE plugin_id = $1 ORDER BY job_id`,
			[PLUGIN_ID]
		);
		expect(r.rows.map((x) => x.job_id)).toEqual(['fail-job', 'ok-job', 'slow-job']);
		expect(r.rows.find((x) => x.job_id === 'slow-job').enabled).toBe(false);
		for (const row of r.rows)
			expect(new Date(row.next_run_at).getTime()).toBeGreaterThan(Date.now());

		// A remote végpont ezeket a neveket tiltja
		expect(await repo.isRegisteredJobHandler(PLUGIN_ID, 'okJob')).toBe(true);
		expect(await repo.isRegisteredJobHandler(PLUGIN_ID, 'notAJob')).toBe(false);

		// Újra engedélyezzük a további tesztekhez
		await pool.query(`UPDATE platform.scheduled_jobs SET enabled = TRUE WHERE plugin_id = $1`, [
			PLUGIN_ID
		]);
	});

	it('Property 1: two schedulers ticking at once run a due job exactly once', async () => {
		const ref = await jobRef('ok-job');
		await makeDue('ok-job');
		const a = new runnerModule.Scheduler();
		const b = new runnerModule.Scheduler();
		calls.length = 0;

		await Promise.all([a.tick(), b.tick(), a.tick(), b.tick()]);
		const runs = await waitForRuns(ref, 1);
		await new Promise((res) => setTimeout(res, 200));

		const all = await pool.query(`SELECT * FROM platform.scheduled_job_runs WHERE job_ref = $1`, [
			ref
		]);
		expect(all.rows).toHaveLength(1);
		expect(runs[0].status).toBe('success');
		expect(runs[0].trigger).toBe('schedule');
		expect(runs[0].result).toEqual({ summary: 'ok', data: { n: 1 } });
		expect(runs[0].logs.some((l: { message: string }) => l.message === 'hello from okJob')).toBe(
			true
		);
		expect(calls).toHaveLength(1);
		expect(calls[0]).toMatchObject({
			jobId: 'ok-job',
			trigger: 'schedule',
			userId: null,
			hasDb: true
		});

		const job = await repo.getJob(ref);
		expect(job?.lockedUntil).toBeNull();
		expect(job?.lastStatus).toBe('success');
		expect(job!.nextRunAt!.getTime()).toBeGreaterThan(Date.now());
	});

	it('records failures and counts consecutive failures', async () => {
		const ref = await jobRef('fail-job');
		const s = new runnerModule.Scheduler();
		await makeDue('fail-job');
		await s.tick();
		const runs = await waitForRuns(ref, 1);
		expect(runs[0].status).toBe('failed');
		expect(runs[0].error).toBe('boom');
		const job = await repo.getJob(ref);
		expect(job?.consecutiveFailures).toBe(1);
		expect(job?.lastStatus).toBe('failed');
	});

	it('runNow runs immediately, keeps next_run_at and rejects a parallel run', async () => {
		const ref = await jobRef('slow-job');
		const before = await repo.getJob(ref);
		const s = new runnerModule.Scheduler();

		const runId = await s.runNow(ref, null);
		await expect(s.runNow(ref, null)).rejects.toThrow(/JOB_ALREADY_RUNNING/);

		const runs = await waitForRuns(ref, 1);
		expect(runs[0].id).toBe(String(runId));
		expect(runs[0].trigger).toBe('manual');
		expect(runs[0].scheduled_for).toBeNull();
		expect(runs[0].status).toBe('success');
		const after = await repo.getJob(ref);
		expect(after?.nextRunAt?.getTime()).toBe(before?.nextRunAt?.getTime());
		expect(after?.lockedUntil).toBeNull();
	});

	it('Property 5: jobs of an inactive plugin are not claimed', async () => {
		const ref = await jobRef('ok-job');
		await makeDue('ok-job');
		await pool.query(`UPDATE platform.apps SET plugin_status = 'inactive' WHERE app_id = $1`, [
			PLUGIN_ID
		]);
		try {
			const claimed = await repo.claimDueJobs('it-instance', 10);
			expect(claimed.some((j) => j.id === ref)).toBe(false);
		} finally {
			await pool.query(`UPDATE platform.apps SET plugin_status = 'active' WHERE app_id = $1`, [
				PLUGIN_ID
			]);
		}
	});

	it('sync removes jobs that disappeared from the manifest', async () => {
		await registry.syncPluginJobs(PLUGIN_ID, manifest([{ id: 'ok-job', handler: 'okJob' }]));
		const r = await pool.query(`SELECT job_id FROM platform.scheduled_jobs WHERE plugin_id = $1`, [
			PLUGIN_ID
		]);
		expect(r.rows.map((x) => x.job_id)).toEqual(['ok-job']);
	});
});
