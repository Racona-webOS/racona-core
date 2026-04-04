/**
 * Property-Based Tests for LogEntry Fields Invariant
 *
 * Feature: error-logging
 *
 * Property 3: LogEntry mezők invariánsa
 * _Bármely_ naplózási hívás esetén, a Logger által létrehozott LogEntry mindig tartalmazza
 * az `id` (érvényes UUID), `timestamp` (érvényes ISO 8601), `source` (nem üres string),
 * `level` és `message` mezőket.
 *
 * **Validates: Requirements 1.4, 3.2**
 */
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import type { LogLevel, LogEntry, LogTransport } from '../types.js';

vi.mock('$lib/env', () => ({
	env: {
		LOG_TARGETS: 'console',
		LOG_LEVEL: 'debug',
		LOG_DIR: './logs'
	}
}));

const { Logger } = await import('../logger.js');

const testConfig = { numRuns: 100 };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALL_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
const levelArbitrary = fc.constantFrom(...ALL_LEVELS);

function createCapturingTransport(): LogTransport & { entries: LogEntry[] } {
	const entries: LogEntry[] = [];
	return {
		name: 'capture',
		entries,
		async write(entry: LogEntry) {
			entries.push(entry);
		}
	};
}

describe('Feature: error-logging, Property 3: LogEntry mezők invariánsa', () => {
	it('every logged entry has valid id (UUID), timestamp (ISO 8601), non-empty source, level, and message', async () => {
		await fc.assert(
			fc.asyncProperty(
				levelArbitrary,
				fc.string({ minLength: 1 }),
				fc.option(fc.string({ minLength: 1 })),
				async (level, message, source) => {
					const transport = createCapturingTransport();
					const logger = new Logger({
						targets: [],
						level: 'debug',
						logDir: './logs'
					});
					(logger as any).transports = [transport];

					const context = source !== null ? { source } : undefined;
					await logger.log(level, message, context);

					expect(transport.entries).toHaveLength(1);
					const entry = transport.entries[0];

					// id must be a valid UUID
					expect(entry.id).toMatch(UUID_REGEX);

					// timestamp must be a valid ISO 8601 date
					const parsed = new Date(entry.timestamp);
					expect(parsed.getTime()).not.toBeNaN();
					expect(entry.timestamp).toBe(parsed.toISOString());

					// source must be a non-empty string
					expect(typeof entry.source).toBe('string');
					expect(entry.source.length).toBeGreaterThan(0);

					// level must match the requested level
					expect(entry.level).toBe(level);

					// message must match the requested message
					expect(entry.message).toBe(message);
				}
			),
			testConfig
		);
	});
});
