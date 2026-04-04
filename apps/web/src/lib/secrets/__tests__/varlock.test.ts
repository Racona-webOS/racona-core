/**
 * Varlock tesztek — bootstrap credentials, round-trip, fallback, retry, naplózás
 *
 * Validates: Requirements 2.6, 3.5, 4.3, 7.1, 7.2, 7.3, 7.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
	initVarlock,
	loadAndValidate,
	loadSecretsWithFallback,
	fetchWithRetry,
	createVarlockClient,
	type InfisicalClient
} from '../varlock.js';
import { validEnvArbitrary, REQUIRED_KEYS } from '../schema.js';

// =============================================================================
// Segédfüggvények
// =============================================================================

/** Érvényes alap env objektum a tesztekhez */
function makeValidEnv(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		INFISICAL_CLIENT_ID: 'test-client-id',
		INFISICAL_CLIENT_SECRET: 'test-client-secret',
		NODE_ENV: 'development',
		DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
		APP_URL: 'http://localhost:3000',
		ORIGIN: 'http://localhost:3000',
		BETTER_AUTH_SECRET: 'test-secret',
		BETTER_AUTH_URL: 'http://localhost:3000',
		...overrides
	};
}

/** Mock Infisical kliens, amely sikeresen visszaad secreteket */
function createMockInfisical(
	secrets: Record<string, unknown> = makeValidEnv(),
	options: { environment?: string; project?: string } = {}
): InfisicalClient & { attemptCount: number } {
	return {
		environment: options.environment ?? 'development',
		project: options.project ?? 'elyos-core',
		attemptCount: 0,
		async fetchSecrets() {
			return secrets;
		}
	};
}

/** Mock Infisical kliens, amely mindig hibát dob (nem elérhető) */
function createUnavailableMockInfisical(
	options: { environment?: string; project?: string } = {}
): InfisicalClient & { attemptCount: number } {
	const client = {
		environment: options.environment ?? 'development',
		project: options.project ?? 'elyos-core',
		attemptCount: 0,
		async fetchSecrets(): Promise<Record<string, unknown>> {
			client.attemptCount++;
			throw new Error('Connection refused: https://secrets.elyos.hu');
		}
	};
	return client;
}

/**
 * Mock Infisical kliens token megújítás támogatással.
 * Nyomon követi a megújítási hívások számát.
 */
function createMockInfisicalWithRenewal(
	secrets: Record<string, unknown> = makeValidEnv(),
	options: { environment?: string; project?: string } = {}
): InfisicalClient & { attemptCount: number; renewTokenCallCount: number } {
	const client = {
		environment: options.environment ?? 'development',
		project: options.project ?? 'elyos-core',
		attemptCount: 0,
		renewTokenCallCount: 0,
		async fetchSecrets(): Promise<Record<string, unknown>> {
			return secrets;
		},
		async renewToken(): Promise<string> {
			client.renewTokenCallCount++;
			return 'new-mock-token';
		}
	};
	return client;
}

// =============================================================================
// 1. tulajdonság: Érvénytelen bootstrap credentials → validáció hibát dob
// Feature: secrets-management, Property 1: Érvénytelen bootstrap credentials → validáció hibát dob
// Validates: Requirements 2.6, 3.5
// =============================================================================

