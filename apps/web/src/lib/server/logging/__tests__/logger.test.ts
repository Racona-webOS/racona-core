/**
 * Property-Based Tests for Log Level Filtering
 *
 * Feature: error-logging
 *
 * Property 1: Szint szűrés helyessége
 * _Bármely_ LogEntry és _bármely_ konfigurált minimális szint esetén, a Logger csak akkor
 * továbbítja a bejegyzést a transportoknak, ha a bejegyzés szintjének prioritása nagyobb
 * vagy egyenlő a minimális szint prioritásával.
 *
 * **Validates: Requirements 1.3**
 */
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { LOG_LEVEL_PRIORITY } from '../types.js';
import type { LogLevel, LogEntry, LogTransport } from '../types.js';

// Mock env to avoid DATABASE_URL validation when importing logger.ts
vi.mock('$lib/env', () => ({
	env: {
		LOG_TARGETS: 'console',
		LOG_LEVEL: 'error',
		LOG_DIR: './logs'
	}
}));

// Import Logger after mock is set up
const { Logger } = await import('../logger.js');

const testConfig = { numRuns: 100 };

const ALL_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
const levelArbitrary = fc.constantFrom(...ALL_LEVELS);

function createSpyTransport(): LogTransport & { entries: LogEntry[] } {
	const entries: LogEntry[] = [];
	return {
		name: 'spy',
		entries,
		async write(entry: LogEntry) {
			entries.push(entry);
		}
	};
}

describe('Feature: error-logging, Property 1: Szint szűrés helyessége', () => {
	it('forwards entry iff its priority >= configured minimum level priority', async () => {
		await fc.assert(
			fc.asyncProperty(
				levelArbitrary,
				levelArbitrary,
				fc.string({ minLength: 1 }),
				async (entryLevel, minLevel, message) => {
					const transport = createSpyTransport();
					const logger = new Logger({
						targets: [],
						level: minLevel,
						logDir: './logs'
					});

					// Inject spy transport directly
					(logger as any).transports = [transport];

					await logger.log(entryLevel, message);

					const shouldBeForwarded = LOG_LEVEL_PRIORITY[entryLevel] >= LOG_LEVEL_PRIORITY[minLevel];

					if (shouldBeForwarded) {
						expect(transport.entries).toHaveLength(1);
						expect(transport.entries[0].level).toBe(entryLevel);
					} else {
						expect(transport.entries).toHaveLength(0);
					}
				}
			),
			testConfig
		);
	});
});
