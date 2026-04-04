/**
 * Property-Based Tests for SvelteKit Request Context
 *
 * Feature: error-logging
 *
 * Property 7: SvelteKit request kontextus
 * _Bármely_ szerver oldali SvelteKit hiba esetén, a Logger által rögzített LogEntry
 * tartalmazza a request `url`, `method` és `routeId` mezőket, amennyiben azok
 * elérhetők a request kontextusból.
 *
 * **Validates: Requirements 5.3**
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
const httpMethodArbitrary = fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH');

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

describe('Feature: error-logging, Property 7: SvelteKit request kontextus', () => {
	it('server-side errors contain url, method, and routeId when provided in context', async () => {
		await fc.assert(
			fc.asyncProperty(
				levelArbitrary,
				fc.string({ minLength: 1 }),
				fc.string({ minLength: 1 }),
				httpMethodArbitrary,
				fc.string({ minLength: 1 }),
				async (level, message, url, method, routeId) => {
					const transport = createCapturingTransport();
					const logger = new Logger({
						targets: [],
						level: 'debug',
						logDir: './logs'
					});
					(logger as any).transports = [transport];

					// Simulate how handleError in hooks.server.ts logs errors
					await logger.log(level, message, {
						source: 'server',
						url,
						method,
						routeId
					});

					expect(transport.entries).toHaveLength(1);
					const entry = transport.entries[0];

					// url must be present and match
					expect(entry.url).toBe(url);

					// method must be present and match
					expect(entry.method).toBe(method);

					// routeId must be present and match
					expect(entry.routeId).toBe(routeId);

					// source must be 'server'
					expect(entry.source).toBe('server');
				}
			),
			testConfig
		);
	});
});
