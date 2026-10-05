/**
 * Futás tervezése: pótlás (`catchUp`), léptetés a most utáni időpontra
 * (.kiro/specs/plugin-scheduler, 4.4, 4.6, 4.7, Property 2).
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { planRun } from '../planning';

const TZ = 'Europe/Budapest';
const GRACE = 300;

describe('planRun', () => {
	it('runs an on-time job and advances to the next slot', () => {
		const plan = planRun(
			{
				schedule: '0 6 * * *',
				timezone: TZ,
				catchUp: 'once',
				nextRunAt: new Date('2026-01-10T05:00:00Z')
			},
			new Date('2026-01-10T05:00:20Z'),
			GRACE
		);
		expect(plan.action).toBe('run');
		expect(plan.scheduledFor.toISOString()).toBe('2026-01-10T05:00:00.000Z');
		expect(plan.nextRunAt?.toISOString()).toBe('2026-01-11T05:00:00.000Z');
	});

	it("catchUp 'once': several missed slots → one run, next slot after now", () => {
		const plan = planRun(
			{
				schedule: '0 6 * * *',
				timezone: TZ,
				catchUp: 'once',
				nextRunAt: new Date('2026-01-07T05:00:00Z')
			},
			new Date('2026-01-10T09:00:00Z'),
			GRACE
		);
		expect(plan.action).toBe('run');
		expect(plan.scheduledFor.toISOString()).toBe('2026-01-07T05:00:00.000Z');
		expect(plan.nextRunAt?.toISOString()).toBe('2026-01-11T05:00:00.000Z');
	});

	it("catchUp 'skip': skips a slot older than the grace period", () => {
		const plan = planRun(
			{
				schedule: '0 6 * * *',
				timezone: TZ,
				catchUp: 'skip',
				nextRunAt: new Date('2026-01-10T05:00:00Z')
			},
			new Date('2026-01-10T05:10:00Z'),
			GRACE
		);
		expect(plan.action).toBe('skip');
		expect(plan.nextRunAt?.toISOString()).toBe('2026-01-11T05:00:00.000Z');
	});

	it("catchUp 'skip': still runs within the grace period", () => {
		const plan = planRun(
			{
				schedule: '0 6 * * *',
				timezone: TZ,
				catchUp: 'skip',
				nextRunAt: new Date('2026-01-10T05:00:00Z')
			},
			new Date('2026-01-10T05:04:00Z'),
			GRACE
		);
		expect(plan.action).toBe('run');
	});

	it('Property 2: nextRunAt is after now and after scheduledFor', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('0 6 * * *', '*/10 * * * *', '0 0 * * 1', '15 3 1 * *'),
				fc.constantFrom<'once' | 'skip'>('once', 'skip'),
				fc.date({
					min: new Date('2024-01-01T00:00:00Z'),
					max: new Date('2030-01-01T00:00:00Z'),
					noInvalidDate: true
				}),
				fc.integer({ min: 0, max: 60 * 24 * 40 }),
				(schedule, catchUp, nextRunAt, lateMinutes) => {
					const now = new Date(nextRunAt.getTime() + lateMinutes * 60_000);
					const plan = planRun({ schedule, timezone: TZ, catchUp, nextRunAt }, now, GRACE);
					return (
						plan.nextRunAt !== null &&
						plan.nextRunAt.getTime() > now.getTime() &&
						plan.nextRunAt.getTime() > plan.scheduledFor.getTime()
					);
				}
			),
			{ numRuns: 200 }
		);
	});
});
