/**
 * Property-based tesztek a CLI generator logikájához.
 * Feature: cli-feature-based-wizard
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { hasFeature, normalizeFeatures, computePermissions } from '../generator.js';
import type { PluginConfig, PluginFeature } from '../types.js';

// --- Arbitraries ---

const allFeatures: PluginFeature[] = [
	'sidebar',
	'database',
	'remote_functions',
	'datatable',
	'notifications',
	'i18n'
];

const featureArb = fc.constantFrom(...allFeatures);

const featuresArb = fc.array(featureArb, { minLength: 0, maxLength: 6 });

const pluginIdArb = fc.stringMatching(/^[a-z][a-z0-9-]*$/);

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
	// Feature: cli-feature-based-wizard, Property 1a: hasFeature({features:[f]}, f) === true
	it('Property 1a: hasFeature({features:[f]}, f) === true minden PluginFeature értékre', () => {
		fc.assert(
			fc.property(featureArb, (f) => {
				return hasFeature(baseConfig([f]), f) === true;
			}),
			{ numRuns: 100 }
		);
	});

	// Feature: cli-feature-based-wizard, Property 1b: hasFeature({features:[]}, f) === false
	it('Property 1b: hasFeature({features:[]}, f) === false minden PluginFeature értékre', () => {
		fc.assert(
			fc.property(featureArb, (f) => {
				return hasFeature(baseConfig([]), f) === false;
			}),
			{ numRuns: 100 }
		);
	});

	it('determinisztikus — kétszeri hívás ugyanazt adja, config nem módosul', () => {
		fc.assert(
			fc.property(featuresArb, featureArb, (features, f) => {
				const config = baseConfig(features);
				const configCopy = JSON.stringify(config);
				const result1 = hasFeature(config, f);
				const result2 = hasFeature(config, f);
				return result1 === result2 && JSON.stringify(config) === configCopy;
			}),
			{ numRuns: 100 }
		);
	});
});

// --- normalizeFeatures properties ---

describe('normalizeFeatures', () => {
	// Feature: cli-feature-based-wizard, Property 2: database implies remote_functions
	it('Property 2: ha az eredmény tartalmazza a "database"-t, tartalmaznia kell a "remote_functions"-t is', () => {
		fc.assert(
			fc.property(featuresArb, (features) => {
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
			fc.property(featuresArb, (features) => {
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
			fc.property(featuresArb, (features) => {
				const once = normalizeFeatures(features);
				const twice = normalizeFeatures(once);
				return JSON.stringify(once.sort()) === JSON.stringify(twice.sort());
			}),
			{ numRuns: 100 }
		);
	});
});

// --- computePermissions properties ---

describe('computePermissions', () => {
	// Feature: cli-feature-based-wizard, Property 5: only valid permission values
	it('Property 5: a kimenet csak érvényes jogosultság értékeket tartalmaz', () => {
		const validPerms = new Set(['database', 'remote_functions', 'notifications']);
		fc.assert(
			fc.property(featuresArb, (features) => {
				const result = computePermissions(features);
				return result.every((p) => validPerms.has(p));
			}),
			{ numRuns: 100 }
		);
	});

	// Feature: cli-feature-based-wizard, Property 6: no duplicates
	it('Property 6: a kimenet nem tartalmaz duplikátumokat (beleértve duplikált bemeneteket is)', () => {
		fc.assert(
			fc.property(featuresArb, (features) => {
				const result = computePermissions(features);
				return new Set(result).size === result.length;
			}),
			{ numRuns: 100 }
		);
	});

	it('Property 6 (explicit): duplikált bemenet esetén sincs duplikátum a kimenetben', () => {
		const result = computePermissions([
			'database',
			'database',
			'remote_functions',
			'remote_functions'
		]);
		expect(new Set(result).size).toBe(result.length);
	});
});

// --- Placeholder csere properties ---

/**
 * Egyszerű placeholder csere logika (a replaceTemplatePlaceholders belső logikájának tükre).
 * Tesztelési célra kiemelve.
 */
function applyPlaceholders(content: string, pluginId: string): string {
	const pluginIdUnderscore = pluginId.replace(/-/g, '_');
	return content
		.replaceAll('__PLUGIN_ID_UNDERSCORE__', pluginIdUnderscore)
		.replaceAll('__PLUGIN_ID__', pluginId);
}

describe('placeholder csere', () => {
	// Feature: cli-feature-based-wizard, Property 5: Placeholder csere teljessége
	it('Property 5: csere után nincs maradék placeholder', () => {
		fc.assert(
			fc.property(pluginIdArb, fc.string(), (pluginId, content) => {
				const withPlaceholders = content + '__PLUGIN_ID__' + content + '__PLUGIN_ID_UNDERSCORE__';
				const result = applyPlaceholders(withPlaceholders, pluginId);
				return !result.includes('__PLUGIN_ID_UNDERSCORE__') && !result.includes('__PLUGIN_ID__');
			}),
			{ numRuns: 100 }
		);
	});

	// Feature: cli-feature-based-wizard, Property 6: Placeholder csere round-trip egyenértékűsége
	it('Property 6: __PLUGIN_ID_UNDERSCORE__ csere eredménye === pluginId.replace(/-/g, "_")', () => {
		fc.assert(
			fc.property(pluginIdArb, (pluginId) => {
				const result = applyPlaceholders('__PLUGIN_ID_UNDERSCORE__', pluginId);
				return result === pluginId.replace(/-/g, '_');
			}),
			{ numRuns: 100 }
		);
	});

	// Feature: cli-feature-based-wizard, Property 7: Placeholder csere idempotenciája
	it('Property 7: kétszeri csere ugyanazt adja, mint az egyszeri', () => {
		fc.assert(
			fc.property(pluginIdArb, fc.string(), (pluginId, content) => {
				const once = applyPlaceholders(content, pluginId);
				const twice = applyPlaceholders(once, pluginId);
				return once === twice;
			}),
			{ numRuns: 100 }
		);
	});

	// Feature: cli-feature-based-wizard, Property 8: kötőjel nélküli pluginId esetén UNDERSCORE === ID
	it('Property 8: kötőjel nélküli pluginId esetén __PLUGIN_ID_UNDERSCORE__ === __PLUGIN_ID__', () => {
		fc.assert(
			fc.property(fc.stringMatching(/^[a-z][a-z0-9]*$/), (pluginId) => {
				const underscore = applyPlaceholders('__PLUGIN_ID_UNDERSCORE__', pluginId);
				const plain = applyPlaceholders('__PLUGIN_ID__', pluginId);
				return underscore === plain;
			}),
			{ numRuns: 100 }
		);
	});
});
