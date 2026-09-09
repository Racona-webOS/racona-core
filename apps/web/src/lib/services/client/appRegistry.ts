/**
 * Client-side App Registry Service
 * Provides app metadata loading from database via remote functions.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { type AppMetadata } from '$lib/types/window';
import {
	getUserApps,
	getUserAppsByCategory,
	searchUserApps
} from '$lib/services/server/appRegistry.remote';
import { withTimeout, RemoteTimeoutError } from '$lib/utils/remote';

/**
 * Base app registry service interface.
 */
export interface AppRegistryService {
	getApps(): Promise<AppMetadata[]>;
	getAppByName(appName: string): Promise<AppMetadata | undefined>;
	isLoading?(): boolean;
}

/**
 * Error types for better error handling.
 */
export enum AppRegistryErrorType {
	INITIALIZATION_FAILED = 'initialization_failed',
	APP_NOT_FOUND = 'app_not_found',
	NETWORK_ERROR = 'network_error',
	INVALID_METADATA = 'invalid_metadata',
	AUTH_ERROR = 'auth_error',
	UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Enhanced error class for app registry operations.
 */
export class AppRegistryError extends Error {
	constructor(
		public type: AppRegistryErrorType,
		message: string,
		public originalError?: Error,
		public recoverable: boolean = true
	) {
		super(message);
		this.name = 'AppRegistryError';
	}

	/**
	 * Get user-friendly error message.
	 * @returns User-friendly error message.
	 */
	getUserFriendlyMessage(): string {
		switch (this.type) {
			case AppRegistryErrorType.INITIALIZATION_FAILED:
				return 'Failed to load applications. Please try refreshing the page.';
			case AppRegistryErrorType.APP_NOT_FOUND:
				return 'The requested application could not be found.';
			case AppRegistryErrorType.NETWORK_ERROR:
				return 'Network error occurred while loading applications. Please check your connection.';
			case AppRegistryErrorType.INVALID_METADATA:
				return 'Application data is corrupted. Please contact support.';
			case AppRegistryErrorType.AUTH_ERROR:
				return 'Authentication required. Please log in to access applications.';
			default:
				return 'An unexpected error occurred. Please try again.';
		}
	}

	/**
	 * Check if error is recoverable.
	 * @returns True if error is recoverable, false otherwise.
	 */
	isRecoverable(): boolean {
		return this.recoverable;
	}
}

/**
 * Client-side App Registry Service Interface.
 */
export interface ClientAppRegistry extends AppRegistryService {
	isLoading(): boolean;
	getError(): AppRegistryError | undefined;
	refresh(): Promise<void>;
	retry(): Promise<void>;
	clearCache(): void;
	searchApps(query: string): Promise<AppMetadata[]>;
	getAppsByCategory(category: string): Promise<AppMetadata[]>;
}

/**
 * Client-side App Registry Service Implementation.
 * Fetches apps from database via remote functions with fallback to local metadata.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export class ClientAppRegistryService implements ClientAppRegistry {
	private loading = false;
	private error: AppRegistryError | undefined;
	private retryCount = 0;
	private maxRetries = 3;

	// Performance optimizations - Requirements: 6.2
	private appsCache: AppMetadata[] | null = null;
	private cacheTimestamp: number = 0;
	private cacheTimeout = 5 * 60 * 1000; // 5 minutes cache for session
	private cleanupTimeout: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		this.scheduleCleanup();
	}

	/**
	 * Get all apps for the current user.
	 * Fetches from database via remote function, falls back to local metadata.
	 *
	 * Requirements: 6.1, 6.3, 6.4
	 * @returns Promise resolving to array of app metadata.
	 */
	async getApps(): Promise<AppMetadata[]> {
		try {
			// Check cache first - Requirements: 6.2
			if (this.isCacheValid()) {
				return this.appsCache!;
			}

			this.loading = true;
			this.error = undefined;

			const result = await withTimeout(getUserApps({}));

			if (result.success && result.apps) {
				this.updateCache(result.apps);
				this.loading = false;
				return result.apps;
			}

			// If auth error, throw specific error
			if (result.error === 'User not authenticated') {
				throw new AppRegistryError(
					AppRegistryErrorType.AUTH_ERROR,
					'User not authenticated',
					undefined,
					true
				);
			}

			throw new Error(result.error || 'Unknown error from remote function');
		} catch (error) {
			this.loading = false;

			if (error instanceof AppRegistryError) {
				this.error = error;
				throw error;
			}

			// Timeout → network error
			if (error instanceof RemoteTimeoutError) {
				const networkError = new AppRegistryError(
					AppRegistryErrorType.NETWORK_ERROR,
					error.message,
					error,
					true
				);
				this.error = networkError;
				throw networkError;
			}

			const registryError = new AppRegistryError(
				AppRegistryErrorType.UNKNOWN_ERROR,
				'Failed to get applications',
				error instanceof Error ? error : undefined
			);

			console.error('[AppRegistry] getApps underlying error:', error);
			this.error = registryError;
			throw registryError;
		}
	}

