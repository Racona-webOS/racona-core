/**
 * Property-Based Tests for LogEntry Serialization Round-Trip
 *
 * Feature: error-logging
 *
 * Property 9: LogEntry szerializáció round-trip
 * _Bármely_ érvényes LogEntry objektum esetén, a JSON-ba szerializálás majd
 * visszaolvasás az eredeti objektummal ekvivalens objektumot eredményez:
 * `deserialize(serialize(entry))` egyenlő `entry`-vel.
 *
 * **Validates: Requirements 7.3**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { serialize, deserialize } from '../serializer.js';
import type { LogEntry } from '../types.js';

// Minimum 100 iteráció property tesztenként
const testConfig = { numRuns: 100 };

// ============================================================================
// Generátorok
// ============================================================================

const logLevelArbitrary = fc.constantFrom(
	'debug',
	'info',
	'warn',
	'error',
	'fatal'
) as fc.Arbitrary<LogEntry['level']>;

const logEntryArbitrary: fc.Arbitrary<LogEntry> = fc.record({
	id: fc.uuid(),
	level: logLevelArbitrary,
	message: fc.string({ minLength: 1 }),
	source: fc.string({ minLength: 1 }),
	timestamp: fc
		.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') })
		.filter((d) => !isNaN(d.getTime()))
		.map((d) => d.toISOString()),
	stack: fc.option(fc.string(), { nil: undefined }),
	context: fc.option(
		fc.dictionary(
			fc.string(),
			fc.jsonValue().filter((v) => {
				// -0 kizárása: JSON.stringify(-0) === '0', de Object.is(-0, 0) === false
				if (Object.is(v, -0)) return false;
				// Nested objektumokban is kizárjuk a -0-t
				if (typeof v === 'object' && v !== null) {
					return JSON.stringify(v) === JSON.stringify(JSON.parse(JSON.stringify(v)));
				}
				return true;
			})
		),
		{ nil: undefined }
	),
	userId: fc.option(fc.string(), { nil: undefined }),
	url: fc.option(fc.webUrl(), { nil: undefined }),
	method: fc.option(fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'), { nil: undefined }),
	routeId: fc.option(fc.string(), { nil: undefined }),
	userAgent: fc.option(fc.string(), { nil: undefined })
});

// ============================================================================
// Property tesztek
// ============================================================================

describe('Feature: error-logging, Property 9: LogEntry szerializáció round-trip', () => {
	it('deserialize(serialize(entry)) should equal the original entry', () => {
		fc.assert(
			fc.property(logEntryArbitrary, (entry: LogEntry) => {
				const result = deserialize(serialize(entry));
				// JSON round-trip összehasonlítás: -0 és más nem-JSON-safe értékek kizárva
				expect(JSON.stringify(result)).toBe(JSON.stringify(entry));
			}),
			testConfig
		);
	});
});
