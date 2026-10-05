/**
 * Ütemező — adatbázis műveletek (platform.scheduled_jobs, platform.scheduled_job_runs).
 *
 * A lefoglalás `FOR UPDATE SKIP LOCKED` + lease (`locked_by`, `locked_until`),
 * így több alkalmazáspéldány esetén is egy feladatot egyszerre csak egy futtat.
 * Az időpontonkénti egyetlen ütemezett futást a `uq_scheduled_job_runs_slot`
 * egyedi index biztosítja.
 */

import { client as pool } from '$lib/server/database';
import type {
	ScheduledJobCatchUp,
	ScheduledJobDescription,
	ScheduledJobLogLine,
	ScheduledJobRunStatus,
	ScheduledJobTrigger
} from '@racona/database';

/** Egy ütemezett feladat (camelCase). */
export interface JobRecord {
	id: number;
	pluginId: string | null;
	jobId: string;
	handler: string;
	schedule: string;
	timezone: string;
	catchUp: ScheduledJobCatchUp;
	timeoutSeconds: number;
	description: ScheduledJobDescription | null;
	enabled: boolean;
	nextRunAt: Date | null;
	lastRunAt: Date | null;
	lastStatus: ScheduledJobRunStatus | null;
	lastError: string | null;
	lastDurationMs: number | null;
	consecutiveFailures: number;
	failureNotifiedAt: Date | null;
	lockedBy: string | null;
	lockedUntil: Date | null;
}

/** Egy futás (camelCase). */
export interface RunRecord {
	id: number;
	jobRef: number;
	pluginId: string | null;
	jobId: string;
	trigger: ScheduledJobTrigger;
	triggeredBy: number | null;
	triggeredByName: string | null;
	scheduledFor: Date | null;
	startedAt: Date;
	finishedAt: Date | null;
	status: ScheduledJobRunStatus;
	result: unknown;
	error: string | null;
	logs: ScheduledJobLogLine[];
	instanceId: string | null;
}

/** pg kliens vagy pool — amin `query` hívható. */
interface Queryable {
	query: typeof pool.query;
}

const JOB_COLUMNS = `
	id, plugin_id, job_id, handler, schedule, timezone, catch_up, timeout_seconds, description,
	enabled, next_run_at, last_run_at, last_status, last_error, last_duration_ms,
	consecutive_failures, failure_notified_at, locked_by, locked_until`;

