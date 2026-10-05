/**
 * A manifest `scheduledJobs` mezőjének ellenőrzése
 * (.kiro/specs/plugin-scheduler, 1.1–1.6).
 */

import { describe, it, expect } from 'vitest';
import { ManifestValidator } from '$lib/server/plugins/validation/ManifestValidator';

const validator = new ManifestValidator();

function manifest(overrides: Record<string, unknown> = {}) {
	return {
		id: 'demo-plugin',
		name: 'Demo',
		version: '1.0.0',
		description: 'Demo plugin',
		author: 'Racona',
		entry: 'dist/index.js',
		icon: 'icon.svg',
		permissions: ['database', 'remote_functions', 'scheduler'],
		scheduledJobs: [
			{
				id: 'daily-check',
				handler: 'runDailyCheck',
				schedule: '0 7 * * *',
				timezone: 'Europe/Budapest',
				description: { hu: 'Napi ellenőrzés', en: 'Daily check' },
				timeoutSeconds: 600,
				catchUp: 'once'
			}
		],
		...overrides
	};
}

function job(overrides: Record<string, unknown> = {}) {
	return { id: 'daily-check', handler: 'runDailyCheck', schedule: '0 7 * * *', ...overrides };
}

describe('ManifestValidator — scheduledJobs', () => {
	it('accepts a valid scheduled job and keeps it in the output', () => {
		const result = validator.validate(manifest());
		expect(result.errors).toEqual([]);
		expect(result.valid).toBe(true);
		expect(result.manifest?.scheduledJobs?.[0]).toMatchObject({
			id: 'daily-check',
			handler: 'runDailyCheck'
		});
	});

	it('accepts the scheduler permission without jobs', () => {
		expect(validator.validate(manifest({ scheduledJobs: undefined })).valid).toBe(true);
	});

	it('requires the scheduler permission', () => {
		const result = validator.validate(manifest({ permissions: ['database'] }));
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.field === 'permissions')).toBe(true);
	});

	it('rejects duplicate job ids', () => {
		const result = validator.validate(
			manifest({ scheduledJobs: [job(), job({ handler: 'other' })] })
		);
		expect(result.valid).toBe(false);
		expect(result.errors[0].message).toMatch(/Duplicate/);
	});

	it('rejects more than 20 jobs', () => {
		const jobs = Array.from({ length: 21 }, (_, i) => job({ id: `job-${i}` }));
		expect(validator.validate(manifest({ scheduledJobs: jobs })).valid).toBe(false);
	});

	it('rejects an invalid cron expression with the field path', () => {
		const result = validator.validate(manifest({ scheduledJobs: [job({ schedule: '0 7 * *' })] }));
		expect(result.valid).toBe(false);
		expect(result.errors[0].field).toBe('scheduledJobs.0.schedule');
	});

	it('rejects too frequent schedules', () => {
		const result = validator.validate(
			manifest({ scheduledJobs: [job({ schedule: '* * * * *' })] })
		);
		expect(result.valid).toBe(false);
		expect(result.errors[0].message).toMatch(/too often/);
	});

	it('rejects an invalid timezone', () => {
		const result = validator.validate(
			manifest({ scheduledJobs: [job({ timezone: 'Nowhere/City' })] })
		);
		expect(result.valid).toBe(false);
		expect(result.errors[0].field).toBe('scheduledJobs.0.timezone');
	});

	it('rejects invalid ids, handlers, timeouts and catchUp values', () => {
		for (const bad of [
			job({ id: 'Daily Check' }),
			job({ handler: 'run-daily' }),
			job({ timeoutSeconds: 5 }),
			job({ timeoutSeconds: 4000 }),
			job({ catchUp: 'always' })
		]) {
			expect(validator.validate(manifest({ scheduledJobs: [bad] })).valid).toBe(false);
		}
	});
});
