/**
 * Property-Based Tests for Transport Forwarding
 *
 * Feature: error-logging
 *
 * Property 2: Továbbítás minden aktív transportnak
 * _Bármely_ LogEntry esetén, amely eléri a minimális szintet, a Logger az összes konfigurált
 * transportnak továbbítja a bejegyzést, és minden transport pontosan egyszer kapja meg.
 *
 * **Validates: Requirements 1.2**
 */
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { LOG_LEVEL_PRIORITY } from '../types.js';
import type { LogLevel, LogEntry, LogTransport } from '../types.js';

vi.mock('$lib/env', () => ({
	env: {
		LOG_TARGETS: 'console',
		LOG_LEVEL: 'error',
		LOG_DIR: './logs'
	}
}));

const { Logger } = await import('../logger.js');

const testConfig = { numRuns: 100 };

const ALL_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
const levelArbitrary = fc.constantFrom(...ALL_LEVELS);

function createSpyTransport(name: string): LogTransport & { entries: LogEntry[] } {
	const entries: LogEntry[] = [];
	return {
		name,
		entries,
		async write(entry: LogEntry) {
			entries.push(entry);
		}
	};
}

describe('Feature: error-logging, Property 2: Továbbítás minden aktív transportnak', () => {
	it('forwards entry to ALL configured transports exactly once when level meets minimum', async () => {
		await fc.assert(
			fc.asyncProperty(
				levelArbitrary,
				fc.string({ minLength: 1 }),
				fc.integer({ min: 1, max: 5 }),
				async (entryLevel, message, transportCount) => {
					// Use 'debug' as min level so all entries pass the filter
					const logger = new Logger({
						targets: [],
						level: 'debug',
						logDir: './logs'
					});

					const transports = Array.from({ length: transportCount }, (_, i) =>
						createSpyTransport(`spy-${i}`)
					);

					(logger as any).transports = transports;

					await logger.log(entryLevel, message);

					// Every transport should receive exactly one entry
					for (const transport of transports) {
						expect(transport.entries).toHaveLength(1);
						expect(transport.entries[0].level).toBe(entryLevel);
						expect(transport.entries[0].message).toBe(message);
					}

					// All transports received the same entry (same id)
					const ids = transports.map((t) => t.entries[0].id);
					expect(new Set(ids).size).toBe(1);
				}
			),
			testConfig
		);
	});
});
