/**
 * Mock Data Service
 *
 * localStorage-based key-value storage, mock SQL.
 */

import type { DataService, Transaction } from '../../types/index.js';

export interface MockDataConfig {
	initialData?: Record<string, unknown>;
}

export class MockDataService implements DataService {
	private storage = new Map<string, unknown>();
	private readonly prefix = 'elyos-mock-';

	/** @param config - Opcionális kezdeti adatok */
	constructor(config?: MockDataConfig) {
		if (config?.initialData) {
			for (const [key, value] of Object.entries(config.initialData)) {
				this.storage.set(key, value);
			}
		}
	}

	/**
	 * Kulcs-érték pár tárolása memóriában és `localStorage`-ban.
	 * @param key - Tárolandó kulcs
	 * @param value - Tárolandó érték
	 */
	async set(key: string, value: unknown): Promise<void> {
		this.storage.set(key, value);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(value));
		}
	}

	/**
	 * Kulcs-érték pár lekérdezése memóriából vagy `localStorage`-ból.
	 * @param key - Lekérdezendő kulcs
	 * @returns A tárolt érték, vagy `null` ha nem létezik
	 */
	async get<T = unknown>(key: string): Promise<T | null> {
		if (this.storage.has(key)) {
			return this.storage.get(key) as T;
		}
		if (typeof localStorage !== 'undefined') {
			const stored = localStorage.getItem(`${this.prefix}${key}`);
			if (stored) {
				const parsed = JSON.parse(stored) as T;
				this.storage.set(key, parsed);
				return parsed;
			}
		}
		return null;
	}

	/**
	 * Kulcs-érték pár törlése memóriából és `localStorage`-ból.
	 * @param key - Törlendő kulcs
	 */
	async delete(key: string): Promise<void> {
		this.storage.delete(key);
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem(`${this.prefix}${key}`);
		}
	}

	/**
	 * SQL lekérdezés szimulálása — mock módban nem támogatott, üres tömböt ad vissza.
	 * @param sql - SQL lekérdezés (csak logolásra kerül)
	 * @param params - Paraméterek (csak logolásra kerülnek)
	 */
	async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
		console.warn('[Mock Data] SQL queries are not supported in mock mode:', sql, params);
		return [];
	}

	/**
	 * Tranzakció szimulálása — mock módban nincs valódi tranzakció, a callback azonnal fut.
	 * @param callback - Tranzakció callback
	 */
	async transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
		console.warn('[Mock Data] Transactions are simulated in mock mode');
		const tx: Transaction = {
			query: <R = unknown>(sql: string, params?: unknown[]) => this.query<R>(sql, params),
			commit: async () => {},
			rollback: async () => {}
		};
		return callback(tx);
	}
}