describe('initVarlock — bootstrap credentials validáció', () => {
	it('érvényes credentials esetén visszaadja a validált objektumot', () => {
		const result = initVarlock({ clientId: 'abc', clientSecret: 'xyz' });
		expect(result).toEqual({ clientId: 'abc', clientSecret: 'xyz' });
	});

	it('üres clientId esetén hibát dob', () => {
		expect(() => initVarlock({ clientId: '', clientSecret: 'xyz' })).toThrow();
	});

	it('null clientId esetén hibát dob', () => {
		expect(() => initVarlock({ clientId: null, clientSecret: 'xyz' })).toThrow();
	});

	it('undefined clientId esetén hibát dob', () => {
		expect(() => initVarlock({ clientId: undefined, clientSecret: 'xyz' })).toThrow();
	});

	it('üres clientSecret esetén hibát dob', () => {
		expect(() => initVarlock({ clientId: 'abc', clientSecret: '' })).toThrow();
	});

	/**
	 * **Validates: Requirements 2.6, 3.5**
	 * 1. tulajdonság: Érvénytelen bootstrap credentials → validáció hibát dob
	 */
	it('PBT: bármely érvénytelen clientId esetén hibát dob', () => {
		fc.assert(
			fc.property(
				fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined)),
				fc.string({ minLength: 1 }),
				(clientId, clientSecret) => {
					expect(() => initVarlock({ clientId, clientSecret })).toThrow();
				}
			),
			{ numRuns: 100 }
		);
	});

	it('PBT: bármely érvénytelen clientSecret esetén hibát dob', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1 }),
				fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined)),
				(clientId, clientSecret) => {
					expect(() => initVarlock({ clientId, clientSecret })).toThrow();
				}
			),
			{ numRuns: 100 }
		);
	});
});

// =============================================================================
// 3. tulajdonság: Round-trip — séma → betöltés → validált objektum
// Feature: secrets-management, Property 3: Round-trip — séma → betöltés → validált objektum
// Validates: Requirements 7.1, 7.2, 5.5
// =============================================================================

describe('loadAndValidate — round-trip tulajdonság', () => {
	it('érvényes env objektumot visszaad változatlanul', () => {
		const env = makeValidEnv();
		const result = loadAndValidate(env);
		expect(result).toBeDefined();
		for (const key of REQUIRED_KEYS) {
			expect(result[key]).toBe(env[key]);
		}
	});

	it('érvénytelen env esetén hibát dob', () => {
		expect(() => loadAndValidate({})).toThrow();
	});

	/**
	 * **Validates: Requirements 7.1, 7.2, 5.5**
	 * 3. tulajdonság: Round-trip — séma → betöltés → validált objektum
	 */
	it('PBT: bármely valid env objektumra a kötelező kulcsok értékei megmaradnak', () => {
		fc.assert(
			fc.property(validEnvArbitrary(), (secrets) => {
				const loaded = loadAndValidate(secrets);
				for (const key of REQUIRED_KEYS) {
					expect(loaded[key]).toBe(secrets[key]);
				}
			}),
			{ numRuns: 100 }
		);
	});
});

// =============================================================================
// 9.4 Unit teszt: fallback mód
// Validates: Requirements 4.3
// =============================================================================

describe('loadSecretsWithFallback — fallback mód', () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		// Visszaállítjuk az eredeti process.env-t minden teszt előtt
		Object.keys(process.env).forEach((k) => delete process.env[k]);
		Object.assign(process.env, originalEnv);
	});

	afterEach(() => {
		delete process.env.VARLOCK_FALLBACK;
	});

	it('VARLOCK_FALLBACK=local esetén a secreteket a process.env-ből olvassa', async () => {
		// Beállítjuk a fallback módot és a szükséges env változókat
		process.env.VARLOCK_FALLBACK = 'local';
		process.env.INFISICAL_CLIENT_ID = 'test-id';
		process.env.INFISICAL_CLIENT_SECRET = 'test-secret';
		process.env.NODE_ENV = 'development';
		process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
		process.env.APP_URL = 'http://localhost:3000';
		process.env.ORIGIN = 'http://localhost:3000';
		process.env.BETTER_AUTH_SECRET = 'auth-secret';
		process.env.BETTER_AUTH_URL = 'http://localhost:3000';

		const result = await loadSecretsWithFallback({});

		expect(result.source).toBe('local');
		expect(result.secrets).toBeDefined();
		expect(result.secrets['NODE_ENV']).toBe('development');
	});

	it('VARLOCK_FALLBACK=local esetén az Infisical kliens nem kerül meghívásra', async () => {
		process.env.VARLOCK_FALLBACK = 'local';
		process.env.INFISICAL_CLIENT_ID = 'test-id';
		process.env.INFISICAL_CLIENT_SECRET = 'test-secret';
		process.env.NODE_ENV = 'development';
		process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
		process.env.APP_URL = 'http://localhost:3000';
		process.env.ORIGIN = 'http://localhost:3000';
		process.env.BETTER_AUTH_SECRET = 'auth-secret';
		process.env.BETTER_AUTH_URL = 'http://localhost:3000';

		const mockInfisical = createMockInfisical();
		const fetchSpy = vi.spyOn(mockInfisical, 'fetchSecrets');

		await loadSecretsWithFallback({ infisical: mockInfisical });

		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('Infisical módban a forrás "infisical"', async () => {
		delete process.env.VARLOCK_FALLBACK;
		const mockInfisical = createMockInfisical(makeValidEnv());

		const result = await loadSecretsWithFallback({ infisical: mockInfisical });

		expect(result.source).toBe('infisical');
		expect(result.secrets).toBeDefined();
	});
});

