/**
 * Property-Based Tests for Client Error Source and Fields
 *
 * Feature: error-logging
 *
 * Property 6: Kliens hibák forrás megjelölése és mezői
 * _Bármely_ kliens oldali hiba esetén, a szerveren rögzített LogEntry `source` mezője
 * `client` értékű, és tartalmazza a `url`, `userAgent` és `timestamp` mezőket.
 *
 * **Validates: Requirements 4.3, 4.4**
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

describe('Feature: error-logging, Property 6: Kliens hibák forrás megjelölése és mezői', () => {
	it('client errors are logged with source "client" and contain url, userAgent, and timestamp', async () => {
		await fc.assert(
			fc.asyncProperty(
				levelArbitrary,
				fc.string({ minLength: 1 }),
				fc.webUrl(),
				fc.string({ minLength: 1 }),
				async (level, message, url, userAgent) => {
					const transport = createCapturingTransport();
					const logger = new Logger({
						targets: [],
						level: 'debug',
						logDir: './logs'
					});
					(logger as any).transports = [transport];

					await logger.log(level, message, {
						source: 'client',
						url,
						userAgent
					});

					expect(transport.entries).toHaveLength(1);
					const entry = transport.entries[0];

					// source must be 'client'
					expect(entry.source).toBe('client');

					// url must be present and match the provided value
					expect(entry.url).toBe(url);

					// userAgent must be present and match the provided value
					expect(entry.userAgent).toBe(userAgent);

					// timestamp must be a valid ISO 8601 string
					const parsed = new Date(entry.timestamp);
					expect(parsed.getTime()).not.toBeNaN();
					expect(entry.timestamp).toBe(parsed.toISOString());
				}
			),
			testConfig
		);
	});
});
