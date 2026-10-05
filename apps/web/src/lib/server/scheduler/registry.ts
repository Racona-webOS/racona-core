/**
 * A manifestben deklarált feladatok szinkronizálása a `platform.scheduled_jobs` táblával.
 *
 * - Telepítés/frissítés után a `PluginInstaller` / `PluginUpdater` hívja.
 * - Induláskor az ütemező az aktív pluginok lemezen lévő manifestje alapján
 *   egyeztet (a funkció előtt telepített pluginok és a kézzel cserélt fájlok miatt).
 * - Az admin által beállított `enabled` megmarad; ha az időzítés (cron vagy
 *   időzóna) változik, a következő esedékesség újraszámolódik.
 */

import { readFile } from 'fs/promises';
import path from 'path';
import type { ManifestScheduledJob, PluginManifest, ScheduledJobCatchUp } from '@racona/database';
import { client as pool } from '$lib/server/database';
import { getPluginDir } from '$lib/server/plugins/utils/filesystem';
import { getSchedulerConfig } from './config';
import { nextSlot, validateSchedule } from './cron';

/** Egy feladat normalizált, mentésre kész alakja. */
export interface JobDefinition {
	jobId: string;
	handler: string;
	schedule: string;
	timezone: string;
	catchUp: ScheduledJobCatchUp;
	timeoutSeconds: number;
	description: ManifestScheduledJob['description'] | null;
}

/** A manifest feladatai normalizálva; az érvénytelenek kimaradnak (figyelmeztetéssel). */
export function jobDefinitionsFromManifest(manifest: PluginManifest): JobDefinition[] {
	if (!manifest.permissions?.includes('scheduler')) return [];
	const config = getSchedulerConfig();
	const definitions: JobDefinition[] = [];
	for (const job of manifest.scheduledJobs ?? []) {
		const timezone = job.timezone || config.defaultTimezone;
		const problem = validateSchedule(job.schedule, timezone);
		if (problem) {
			console.warn(`[Scheduler] ${manifest.id}/${job.id}: skipped, ${problem}`);
			continue;
		}
		definitions.push({
			jobId: job.id,
			handler: job.handler,
			schedule: job.schedule.trim(),
			timezone,
			catchUp: job.catchUp === 'skip' ? 'skip' : 'once',
			timeoutSeconds: job.timeoutSeconds ?? config.jobTimeoutSeconds,
			description: job.description ?? null
		});
	}
	return definitions;
}

/**
 * Egy tulajdonos (plugin vagy core: `ownerId = null`) feladatainak szinkronizálása:
 * az újak létrejönnek, a meglévők frissülnek, a hiányzók törlődnek.
 */
async function syncJobs(ownerId: string | null, definitions: JobDefinition[]): Promise<void> {
	const now = new Date();
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const existing = await client.query(
			`SELECT id, job_id, schedule, timezone FROM platform.scheduled_jobs
			  WHERE plugin_id IS NOT DISTINCT FROM $1 FOR UPDATE`,
			[ownerId]
		);
		const byJobId = new Map(
			existing.rows.map((r: { id: number; job_id: string; schedule: string; timezone: string }) => [
				r.job_id,
				r
			])
		);

		for (const def of definitions) {
			const current = byJobId.get(def.jobId);
			const description = def.description === null ? null : JSON.stringify(def.description);
			if (current) {
				const timingChanged =
					current.schedule !== def.schedule || current.timezone !== def.timezone;
				await client.query(
					`UPDATE platform.scheduled_jobs
					    SET handler = $2, schedule = $3, timezone = $4, catch_up = $5,
					        timeout_seconds = $6, description = $7::jsonb,
					        next_run_at = CASE WHEN $8::boolean THEN $9::timestamptz ELSE next_run_at END,
					        updated_at = now()
					  WHERE id = $1`,
					[
						current.id,
						def.handler,
						def.schedule,
						def.timezone,
						def.catchUp,
						def.timeoutSeconds,
						description,
						timingChanged,
						nextSlot(def.schedule, def.timezone, now)
					]
				);
			} else {
				await client.query(
					`INSERT INTO platform.scheduled_jobs
					        (plugin_id, job_id, handler, schedule, timezone, catch_up, timeout_seconds,
					         description, next_run_at)
					 VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)`,
					[
						ownerId,
						def.jobId,
						def.handler,
						def.schedule,
						def.timezone,
						def.catchUp,
						def.timeoutSeconds,
						description,
						nextSlot(def.schedule, def.timezone, now)
					]
				);
			}
		}

		await client.query(
			`DELETE FROM platform.scheduled_jobs
			  WHERE plugin_id IS NOT DISTINCT FROM $1 AND NOT (job_id = ANY($2::varchar[]))`,
			[ownerId, definitions.map((d) => d.jobId)]
		);
		await client.query('COMMIT');
	} catch (err) {
		await client.query('ROLLBACK').catch(() => {});
		throw err;
	} finally {
		client.release();
	}
}

/** Egy plugin feladatainak szinkronizálása a manifest alapján. */
export async function syncPluginJobs(pluginId: string, manifest: PluginManifest): Promise<void> {
	await syncJobs(pluginId, jobDefinitionsFromManifest(manifest));
}

/** Egy plugin összes feladatának (és a futásainak) törlése. */
export async function removePluginJobs(pluginId: string): Promise<void> {
	await pool.query(`DELETE FROM platform.scheduled_jobs WHERE plugin_id = $1`, [pluginId]);
}

/** A core feladatok szinkronizálása (plugin_id NULL). */
export async function syncCoreJobs(definitions: JobDefinition[]): Promise<void> {
	await syncJobs(null, definitions);
}

/** A plugin lemezen lévő manifestje, vagy null, ha nem olvasható. */
export async function readInstalledManifest(pluginId: string): Promise<PluginManifest | null> {
	try {
		const raw = await readFile(path.join(getPluginDir(pluginId), 'manifest.json'), 'utf-8');
		return JSON.parse(raw) as PluginManifest;
	} catch {
		return null;
	}
}

/**
 * Induláskori egyeztetés: minden aktív plugin feladatai a lemezen lévő manifest szerint.
 * Ha egy plugin manifestje nem olvasható, a feladatai érintetlenek maradnak.
 */
export async function reconcileInstalledPlugins(): Promise<void> {
	const result = await pool.query(
		`SELECT app_id FROM platform.apps WHERE app_type = 'plugin' AND plugin_status = 'active'`
	);
	for (const { app_id: pluginId } of result.rows as Array<{ app_id: string }>) {
		const manifest = await readInstalledManifest(pluginId);
		if (!manifest) continue;
		try {
			await syncPluginJobs(pluginId, manifest);
		} catch (err) {
			console.error(`[Scheduler] Failed to sync scheduled jobs of ${pluginId}:`, err);
		}
	}
}