// =============================================================================
// 9.5 Unit teszt: 3 újrapróbálkozás
// Validates: Requirements 7.4
// =============================================================================

describe('fetchWithRetry — 3 újrapróbálkozás', () => {
	it('sikeres lekérés esetén visszaadja a secreteket', async () => {
		const mockInfisical = createMockInfisical(makeValidEnv());
		const result = await fetchWithRetry(mockInfisical);
		expect(result).toBeDefined();
	});

	it('nem elérhető Infisical esetén pontosan 3 kísérlet után leállítja az alkalmazást', async () => {
		const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
			throw new Error('process.exit called');
		}) as never);

		// setTimeout mock-olása, hogy a retry delay-ek azonnal fussanak
		const originalSetTimeout = global.setTimeout;
		(global as unknown as Record<string, unknown>).setTimeout = (fn: () => void) => {
			fn();
			return 0;
		};

		const mockInfisical = createUnavailableMockInfisical();

		try {
			await expect(fetchWithRetry(mockInfisical)).rejects.toThrow('process.exit called');
			expect(mockExit).toHaveBeenCalledWith(1);
		} finally {
			global.setTimeout = originalSetTimeout;
			mockExit.mockRestore();
		}
	});
});

// =============================================================================
// 9.6 Unit teszt: betöltési naplózás
// Validates: Requirements 7.3
// =============================================================================

describe('loadSecretsWithFallback — betöltési naplózás', () => {
	afterEach(() => {
		delete process.env.VARLOCK_FALLBACK;
		vi.restoreAllMocks();
	});

	it('sikeres Infisical betöltés után naplózza a betöltött változók számát és a környezetet', async () => {
		delete process.env.VARLOCK_FALLBACK;
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const secrets = makeValidEnv();
		const mockInfisical = createMockInfisical(secrets, {
			environment: 'production',
			project: 'elyos-core'
		});

		await loadSecretsWithFallback({ infisical: mockInfisical });

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringMatching(/\[Varlock\] \d+ secret sikeresen betöltve \(production\/elyos-core\)/)
		);
	});

	it('sikeres fallback betöltés után naplózza a betöltött változók számát', async () => {
		process.env.VARLOCK_FALLBACK = 'local';
		process.env.INFISICAL_CLIENT_ID = 'test-id';
		process.env.INFISICAL_CLIENT_SECRET = 'test-secret';
		process.env.NODE_ENV = 'development';
		process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
		process.env.APP_URL = 'http://localhost:3000';
		process.env.ORIGIN = 'http://localhost:3000';
		process.env.BETTER_AUTH_SECRET = 'auth-secret';
		process.env.BETTER_AUTH_URL = 'http://localhost:3000';

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		await loadSecretsWithFallback({});

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringMatching(/\[Varlock\] \d+ secret sikeresen betöltve \(local\/local\)/)
		);
	});

	it('a naplóüzenet tartalmazza a betöltött változók pontos számát', async () => {
		delete process.env.VARLOCK_FALLBACK;
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const secrets = makeValidEnv();
		const mockInfisical = createMockInfisical(secrets, {
			environment: 'development',
			project: 'elyos-core'
		});

		await loadSecretsWithFallback({ infisical: mockInfisical });

		const logCall = consoleSpy.mock.calls.find((call) =>
			String(call[0]).includes('secret sikeresen betöltve')
		);
		expect(logCall).toBeDefined();

		// A szám megegyezik a validált objektum kulcsainak számával
		const match = String(logCall![0]).match(/\[Varlock\] (\d+) secret/);
		expect(match).not.toBeNull();
		const count = parseInt(match![1], 10);
		expect(count).toBeGreaterThan(0);
	});
});

