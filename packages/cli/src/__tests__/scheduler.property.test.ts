/**
 * Property-based tesztek a 'scheduler' feature-höz.
 * Feature: plugin-scheduler (9.2)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	normalizeFeatures,
	computePermissions,
	computeScheduledJobs,
	EXAMPLE_SCHEDULED_JOB
} from '../generator.js';
import type { PluginFeature } from '../types.js';

// --- Arbitraries ---

const allFeatures: PluginFeature[] = [
	'sidebar',
	'database',
	'remote_functions',
	'datatable',
	'notifications',
	'scheduler',
	'i18n'
];

const featureArb = fc.constantFrom(...allFeatures);

const featuresArb = fc.array(featureArb, { minLength: 0, maxLength: 7 });

/** Olyan feature lista, amelyben biztosan szerepel a 'scheduler' */
const withSchedulerArb = featuresArb.map((features) => [...features, 'scheduler' as const]);

// --- normalizeFeatures ---

describe('normalizeFeatures — scheduler', () => {
	// Feature: plugin-scheduler, Property S1: scheduler implies remote_functions
	it('Property S1: ha az eredmény tartalmazza a "scheduler"-t, tartalmaznia kell a "remote_functions"-t is', () => {
		fc.assert(
			fc.property(featuresArb, (features) => {
				const result = normalizeFeatures(features);
				return !result.includes('scheduler') || result.includes('remote_functions');
			}),
			{ numRuns: 100 }
		);
	});

	// Feature: plugin-scheduler, Property S2: scheduler is never dropped
	it('Property S2: a "scheduler" bemenet a kimenetben is megmarad', () => {
		fc.assert(
			fc.property(withSchedulerArb, (features) => normalizeFeatures(features).includes('scheduler')),
			{ numRuns: 100 }
		);
	});

	// Feature: plugin-scheduler, Property S3: scheduler keeps database
	it('Property S3: "scheduler" mellett a "database" akkor is megmarad, ha a "remote_functions" nincs kiválasztva', () => {
		fc.assert(
			fc.property(withSchedulerArb, (features) => {
				const input = [...features.filter((f) => f !== 'remote_functions'), 'database' as const];
				return normalizeFeatures(input).includes('database');
			}),
			{ numRuns: 100 }
		);
	});

	// Feature: plugin-scheduler, Property S4: remote_functions is added at most once
	it('Property S4: a hozzáadott "remote_functions" nem duplikálódik', () => {
		fc.assert(
			fc.property(featuresArb, (features) => {
				const result = normalizeFeatures(features);
				const inputCount = features.filter((f) => f === 'remote_functions').length;
				const outputCount = result.filter((f) => f === 'remote_functions').length;
				const needsServer = features.includes('scheduler') || features.includes('database');
				return outputCount === Math.max(inputCount, needsServer ? 1 : 0);
			}),
			{ numRuns: 100 }
		);
	});

	it('Property S5: a bemenetet nem módosítja', () => {
		fc.assert(
			fc.property(featuresArb, (features) => {
				const copy = [...features];
				normalizeFeatures(features);
				return JSON.stringify(copy) === JSON.stringify(features);
			}),
			{ numRuns: 100 }
		);
	});
});

// --- computePermissions ---

describe('computePermissions — scheduler', () => {
	// Feature: plugin-scheduler, Property S6: scheduler feature ⇔ scheduler permission
	it('Property S6: a "scheduler" jog pontosan akkor szerepel, ha a "scheduler" feature ki van választva', () => {
		fc.assert(
			fc.property(featuresArb, (features) => {
				const result = computePermissions(normalizeFeatures(features));
				return result.includes('scheduler') === features.includes('scheduler');
			}),
			{ numRuns: 100 }
		);
	});

	// A core ManifestValidator a scheduledJobs mellé 'scheduler' jogot vár
	it('Property S7: normalizált scheduler esetén a jogok között a "remote_functions" is szerepel', () => {
		fc.assert(
			fc.property(withSchedulerArb, (features) => {
				const result = computePermissions(normalizeFeatures(features));
				return result.includes('scheduler') && result.includes('remote_functions');
			}),
			{ numRuns: 100 }
		);
	});
});

// --- computeScheduledJobs ---

describe('computeScheduledJobs', () => {
	// Feature: plugin-scheduler, Property S8: jobs only with the scheduler feature
	it('Property S8: pontosan akkor ad feladatot, ha a "scheduler" feature ki van választva', () => {
		fc.assert(
			fc.property(featuresArb, (features) => {
				const jobs = computeScheduledJobs(features);
				return features.includes('scheduler') ? jobs.length === 1 : jobs.length === 0;
			}),
			{ numRuns: 100 }
		);
	});

	// A core ManifestValidator szabályai (ManifestValidator.ts scheduledJobSchema)
	it('a minta feladat megfelel a core manifest szabályainak', () => {
		const [job] = computeScheduledJobs(['scheduler']);
		expect(job.id).toMatch(/^[a-z0-9-]{3,50}$/);
		expect(job.handler).toMatch(/^[A-Za-z_$][A-Za-z0-9_$]*$/);
		expect(job.schedule.split(' ')).toHaveLength(5);
		expect(job.timeoutSeconds).toBeGreaterThanOrEqual(10);
		expect(job.timeoutSeconds).toBeLessThanOrEqual(3600);
		expect(['once', 'skip']).toContain(job.catchUp);
		expect(job.description?.hu).toBeTruthy();
		expect(job.description?.en).toBeTruthy();
	});

	it('másolatot ad: a visszaadott objektum módosítása nem hat a mintára', () => {
		const [job] = computeScheduledJobs(['scheduler']);
		job.id = 'changed';
		job.description!.en = 'changed';
		expect(EXAMPLE_SCHEDULED_JOB.id).toBe('daily-check');
		expect(EXAMPLE_SCHEDULED_JOB.description?.en).not.toBe('changed');
	});
});
