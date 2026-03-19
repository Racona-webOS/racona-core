/**
 * Remote Service
 *
 * Szerver oldali függvények hívása HTTP POST kéréssel.
 * Retry logika exponenciális backoff-fal.
 */

import type { RemoteService as IRemoteService, CallOptions } from '../../types/index.js';
import { PluginErrorCode } from '../../types/index.js';

export class RemoteService implements IRemoteService {
	private readonly pluginId: string;

	/** @param pluginId - Plugin egyedi azonosítója */
	constructor(pluginId: string) {
		this.pluginId = pluginId;
	}

	/**
	 * Szerver oldali függvény hívása retry logikával (max 3 kísérlet, exponenciális backoff).
	 *
	 * @param functionName - A szerver oldali függvény neve
	 * @param params - Átadandó paraméterek
	 * @param options - Hívás beállítások (pl. timeout)
	 * @returns A szerver által visszaadott eredmény
	 * @throws `REMOTE_CALL_TIMEOUT` ha a kérés túllépi az időkorlátot
	 * @throws `NETWORK_ERROR` ha hálózati hiba történik
	 * @throws `SERVER_ERROR` ha a szerver 5xx hibát ad vissza
	 * @throws `CLIENT_ERROR` ha a szerver 4xx hibát ad vissza
	 */
	async call<T = unknown>(
		functionName: string,
		params?: Record<string, unknown>,
		options?: CallOptions
	): Promise<T> {
		const timeout = options?.timeout ?? 30000;
		const maxRetries = 3;
		let lastError: Error | null = null;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				return await this.executeCall<T>(functionName, params, timeout);
			} catch (error) {
				lastError = error as Error;

				// Ne próbáljuk újra, ha nem hálózati hiba
				if (
					error instanceof Error &&
					!error.message.includes('network') &&
					!error.message.includes('timeout')
				) {
					throw error;
				}

				// Exponenciális backoff: 1s, 2s, 4s
				if (attempt < maxRetries - 1) {
					const delay = Math.pow(2, attempt) * 1000;
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		throw new Error(
			`${PluginErrorCode.REMOTE_ERROR}: Failed after ${maxRetries} attempts: ${lastError?.message}`
		);
	}

	/**
	 * Egyetlen remote hívás végrehajtása
	 */
	private async executeCall<T>(
		functionName: string,
		params: Record<string, unknown> | undefined,
		timeout: number
	): Promise<T> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const response = await fetch(`/api/plugins/${this.pluginId}/remote/${functionName}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ params: params ?? {} }),
				signal: controller.signal,
				credentials: 'same-origin'
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				if (response.status >= 500) {
					throw new Error(`${PluginErrorCode.SERVER_ERROR}: Server error (${response.status})`);
				}
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`${PluginErrorCode.CLIENT_ERROR}: ${(errorData as Record<string, string>).error ?? 'Client error'}`
				);
			}

			const data = (await response.json()) as { success: boolean; error?: string; result: T };

			if (!data.success) {
				throw new Error(`${PluginErrorCode.REMOTE_ERROR}: ${data.error ?? 'Remote call failed'}`);
			}

			return data.result;
		} catch (error) {
			clearTimeout(timeoutId);

			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					throw new Error(
						`${PluginErrorCode.REMOTE_CALL_TIMEOUT}: Request timeout after ${timeout}ms`
					);
				}
				if (error.message.includes('Failed to fetch')) {
					throw new Error(`${PluginErrorCode.NETWORK_ERROR}: Network error`);
				}
			}

			throw error;
		}
	}
}