// =============================================================================
// 10. Token megújítás — createVarlockClient
// Feature: secrets-management, Property 5: Token megújítás — lejárt token esetén automatikus megújítás
// Validates: Requirements 6.6
// =============================================================================

describe('createVarlockClient — token megújítás', () => {
	it('getSecret visszaadja a secret értékét', async () => {
		const secrets = makeValidEnv();
		const mockInfisical = createMockInfisicalWithRenewal(secrets);
		const client = createVarlockClient({
			clientId: 'test-id',
			clientSecret: 'test-secret',
			infisical: mockInfisical
		});

		const value = await client.getSecret('NODE_ENV');
		expect(value).toBe('development');
	});

	it('simulateTokenExpiry után a következő getSecret megújítja a tokent', async () => {
		const secrets = makeValidEnv();
		const mockInfisical = createMockInfisicalWithRenewal(secrets);
		const client = createVarlockClient({
			clientId: 'test-id',
			clientSecret: 'test-secret',
			infisical: mockInfisical
		});

		// Első lekérés (cache feltöltése)
		await client.getSecret('NODE_ENV');
		expect(mockInfisical.renewTokenCallCount).toBe(0);

		// Token lejárat szimulálása
		client.simulateTokenExpiry('expired-token-xyz');

		// Következő lekérés automatikusan megújítja a tokent
		const value = await client.getSecret('NODE_ENV');
		expect(value).toBe('development');
		expect(mockInfisical.renewTokenCallCount).toBeGreaterThan(0);
	});

	it('token lejárat után az alkalmazás újraindítás nélkül folytatódik', async () => {
		const secrets = makeValidEnv();
		const mockInfisical = createMockInfisicalWithRenewal(secrets);
		const client = createVarlockClient({
			clientId: 'test-id',
			clientSecret: 'test-secret',
			infisical: mockInfisical
		});

		// Több lekérés token lejárattal közben
		await client.getSecret('NODE_ENV');
		client.simulateTokenExpiry('token-1');
		await client.getSecret('DATABASE_URL');
		client.simulateTokenExpiry('token-2');
		const value = await client.getSecret('BETTER_AUTH_SECRET');

		expect(value).toBe(secrets['BETTER_AUTH_SECRET']);
		expect(mockInfisical.renewTokenCallCount).toBe(2);
	});

	/**
	 * **Validates: Requirements 6.6**
	 * 5. tulajdonság: Token megújítás — lejárt token esetén automatikus megújítás
	 */
	it('PBT: lejárt token esetén automatikus megújítás, secretek elérhetők maradnak', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.record({
					clientId: fc.string({ minLength: 1 }),
					clientSecret: fc.string({ minLength: 1 }),
					expiredToken: fc.string()
				}),
				async ({ clientId, clientSecret, expiredToken }) => {
					const secrets = makeValidEnv();
					const mockInfisical = createMockInfisicalWithRenewal(secrets);
					const client = createVarlockClient({ clientId, clientSecret, infisical: mockInfisical });

					// Token lejárat szimulálása
					client.simulateTokenExpiry(expiredToken);

					// Következő secret lekérés automatikusan megújítja a tokent
					const result = await client.getSecret('NODE_ENV');
					expect(result).toBeDefined();
					expect(mockInfisical.renewTokenCallCount).toBeGreaterThan(0);
				}
			),
			{ numRuns: 100 }
		);
	});
});
