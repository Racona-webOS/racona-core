/**
 * Cron kifejezések értelmezése és a következő esedékesség számítása.
 *
 * A `croner` csak a számításra kell, időzítőt nem indítunk vele: az ütemezés
 * állapota (`next_run_at`) az adatbázisban van.
 */

import { Cron } from 'croner';

/** A legrövidebb megengedett idő két futás között (s). */
export const MIN_SCHEDULE_INTERVAL_SECONDS = 5 * 60;

/** A minimum intervallum ellenőrzésénél ennyi egymást követő futást vizsgálunk. */
const INTERVAL_SAMPLE_SIZE = 6;

function createCron(schedule: string, timezone: string): Cron {
	// 5 mezős (perc pontosságú) kifejezés; a másodperc mező nem engedélyezett
	return new Cron(schedule, { timezone, paused: true, mode: '5-part' });
}

/** Érvényes IANA időzóna-e. */
export function isValidTimezone(timezone: string): boolean {
	if (typeof timezone !== 'string' || !timezone.trim()) return false;
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: timezone });
		return true;
	} catch {
		return false;
	}
}

/**
 * Egy cron kifejezés ellenőrzése.
 *
 * @returns Hibaüzenet, vagy null, ha érvényes.
 */
export function validateSchedule(schedule: string, timezone: string): string | null {
	if (typeof schedule !== 'string' || schedule.trim().split(/\s+/).length !== 5) {
		return 'The schedule must be a 5-field cron expression (minute hour day month weekday)';
	}
	if (!isValidTimezone(timezone)) {
		return `Invalid timezone: ${timezone}`;
	}
	let runs: Date[];
	try {
		runs = createCron(schedule, timezone).nextRuns(INTERVAL_SAMPLE_SIZE);
	} catch (err) {
		return err instanceof Error ? err.message : 'Invalid cron expression';
	}
	if (runs.length === 0) {
		return 'The schedule never fires';
	}
	const interval = minIntervalSeconds(runs);
	if (interval !== null && interval < MIN_SCHEDULE_INTERVAL_SECONDS) {
		return `The schedule fires too often (minimum interval: ${MIN_SCHEDULE_INTERVAL_SECONDS / 60} minutes)`;
	}
	return null;
}

/** A legrövidebb különbség egymást követő időpontok között (s), vagy null egy időpontnál. */
export function minIntervalSeconds(runs: Date[]): number | null {
	let min: number | null = null;
	for (let i = 1; i < runs.length; i++) {
		const diff = (runs[i].getTime() - runs[i - 1].getTime()) / 1000;
		if (min === null || diff < min) min = diff;
	}
	return min;
}

/**
 * A `from` utáni első esedékesség (szigorúan később).
 *
 * @returns Az időpont, vagy null, ha a kifejezés többé nem esedékes.
 */
export function nextSlot(schedule: string, timezone: string, from: Date): Date | null {
	return createCron(schedule, timezone).nextRun(from);
}
