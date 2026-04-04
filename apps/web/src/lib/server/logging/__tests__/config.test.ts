/**
 * Property-Based Tests for Configuration Validation and Defaults
 *
 * Feature: error-logging
 *
 * Property 8: Konfiguráció validáció és alapértelmezések
 * _Bármely_ környezeti változó kombináció esetén (beleértve a hiányzó vagy érvénytelen értékeket),
 * a konfiguráció validáció mindig érvényes konfigurációt eredményez: érvényes értékek megmaradnak,
 * érvénytelenek az alapértelmezésre esnek vissza.
 *
 * **Validates: Requirements 6.1, 6.5**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseLogTargets, parseLogLevel, createLogConfig } from '../config.js';
import { LOG_LEVEL_PRIORITY } from '../types.js';
import type { LogLevel } from '../types.js';

const testConfig = { numRuns: 100 };

const VALID_TARGETS = ['console', 'file', 'database'] as const;
const VALID_LEVELS: LogLevel[] = Object.keys(LOG_LEVEL_PRIORITY) as LogLevel[];

// ============================================================================
// Generátorok
// ============================================================================

const validTargetArbitrary = fc.constantFrom(...VALID_TARGETS);
const validLevelArbitrary = fc.constantFrom(...VALID_LEVELS);
const arbitraryString = fc.string();

// ============================================================================
// Property tesztek
// ============================================================================

describe('Feature: error-logging, Property 8: Konfiguráció validáció és alapértelmezések', () => {
	it('valid env values are preserved, invalid values fall back to defaults', () => {
		fc.assert(
			fc.property(
				arbitraryString,
				arbitraryString,
				arbitraryString,
				(rawTargets, rawLevel, rawDir) => {
					const config = createLogConfig(rawTargets, rawLevel, rawDir);

					// Config always has at least one target
					expect(config.targets.length).toBeGreaterThanOrEqual(1);

					// All targets are valid
					for (const t of config.targets) {
						expect(VALID_TARGETS).toContain(t);
					}

					// Level is always valid
					expect(VALID_LEVELS).toContain(config.level);

					// logDir is never empty
					expect(config.logDir.length).toBeGreaterThan(0);

					// If rawLevel is a valid level, it's preserved
					const normalizedLevel = rawLevel.trim().toLowerCase();
					if (VALID_LEVELS.includes(normalizedLevel as LogLevel)) {
						expect(config.level).toBe(normalizedLevel);
					} else {
						expect(config.level).toBe('error');
					}

					// If rawDir is non-empty, it's preserved; otherwise default
					if (rawDir) {
						expect(config.logDir).toBe(rawDir);
					} else {
						expect(config.logDir).toBe('./logs');
					}

					// If rawTargets contains at least one valid target, only valid ones are kept
					const parsedTargets = rawTargets
						.split(',')
						.map((t) => t.trim().toLowerCase())
						.filter((t) => (VALID_TARGETS as readonly string[]).includes(t));
					if (parsedTargets.length > 0) {
						expect(config.targets).toEqual(parsedTargets);
					} else {
						expect(config.targets).toEqual(['console']);
					}
				}
			),
			testConfig
		);
	});
});
