/**
 * Property-Based Tests for JSON Lines Format
 *
 * Feature: error-logging
 *
 * Property 4: JSON Lines formátum
 * _Bármely_ LogEntry sorozat esetén, a FileTransport kimenete érvényes JSON Lines
 * formátumú: minden sor önmagában érvényes JSON, és visszaolvasva az eredeti
 * LogEntry-vel ekvivalens objektumot ad.
 *
 * **Validates: Requirements 2.2**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { serialize, deserialize } from '../../serializer.js';
import type { LogEntry } from '../../types.js';

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
	timestamp: fc.date({ noInvalidDate: true }).map((d) => d.toISOString()),
	stack: fc.option(fc.string(), { nil: undefined }),
	context: fc.option(
		fc.dictionary(
			fc.string(),
			fc.jsonValue().filter((v) => !Object.is(v, -0))
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

describe('Feature: error-logging, Property 4: JSON Lines formátum', () => {
	it('a serialized sequence of LogEntries forms valid JSON Lines where each line round-trips back to the original entry', () => {
		fc.assert(
			fc.property(
				fc.array(logEntryArbitrary, { minLength: 1, maxLength: 10 }),
				(entries: LogEntry[]) => {
					// Build JSON Lines output the same way FileTransport does
					const jsonLines = entries.map((e) => serialize(e) + '\n').join('');

					// Split into lines, filter out trailing empty line from final \n
					const lines = jsonLines.split('\n').filter((l) => l.length > 0);

					expect(lines).toHaveLength(entries.length);

					for (let i = 0; i < lines.length; i++) {
						// Each line must be independently valid JSON
						const parsed = deserialize(lines[i]);
						// JSON round-trip összehasonlítás (-0 és hasonló edge case-ek kizárva)
						expect(JSON.stringify(parsed)).toBe(JSON.stringify(entries[i]));
					}
				}
			),
			testConfig
		);
	});
});
