/**
 * Szerver szolgáltatások inicializálása — idempotens, egyszer lefutó lépések.
 *
 * A `hooks.server.ts` `init` hookja induláskor, a `handle` minden kérésnél
 * hívja őket (a második hívástól azonnal visszatérnek). Az ütemező a futás
 * előtt szintén meghívja őket, mert ütemezett futásnál nincs kérés.
 */

import { building } from '$app/environment';
import { initializeEmailService } from '$lib/server/email';
import { getI18nService, setDatabaseLoader } from '$lib/i18n';
import { translationRepository } from '$lib/server/database/repositories/translationRepository';
import { initializeSocketIO } from '$lib/server/socket';
import { env } from '$lib/env';

let emailInit: Promise<void> | null = null;
let i18nInit: Promise<void> | null = null;
let socketIOInitialized = false;

/**
 * Socket.IO inicializálása a `global.io` példánnyal (prod: server.js, dev: Vite plugin).
 * Ha a példány még nincs beállítva (prod `init` idején a server.js még nem
 * futott tovább), a következő hívás újrapróbálja.
 */
export function ensureSocketIO(): void {
	if (socketIOInitialized || building) return;
	const globalIo = (globalThis as { io?: Parameters<typeof initializeSocketIO>[0] }).io;
	if (!globalIo) return;
	initializeSocketIO(globalIo);
	socketIOInitialized = true;
}

/** i18n szolgáltatás: adatbázis betöltő és alapértelmezett nyelv. */
export function ensureI18n(): Promise<void> {
	if (building) return Promise.resolve();
	i18nInit ??= (async () => {
		try {
			setDatabaseLoader(async (locale: string, namespace: string) => {
				try {
					const translations = await translationRepository.getAsRecord(locale, namespace);
					return {
						success: true,
						translations,
						error: null
					};
				} catch (error) {
					console.error(`[I18n] Database loader error for ${locale}:${namespace}:`, error);
					return {
						success: false,
						translations: {},
						error: error instanceof Error ? error.message : 'Unknown error'
					};
				}
			});

			const i18nService = getI18nService();
			const defaultLocale = env.DEFAULT_LOCALE || 'hu';
			await i18nService.init({
				defaultLocale,
				fallbackLocale: defaultLocale
			});
		} catch (error) {
			console.error('[Server] I18n service initialization error:', error);
		}
	})();
	return i18nInit;
}

/** Email szolgáltatás (konfiguráció ellenőrzés, migráció, cache melegítés). */
export function ensureEmailService(): Promise<void> {
	if (building) return Promise.resolve();
	emailInit ??= (async () => {
		try {
			const emailState = await initializeEmailService({
				skipCacheWarmUp: false, // Warm up cache on startup
				validateConfiguration: true, // Validate configuration
				retryAttempts: 3,
				retryDelay: 1000
			});

			if (emailState.initialized) {
				if (emailState.degraded) {
					console.warn('[Server] Email service initialized in degraded mode');
				}
			} else {
				console.error('[Server] Email service failed to initialize:', {
					error: emailState.error,
					healthStatus: emailState.healthStatus
				});
			}
		} catch (error) {
			console.error('[Server] Email service initialization error:', error);
		}
	})();
	return emailInit;
}
