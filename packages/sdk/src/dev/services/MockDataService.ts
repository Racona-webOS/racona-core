/**
 * Mock Data Service
 *
 * localStorage-based key-value storage and mock SQL for dev mode.
 */

import type { DataService, Transaction } from '../../types/index.js';

/**
 * Configuration for the mock data service.
 *
 * Allows you to pre-populate the mock data store with initial key-value pairs
 * for testing and development.
 *
 * @example
 * ```ts
 * const config: MockDataConfig = {
 *   initialData: {
 *     'user-settings': { theme: 'dark', language: 'en' },
 *     'app-state': { isLoading: false }
 *   }
 * };
 * ```
 */
export interface MockDataConfig {
	/**
	 * Pre-populated key-value data loaded into the mock store on initialization.
	 * All values are stored in memory and optionally persisted to `localStorage`.
	 */
	initialData?: Record<string, unknown>;
}

/** Mock Data service — in-memory and localStorage-based key-value storage for standalone development. */
export class MockDataService implements DataService {
	/** In-memory key-value store used for all get/set/delete operations */
	private storage = new Map<string, unknown>();
	/** Key prefix applied to all `localStorage` entries to avoid collisions */
	private readonly prefix = 'elyos-mock-';

	/** @param config - Optional initial data */
	constructor(config?: MockDataConfig) {
		if (config?.initialData) {
			for (const [key, value] of Object.entries(config.initialData)) {
				this.storage.set(key, value);
			}
		}
	}

	/**
	 * Store a key-value pair in memory and `localStorage`.
	 * @param key - Key to store
	 * @param value - Value to store
	 */
	async set(key: string, value: unknown): Promise<void> {
		this.storage.set(key, value);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(value));
		}
	}

	/**
	 * Retrieve a value from memory or `localStorage`.
	 * @param key - Key to look up
	 * @returns The stored value, or `null` if not found
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
	 * Delete a key-value pair from memory and `localStorage`.
	 * @param key - Key to delete
	 */
	async delete(key: string): Promise<void> {
		this.storage.delete(key);
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem(`${this.prefix}${key}`);
		}
	}

	/**
	 * Simulate a SQL query — not supported in mock mode, returns an empty array.
	 * @param sql - SQL query string (logged only)
	 * @param params - Query parameters (logged only)
	 */
	async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
		console.warn('[Mock Data] SQL queries are not supported in mock mode:', sql, params);
		return [];
	}

	/**
	 * Simulate a transaction — no real transaction in mock mode, callback runs immediately.
	 * @param callback - Transaction callback
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