// A pg sorok mezőit a tábla oszlopai határozzák meg
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapJob(row: Record<string, any>): JobRecord {
	return {
		id: row.id,
		pluginId: row.plugin_id ?? null,
		jobId: row.job_id,
		handler: row.handler,
		schedule: row.schedule,
		timezone: row.timezone,
		catchUp: row.catch_up,
		timeoutSeconds: row.timeout_seconds,
		description: row.description ?? null,
		enabled: row.enabled,
		nextRunAt: row.next_run_at ?? null,
		lastRunAt: row.last_run_at ?? null,
		lastStatus: row.last_status ?? null,
		lastError: row.last_error ?? null,
		lastDurationMs: row.last_duration_ms ?? null,
		consecutiveFailures: row.consecutive_failures ?? 0,
		failureNotifiedAt: row.failure_notified_at ?? null,
		lockedBy: row.locked_by ?? null,
		lockedUntil: row.locked_until ?? null
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRun(row: Record<string, any>): RunRecord {
	return {
		id: Number(row.id),
		jobRef: row.job_ref,
		pluginId: row.plugin_id ?? null,
		jobId: row.job_id,
		trigger: row.trigger,
		triggeredBy: row.triggered_by ?? null,
		triggeredByName: row.triggered_by_name ?? null,
		scheduledFor: row.scheduled_for ?? null,
		startedAt: row.started_at,
		finishedAt: row.finished_at ?? null,
		status: row.status,
		result: row.result ?? null,
		error: row.error ?? null,
		logs: row.logs ?? [],
		instanceId: row.instance_id ?? null
	};
}

// ---------------------------------------------------------------------------
// Lefoglalás és futás
// ---------------------------------------------------------------------------

/**
 * Az esedékes feladatok lefoglalása ezen a példányon.
 * Csak engedélyezett, lease nélküli feladat; pluginnál aktív plugin `scheduler` joggal.
 * A lease a feladat időkorlátja + 60 s.
 */
export async function claimDueJobs(instanceId: string, limit: number): Promise<JobRecord[]> {
	if (limit <= 0) return [];
	const result = await pool.query(
		`UPDATE platform.scheduled_jobs j
		    SET locked_by = $1,
		        locked_until = now() + make_interval(secs => j.timeout_seconds + 60),
		        updated_at = now()
		  WHERE j.id IN (
		        SELECT j2.id
		          FROM platform.scheduled_jobs j2
		          LEFT JOIN platform.apps a ON a.app_id = j2.plugin_id
		         WHERE j2.enabled
		           AND j2.next_run_at IS NOT NULL
		           AND j2.next_run_at <= now()
		           AND (j2.locked_until IS NULL OR j2.locked_until < now())
		           AND (j2.plugin_id IS NULL
		                OR (a.plugin_status = 'active' AND a.plugin_permissions ? 'scheduler'))
		         ORDER BY j2.next_run_at
		         LIMIT $2
		         FOR UPDATE OF j2 SKIP LOCKED)
		RETURNING ${JOB_COLUMNS}`,
		[instanceId, limit]
	);
	return result.rows.map(mapJob);
}

/**
 * A lefoglalt feladat léptetése a következő esedékességre és a futás rögzítése, egy tranzakcióban.
 * Ha a `nextRunAt` null (a kifejezés többé nem esedékes), a feladat kikapcsol.
 *
 * @returns A futás azonosítója, vagy null, ha erre az időpontra már van ütemezett futás.
 */
export async function advanceAndInsertRun(
	job: JobRecord,
	plan: { scheduledFor: Date; nextRunAt: Date | null; status: 'running' | 'skipped' },
	instanceId: string
): Promise<number | null> {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query(
			`UPDATE platform.scheduled_jobs
			    SET next_run_at = $2,
			        enabled = CASE WHEN $2::timestamptz IS NULL THEN FALSE ELSE enabled END,
			        last_error = CASE WHEN $2::timestamptz IS NULL
			                          THEN 'The schedule will never fire again' ELSE last_error END,
			        updated_at = now()
			  WHERE id = $1`,
			[job.id, plan.nextRunAt]
		);
		const inserted = await client.query(
			`INSERT INTO platform.scheduled_job_runs
			        (job_ref, plugin_id, job_id, trigger, scheduled_for, status, instance_id, finished_at)
			 VALUES ($1, $2, $3, 'schedule', $4, $5::varchar, $6, CASE WHEN $5::varchar = 'skipped' THEN now() END)
			 ON CONFLICT (job_ref, scheduled_for) DO NOTHING
			 RETURNING id`,
			[job.id, job.pluginId, job.jobId, plan.scheduledFor, plan.status, instanceId]
		);
		await client.query('COMMIT');
		return inserted.rows[0] ? Number(inserted.rows[0].id) : null;
	} catch (err) {
		await client.query('ROLLBACK').catch(() => {});
		throw err;
	} finally {
		client.release();
	}
}

/** Kézi futás rögzítése (scheduled_for NULL, nem ütközik az ütemezett futásokkal). */
export async function insertManualRun(
	job: JobRecord,
	userId: number | null,
	instanceId: string
): Promise<number> {
	const result = await pool.query(
		`INSERT INTO platform.scheduled_job_runs
		        (job_ref, plugin_id, job_id, trigger, triggered_by, status, instance_id)
		 VALUES ($1, $2, $3, 'manual', $4, 'running', $5)
		 RETURNING id`,
		[job.id, job.pluginId, job.jobId, userId, instanceId]
	);
	return Number(result.rows[0].id);
}

/** A futás lezárása. */
export async function finishRun(
	runId: number,
	outcome: {
		status: ScheduledJobRunStatus;
		result?: unknown;
		error?: string | null;
		logs?: ScheduledJobLogLine[];
	}
): Promise<void> {
	await pool.query(
		`UPDATE platform.scheduled_job_runs
		    SET status = $2, finished_at = now(), result = $3::jsonb, error = $4, logs = $5::jsonb
		  WHERE id = $1`,
		[
			runId,
			outcome.status,
			outcome.result === undefined ? null : JSON.stringify(outcome.result),
			outcome.error ?? null,
			JSON.stringify(outcome.logs ?? [])
		]
	);
}

/**
 * A feladat állapotának frissítése egy futás után. Timeout esetén a lease
 * marad (a handler a háttérben még futhat), egyébként feloldódik.
 *
 * @returns A frissített feladat.
 */
export async function updateJobAfterRun(
	jobRef: number,
	instanceId: string,
	outcome: { status: ScheduledJobRunStatus; error: string | null; durationMs: number }
): Promise<JobRecord | null> {
	const failed = outcome.status === 'failed' || outcome.status === 'timeout';
	const result = await pool.query(
		`UPDATE platform.scheduled_jobs
		    SET last_run_at = now(),
		        last_status = $3::varchar,
		        last_error = $4,
		        last_duration_ms = $5,
		        consecutive_failures = CASE WHEN $6::boolean THEN consecutive_failures + 1 ELSE 0 END,
		        failure_notified_at = CASE WHEN $6::boolean THEN failure_notified_at ELSE NULL END,
		        locked_by = CASE WHEN $3::varchar = 'timeout' OR locked_by IS DISTINCT FROM $2::varchar THEN locked_by ELSE NULL END,
		        locked_until = CASE WHEN $3::varchar = 'timeout' OR locked_by IS DISTINCT FROM $2::varchar THEN locked_until ELSE NULL END,
		        updated_at = now()
		  WHERE id = $1
		RETURNING ${JOB_COLUMNS}`,
		[jobRef, instanceId, outcome.status, outcome.error, outcome.durationMs, failed]
	);
	return result.rows[0] ? mapJob(result.rows[0]) : null;
}

/** A lease feloldása (csak a saját példányé). */
export async function releaseLease(jobRef: number, instanceId: string): Promise<void> {
	await pool.query(
		`UPDATE platform.scheduled_jobs
		    SET locked_by = NULL, locked_until = NULL, updated_at = now()
		  WHERE id = $1 AND locked_by = $2`,
		[jobRef, instanceId]
	);
}

/**
 * Lease szerzése egy adott feladatra (kézi futtatáshoz).
 *
 * @returns A feladat, vagy null, ha éppen fut (érvényes lease van rajta).
 */
export async function tryAcquireLease(
	jobRef: number,
	instanceId: string
): Promise<JobRecord | null> {
	const result = await pool.query(
		`UPDATE platform.scheduled_jobs
		    SET locked_by = $2,
		        locked_until = now() + make_interval(secs => timeout_seconds + 60),
		        updated_at = now()
		  WHERE id = $1 AND (locked_until IS NULL OR locked_until < now())
		RETURNING ${JOB_COLUMNS}`,
		[jobRef, instanceId]
	);
	return result.rows[0] ? mapJob(result.rows[0]) : null;
}

/** A hibaértesítés megtörtént (a következő sikeres futásig nem ismétlődik). */
export async function markFailureNotified(jobRef: number): Promise<void> {
	await pool.query(`UPDATE platform.scheduled_jobs SET failure_notified_at = now() WHERE id = $1`, [
		jobRef
	]);
}

/**
 * A megszakadt futások lezárása: `running` állapotú futás, amelynek a feladatán
 * már nincs érvényes lease (a szerver leállt vagy összeomlott közben).
 */
export async function markInterruptedRuns(): Promise<number> {
	const result = await pool.query(
		`UPDATE platform.scheduled_job_runs r
		    SET status = 'failed', finished_at = now(),
		        error = COALESCE(r.error, 'Interrupted: the server stopped during the run')
		   FROM platform.scheduled_jobs j
		  WHERE r.job_ref = j.id
		    AND r.status = 'running'
		    AND (j.locked_until IS NULL OR j.locked_until < now())`
	);
	return result.rowCount ?? 0;
}

/** A megőrzési időnél régebbi futások törlése. */
export async function deleteOldRuns(retentionDays: number): Promise<number> {
	const result = await pool.query(
		`DELETE FROM platform.scheduled_job_runs
		  WHERE started_at < now() - make_interval(days => $1)
		    AND status <> 'running'`,
		[retentionDays]
	);
	return result.rowCount ?? 0;
}

// ---------------------------------------------------------------------------
// Lekérdezések
// ---------------------------------------------------------------------------

/**
 * Regisztrált job handler-e a név a pluginban (a remote végpont tiltja a hívásukat).
 * Hiba esetén (pl. a migráció még nem futott le) false.
 */
export async function isRegisteredJobHandler(pluginId: string, handler: string): Promise<boolean> {
	try {
		const result = await pool.query(
			`SELECT 1 FROM platform.scheduled_jobs WHERE plugin_id = $1 AND handler = $2 LIMIT 1`,
			[pluginId, handler]
		);
		return result.rows.length > 0;
	} catch {
		return false;
	}
}

export async function getJob(jobRef: number, db: Queryable = pool): Promise<JobRecord | null> {
	const result = await db.query(
		`SELECT ${JOB_COLUMNS} FROM platform.scheduled_jobs WHERE id = $1`,
		[jobRef]
	);
	return result.rows[0] ? mapJob(result.rows[0]) : null;
}

/** Feladatok listája; pluginId megadásával csak a pluginé, `null`-lal csak a core feladatok. */
export async function listJobs(pluginId?: string | null): Promise<JobRecord[]> {
	if (pluginId === undefined) {
		const result = await pool.query(
			`SELECT ${JOB_COLUMNS} FROM platform.scheduled_jobs ORDER BY plugin_id NULLS FIRST, job_id`
		);
		return result.rows.map(mapJob);
	}
	const result = await pool.query(
		`SELECT ${JOB_COLUMNS} FROM platform.scheduled_jobs
		  WHERE plugin_id IS NOT DISTINCT FROM $1 ORDER BY job_id`,
		[pluginId]
	);
	return result.rows.map(mapJob);
}

const RUN_SELECT = `
	SELECT r.id, r.job_ref, r.plugin_id, r.job_id, r.trigger, r.triggered_by, r.scheduled_for,
	       r.started_at, r.finished_at, r.status, r.result, r.error, r.logs, r.instance_id,
	       u.full_name AS triggered_by_name
	  FROM platform.scheduled_job_runs r
	  LEFT JOIN auth.users u ON u.id = r.triggered_by`;

export async function listRuns(
	jobRef: number,
	limit: number,
	offset: number
): Promise<RunRecord[]> {
	const result = await pool.query(
		`${RUN_SELECT} WHERE r.job_ref = $1 ORDER BY r.started_at DESC, r.id DESC LIMIT $2 OFFSET $3`,
		[jobRef, limit, offset]
	);
	return result.rows.map(mapRun);
}

export async function getRun(runId: number): Promise<RunRecord | null> {
	const result = await pool.query(`${RUN_SELECT} WHERE r.id = $1`, [runId]);
	return result.rows[0] ? mapRun(result.rows[0]) : null;
}

/** Ki/bekapcsolás; bekapcsoláskor a következő esedékesség is beállítódik. */
export async function setJobEnabled(
	jobRef: number,
	enabled: boolean,
	nextRunAt: Date | null
): Promise<JobRecord | null> {
	const result = await pool.query(
		`UPDATE platform.scheduled_jobs
		    SET enabled = $2::boolean,
		        next_run_at = CASE WHEN $2::boolean THEN $3::timestamptz ELSE next_run_at END,
		        consecutive_failures = CASE WHEN $2::boolean THEN 0 ELSE consecutive_failures END,
		        failure_notified_at = CASE WHEN $2::boolean THEN NULL ELSE failure_notified_at END,
		        updated_at = now()
		  WHERE id = $1
		RETURNING ${JOB_COLUMNS}`,
		[jobRef, enabled, nextRunAt]
	);
	return result.rows[0] ? mapJob(result.rows[0]) : null;
}

/** Felhasználók, akiknek a core jogosultsága megvan (szerepkörön vagy csoporton át). */
export async function findUserIdsWithPermission(permission: string): Promise<number[]> {
	const result = await pool.query(
		`SELECT DISTINCT ur.user_id AS id
		   FROM auth.user_roles ur
		   JOIN auth.role_permissions rp ON rp.role_id = ur.role_id
		   JOIN auth.permissions p ON p.id = rp.permission_id
		  WHERE p.name = $1
		 UNION
		 SELECT DISTINCT ug.user_id AS id
		   FROM auth.user_groups ug
		   JOIN auth.group_permissions gp ON gp.group_id = ug.group_id
		   JOIN auth.permissions p ON p.id = gp.permission_id
		  WHERE p.name = $1`,
		[permission]
	);
	return result.rows.map((r: { id: number }) => Number(r.id));
}

/** A rendszergazda szerepkörű felhasználók (a seed fix id-val hozza létre). */
export async function findSystemAdminUserIds(): Promise<number[]> {
	const result = await pool.query(
		`SELECT DISTINCT user_id AS id FROM auth.user_roles WHERE role_id = 1`
	);
	return result.rows.map((r: { id: number }) => Number(r.id));
}

/** A plugin manifest jogosultságai (`apps.plugin_permissions`). */
export async function getPluginPermissions(pluginId: string): Promise<string[]> {
	const result = await pool.query(
		`SELECT plugin_permissions FROM platform.apps WHERE app_id = $1`,
		[pluginId]
	);
	const value = result.rows[0]?.plugin_permissions;
	return Array.isArray(value) ? value.filter((p): p is string => typeof p === 'string') : [];
}
