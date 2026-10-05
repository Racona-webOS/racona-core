/**
 * Egy esedékes feladat futásának megtervezése (tiszta függvény).
 *
 * - `scheduledFor`: a lefoglalt esedékesség (a feladat `next_run_at`-ja).
 * - `nextRunAt`: mindig a **most utáni** első esedékesség, így több kimaradt
 *   időpont sem indít futás-sorozatot (`catchUp: 'once'` = egyszer pótol).
 * - `skip`: `catchUp: 'skip'` esetén, ha az esedékesség a türelmi időnél régebbi.
 */

import type { ScheduledJobCatchUp } from '@racona/database';
import { nextSlot } from './cron';

export interface PlannableJob {
	schedule: string;
	timezone: string;
	catchUp: ScheduledJobCatchUp;
	nextRunAt: Date;
}

export interface RunPlan {
	action: 'run' | 'skip';
	scheduledFor: Date;
	/** null: a kifejezés többé nem esedékes (a feladatot ki kell kapcsolni). */
	nextRunAt: Date | null;
}

export function planRun(job: PlannableJob, now: Date, graceSeconds: number): RunPlan {
	const scheduledFor = job.nextRunAt;
	const nextRunAt = nextSlot(job.schedule, job.timezone, now);
	const lateSeconds = (now.getTime() - scheduledFor.getTime()) / 1000;
	const action = job.catchUp === 'skip' && lateSeconds > graceSeconds ? 'skip' : 'run';
	return { action, scheduledFor, nextRunAt };
}
