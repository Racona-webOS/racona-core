/**
 * Cron segédfüggvények: érvényesség, minimális intervallum, időzóna és
 * nyári/téli időszámítás (.kiro/specs/plugin-scheduler, 1.5, 1.6, 4.8, Property 3).
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isValidTimezone, nextSlot, validateSchedule } from '../cron';

const TZ = 'Europe/Budapest';

describe('validateSchedule', () => {
	it('accepts a daily 5-field expression', () => {
		expect(validateSchedule('0 6 * * *', TZ)).toBeNull();
		expect(validateSchedule('*/5 * * * *', TZ)).toBeNull();
		expect(validateSchedule('30 7 * * 1-5', TZ)).toBeNull();
	});

	it('rejects expressions that are not 5 fields', () => {
		expect(validateSchedule('0 0 6 * * *', TZ)).toMatch(/5-field/);
		expect(validateSchedule('0 6 * *', TZ)).toMatch(/5-field/);
		expect(validateSchedule('', TZ)).toMatch(/5-field/);
	});

	it('rejects invalid field values', () => {
		expect(validateSchedule('61 6 * * *', TZ)).not.toBeNull();
		expect(validateSchedule('x y z w v', TZ)).not.toBeNull();
	});

	it('rejects schedules firing more often than every 5 minutes', () => {
		expect(validateSchedule('* * * * *', TZ)).toMatch(/too often/);
		expect(validateSchedule('*/2 * * * *', TZ)).toMatch(/too often/);
		expect(validateSchedule('0,1 6 * * *', TZ)).toMatch(/too often/);
	});

	it('rejects schedules that never fire', () => {
		expect(validateSchedule('0 0 30 2 *', TZ)).toMatch(/never/);
	});

	it('rejects invalid timezones', () => {
		expect(validateSchedule('0 6 * * *', 'Mars/Olympus')).toMatch(/timezone/i);
	});
});

describe('isValidTimezone', () => {
	it('accepts IANA zones and rejects garbage', () => {
		expect(isValidTimezone('Europe/Budapest')).toBe(true);
		expect(isValidTimezone('UTC')).toBe(true);
		expect(isValidTimezone('Mars/Olympus')).toBe(false);
		expect(isValidTimezone('')).toBe(false);
	});
});

describe('nextSlot', () => {
	it('interprets the expression in the given timezone', () => {
		// Télen UTC+1: 06:00 helyi = 05:00 UTC
		expect(nextSlot('0 6 * * *', TZ, new Date('2026-01-10T00:00:00Z'))?.toISOString()).toBe(
			'2026-01-10T05:00:00.000Z'
		);
		// Nyáron UTC+2: 06:00 helyi = 04:00 UTC
		expect(nextSlot('0 6 * * *', TZ, new Date('2026-07-10T00:00:00Z'))?.toISOString()).toBe(
			'2026-07-10T04:00:00.000Z'
		);
	});

	it('is strictly after the reference time', () => {
		const at = new Date('2026-01-10T05:00:00Z'); // pontosan 06:00 helyi
		expect(nextSlot('0 6 * * *', TZ, at)?.toISOString()).toBe('2026-01-11T05:00:00.000Z');
	});

	it('fires exactly once on the spring-forward day (02:30 does not exist)', () => {
		// 2026-03-29: 02:00 → 03:00 helyi idő
		const from = new Date('2026-03-28T12:00:00Z');
		const first = nextSlot('30 2 * * *', TZ, from)!;
		const second = nextSlot('30 2 * * *', TZ, first)!;
		expect(first.toISOString()).toBe('2026-03-29T01:30:00.000Z'); // 03:30 CEST
		expect(second.toISOString()).toBe('2026-03-30T00:30:00.000Z'); // 02:30 CEST
	});

	it('fires exactly once on the fall-back day (02:30 occurs twice)', () => {
		// 2026-10-25: 03:00 → 02:00 helyi idő
		const from = new Date('2026-10-24T12:00:00Z');
		const first = nextSlot('30 2 * * *', TZ, from)!;
		const second = nextSlot('30 2 * * *', TZ, first)!;
		expect(first.toISOString()).toBe('2026-10-25T00:30:00.000Z');
		expect(second.toISOString()).toBe('2026-10-26T01:30:00.000Z');
	});

	it('daily 06:00 job fires once per local day across DST changes', () => {
		let at = new Date('2026-03-20T00:00:00Z');
		const days = new Set<string>();
		for (let i = 0; i < 230; i++) {
			at = nextSlot('0 6 * * *', TZ, at)!;
			const local = new Intl.DateTimeFormat('sv-SE', {
				timeZone: TZ,
				dateStyle: 'short',
				timeStyle: 'short'
			}).format(at);
			expect(local.endsWith('06:00')).toBe(true);
			days.add(local.slice(0, 10));
		}
		expect(days.size).toBe(230);
	});

	it('Property 3: always strictly after the reference time and monotonic', () => {
		const schedules = ['0 6 * * *', '*/15 * * * *', '30 2 * * *', '0 0 1 * *', '45 23 * * 1-5'];
		fc.assert(
			fc.property(
				fc.constantFrom(...schedules),
				fc.constantFrom('Europe/Budapest', 'UTC', 'America/New_York'),
				fc.date({
					min: new Date('2020-01-01T00:00:00Z'),
					max: new Date('2035-01-01T00:00:00Z'),
					noInvalidDate: true
				}),
				(schedule, tz, from) => {
					const a = nextSlot(schedule, tz, from)!;
					const b = nextSlot(schedule, tz, a)!;
					return a.getTime() > from.getTime() && b.getTime() > a.getTime();
				}
			),
			{ numRuns: 200 }
		);
	});
});
