/**
 * Mock Remote Service
 *
 * Szerver hívások szimulálása konfigurálható handler-ekkel.
 */

import type { RemoteService, CallOptions } from '../../types/index.js';

export interface MockRemoteConfig {
	handlers?: Record<string, (...args: unknown[]) => unknown>;
}

export class MockRemoteService implements RemoteService {
	private handlers: Record<string, (...args: unknown[]) => unknown>;

	/** @param config - Opcionális handler map a szimulált szerver függvényekhez */
	constructor(config?: MockRemoteConfig) {
		this.handlers = config?.handlers ?? {};
	}

	/**
	 * Szerver hívás szimulálása — ha van regisztrált handler, azt hívja meg, egyébként `null`-t ad vissza.
	 * @param functionName - Szerver függvény neve
	 * @param params - Átadandó paraméterek
	 * @returns A handler visszatérési értéke, vagy `null`
	 */
	async call<T = unknown>(
		functionName: string,
		params?: Record<string, unknown>,
		_options?: CallOptions
	): Promise<T> {
		console.log(`[Mock Remote] ${functionName}`, params);

		const handler = this.handlers[functionName];
		if (handler) {
			return handler(params) as T;
		}

		console.warn(`[Mock Remote] No handler for "${functionName}", returning null`);
		return null as T;
	}
}