	/**
	 * Get apps filtered by category.
	 *
	 * Requirements: 5.5
	 * @param category - The category to filter by.
	 * @returns Promise resolving to array of app metadata.
	 */
	async getAppsByCategory(category: string): Promise<AppMetadata[]> {
		try {
			const result = await withTimeout(getUserAppsByCategory({ category }));

			if (result.success && result.apps) {
				return result.apps;
			}

			throw new Error(result.error || 'Unknown error');
		} catch (error) {
			if (error instanceof AppRegistryError) {
				throw error;
			}

			throw new AppRegistryError(
				AppRegistryErrorType.UNKNOWN_ERROR,
				`Failed to get apps by category '${category}'`,
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Search apps by query string.
	 *
	 * Requirements: 5.6
	 * @param query - The search query.
	 * @returns Promise resolving to array of matching app metadata.
	 */
	async searchApps(query: string): Promise<AppMetadata[]> {
		if (!query.trim()) {
			return this.getApps();
		}

		try {
			const result = await withTimeout(searchUserApps({ query }));

			if (result.success && result.apps) {
				return result.apps;
			}

			throw new Error(result.error || 'Unknown error');
		} catch (error) {
			if (error instanceof AppRegistryError) {
				throw error;
			}

			throw new AppRegistryError(
				AppRegistryErrorType.UNKNOWN_ERROR,
				`Failed to search apps for '${query}'`,
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Get app by name with loading state management.
	 * @param appName - The name of the app to retrieve.
	 * @returns Promise resolving to app metadata or undefined if not found.
	 */
	async getAppByName(appName: string): Promise<AppMetadata | undefined> {
		try {
			const apps = await this.getApps();
			return apps.find((a) => a.appName === appName);
		} catch (error) {
			if (error instanceof AppRegistryError) {
				throw error;
			}

			throw new AppRegistryError(
				AppRegistryErrorType.UNKNOWN_ERROR,
				`Failed to get application '${appName}'`,
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Check if service is currently loading.
	 * @returns True if loading, false otherwise.
	 */
	isLoading(): boolean {
		return this.loading;
	}

	/**
	 * Get any initialization error.
	 * @returns Current error or undefined.
	 */
	getError(): AppRegistryError | undefined {
		return this.error;
	}

	/**
	 * Refresh the registry by clearing cache and re-fetching.
	 * Requirements: 6.6
	 * @returns Promise that resolves when refresh is complete.
	 */
	async refresh(): Promise<void> {
		this.clearCache();
		this.error = undefined;
		this.retryCount = 0;
		await this.getApps();
	}

	/**
	 * Retry the last failed operation.
	 * @returns Promise that resolves when retry is complete.
	 */
	async retry(): Promise<void> {
		if (this.retryCount >= this.maxRetries) {
			const maxRetriesError = new AppRegistryError(
				AppRegistryErrorType.INITIALIZATION_FAILED,
				'Maximum retry attempts exceeded',
				undefined,
				false
			);
			this.error = maxRetriesError;
			throw maxRetriesError;
		}

		this.retryCount++;
		this.error = undefined;
		this.clearCache();
		await this.getApps();
	}

	/**
	 * Clear the apps cache.
	 * Requirements: 6.5
	 */
	clearCache(): void {
		this.appsCache = null;
		this.cacheTimestamp = 0;
	}

	/**
	 * Check if cache is valid.
	 * @returns True if cache is valid, false otherwise.
	 */
	private isCacheValid(): boolean {
		return this.appsCache !== null && Date.now() - this.cacheTimestamp < this.cacheTimeout;
	}

	/**
	 * Update the apps cache.
	 * @param apps - The apps to cache.
	 */
	private updateCache(apps: AppMetadata[]): void {
		this.appsCache = apps;
		this.cacheTimestamp = Date.now();
	}

	/**
	 * Schedule cleanup of resources.
	 */
	private scheduleCleanup(): void {
		if (this.cleanupTimeout) {
			clearTimeout(this.cleanupTimeout);
		}

		this.cleanupTimeout = setTimeout(() => {
			this.cleanup();
		}, this.cacheTimeout + 60000);
	}

	/**
	 * Cleanup resources and timers.
	 */
	private cleanup(): void {
		this.clearCache();

		if (this.cleanupTimeout) {
			clearTimeout(this.cleanupTimeout);
			this.cleanupTimeout = null;
		}
	}
}

// Global client registry instance
let clientRegistryInstance: ClientAppRegistryService | null = null;

/**
 * Get the global client registry instance.
 * @returns The client registry service instance.
 */
export function getClientAppRegistry(): ClientAppRegistryService {
	if (!clientRegistryInstance) {
		clientRegistryInstance = new ClientAppRegistryService();
	}
	return clientRegistryInstance;
}

/**
 * Reset the global client registry instance.
 * Useful for logout or testing.
 * Requirements: 6.5
 */
export function resetClientAppRegistry(): void {
	if (clientRegistryInstance) {
		clientRegistryInstance.clearCache();
	}
	clientRegistryInstance = null;
}

/**
 * Legacy compatibility function for existing code.
 * Returns a promise-based interface that matches the old query pattern.
 * @returns Object with loading state, error state, and promise interface.
 */
export function getApps() {
	const registry = getClientAppRegistry();
	let currentApps: AppMetadata[] | null = null;
	let isInitialized = false;

	const initPromise = registry
		.getApps()
		.then((apps) => {
			currentApps = apps;
			isInitialized = true;
			return apps;
		})
		.catch((error) => {
			isInitialized = true;
			throw error;
		});

	return {
		get loading() {
			return registry.isLoading();
		},
		get error() {
			const error = registry.getError();
			return error || null;
		},
		get current() {
			return isInitialized ? currentApps : null;
		},
		then: (
			onResolve: (apps: AppMetadata[]) => void,
			onReject?: (error: AppRegistryError) => void
		) => {
			return initPromise.then(onResolve, onReject);
		},
		retry: () => registry.retry(),
		refresh: () => registry.refresh()
	};
}

/**
 * Legacy compatibility function for getting app by name.
 * @param appName - The name of the app to retrieve.
 * @returns Promise resolving to app metadata or undefined.
 */
export function getAppByName(appName: string) {
	const registry = getClientAppRegistry();
	return registry.getAppByName(appName);
}
