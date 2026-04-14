/**
 * Property-based tesztek a feature-alapú wizard logikájához.
 * Feature: cli-feature-based-wizard
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { hasFeature, normalizeFeatures, computePermissions } from '../generator.js';
import { parseFeatures, TEMPLATE_PRESETS } from '../cli.js';
import type { PluginFeature, PluginConfig } from '../types.js';

// --- Arbitraries ---

const pluginFeatureArb = fc.constantFrom<PluginFeature>(
	'sidebar',
	'database',
	'remote_functions',
	'datatable',
	'notifications',
	'i18n'
);

function baseConfig(features: PluginFeature[]): PluginConfig {
	return {
		pluginId: 'test-plugin',
		displayName: 'Test Plugin',
		description: '',
		author: '',
		features,
		install: false
	};
}

// --- hasFeature properties ---

describe('hasFeature', () => {
	// Feature: cli-feature-based-wizard, Property 1: hasFeature identity
	it('Property 1a: hasFeature({features:[f]}, f) === true minden PluginFeature értékre', () => {
		fc.assert(
			fc.property(pluginFeatureArb, (f) => {
				return hasFeature(baseConfig([f]), f) === true;
			}),
			{ numRuns: 100 }
		);
	});

	it('Property 1b: hasFeature({features:[]}, f) === false minden PluginFeature értékre', () => {
		fc.assert(
			fc.property(pluginFeatureArb, (f) => {
				return hasFeature(baseConfig([]), f) === false;
			}),
			{ numRuns: 100 }
		);
	});
});

// --- normalizeFeatures properties ---

const pluginFeaturesArb = fc.array(pluginFeatureArb, { minLength: 0, maxLength: 6 });

describe('normalizeFeatures', () => {
	// Feature: cli-feature-based-wizard, Property 2: database implies remote_functions
	it('Property 2: ha az eredmény tartalmazza a "database"-t, tartalmaznia kell a "remote_functions"-t is', () => {
		fc.assert(
			fc.property(pluginFeaturesArb, (features) => {
				const result = normalizeFeatures(features);
				if (result.includes('database')) {
					return result.includes('remote_functions');
				}
				return true;
			}),
			{ numRuns: 100 }
		);
	});

	// Feature: cli-feature-based-wizard, Property 3: no remote_functions implies no database
	it('Property 3: ha a bemenet nem tartalmaz "remote_functions"-t, a kimenet sem tartalmaz "database"-t', () => {
		fc.assert(
			fc.property(pluginFeaturesArb, (features) => {
				const input = features.filter((f) => f !== 'remote_functions');
				const result = normalizeFeatures(input);
				return !result.includes('database');
			}),
			{ numRuns: 100 }
		);
	});

	// Feature: cli-feature-based-wizard, Property 4: idempotence
	it('Property 4: normalizeFeatures(normalizeFeatures(f)) egyenlő normalizeFeatures(f)-fel', () => {
		fc.assert(
			fc.property(pluginFeaturesArb, (features) => {
				const once = normalizeFeatures(features);
				const twice = normalizeFeatures(once);
				return once.length === twice.length && once.every((f, i) => f === twice[i]);
			}),
			{ numRuns: 100 }
		);
	});
});

// --- computePermissions properties ---

const validPermissions = new Set(['database', 'remote_functions', 'notifications']);

describe('computePermissions', () => {
	// Feature: cli-feature-based-wizard, Property 5: only valid permission values
	it('Property 5: a kimenet csak érvényes jogosultság értékeket tartalmaz', () => {
		// Validates: Requirements 6.3, 16.2
		fc.assert(
			fc.property(pluginFeaturesArb, (features) => {
				const result = computePermissions(features);
				return result.every((p) => validPermissions.has(p));
			}),
			{ numRuns: 100 }
		);
	});

	// Feature: cli-feature-based-wizard, Property 6: no duplicates
	it('Property 6: a kimenet nem tartalmaz duplikátumokat (beleértve duplikált bemeneteket is)', () => {
		// Validates: Requirements 6.3, 16.2
		fc.assert(
			fc.property(pluginFeaturesArb, (features) => {
				const result = computePermissions(features);
				return new Set(result).size === result.length;
			}),
			{ numRuns: 100 }
		);
	});

	it('Property 6 (explicit): duplikált bemenet esetén sincs duplikátum a kimenetben', () => {
		const result = computePermissions(['database', 'database', 'notifications']);
		return new Set(result).size === result.length;
	});
});

// --- TEMPLATE_PRESETS properties ---

describe('TEMPLATE_PRESETS', () => {
	// Feature: cli-feature-based-wizard, Property 7: sidebar and datatable presets always contain database + remote_functions
	it('Property 7: a sidebar és datatable presetek mindig tartalmazzák a "database" és "remote_functions" feature-öket', () => {
		// Validates: Requirements 15.2, 16.4
		for (const key of ['sidebar', 'datatable'] as const) {
			const features = TEMPLATE_PRESETS[key];
			expect(features).toContain('database');
			expect(features).toContain('remote_functions');
		}
	});
});

// --- parseFeatures properties ---

const validFeatureNames = new Set<string>([
	'sidebar',
	'database',
	'remote_functions',
	'datatable',
	'notifications',
	'i18n'
]);

describe('parseFeatures', () => {
	// Feature: cli-feature-based-wizard, Property 8: unknown feature names are rejected
	it('Property 8: ismeretlen feature név esetén parseFeatures hibát dob', () => {
		// Validates: Requirements 4.3
		const unknownStringArb = fc.string({ minLength: 1 }).filter((s) => {
			const trimmed = s.trim();
			return trimmed.length > 0 && !validFeatureNames.has(trimmed);
		});

		fc.assert(
			fc.property(unknownStringArb, (unknown) => {
				let threw = false;
				try {
					parseFeatures(unknown);
				} catch {
					threw = true;
				}
				return threw;
			}),
			{ numRuns: 100 }
		);
	});
});
