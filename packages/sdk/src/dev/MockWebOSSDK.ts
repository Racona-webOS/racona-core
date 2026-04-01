/**
 * MockWebOSSDK — Development Mock SDK
 *
 * Mock SDK for standalone plugin development.
 * Console-based feedback, localStorage-based storage.
 *
 * @example
 * ```ts
 * import { MockWebOSSDK } from '@elyos-dev/sdk/dev';
 *
 * if (!window.webOS) {
 *   MockWebOSSDK.initialize({
 *     i18n: {
 *       locale: 'en',
 *       translations: {
 *         en: { title: 'Hello World' }
 *       }
 *     }
 *   });
 * }
 * ```
 */

import type { MockSDKConfig, WebOSSDKInterface } from '../types/index.js';
import { MockUIService } from './services/MockUIService.js';
import { MockRemoteService } from './services/MockRemoteService.js';
import { MockDataService } from './services/MockDataService.js';
import { MockI18nService } from './services/MockI18nService.js';
import { MockNotificationService } from './services/MockNotificationService.js';
import { MockContextService } from './services/MockContextService.js';
import { MockAssetService } from './services/MockAssetService.js';
import { MockSharedLibrariesService } from './services/MockSharedLibrariesService.js';

/** Mock WebOS SDK — simulates all services locally for standalone plugin development. */
export class MockWebOSSDK implements WebOSSDKInterface {
	/** Mock UI service */
	readonly ui: MockUIService;
	/** Mock Remote service */
	readonly remote: MockRemoteService;
	/** Mock Data service */
	readonly data: MockDataService;
	/** Mock I18n service */
	readonly i18n: MockI18nService;
	/** Mock Notification service */
	readonly notifications: MockNotificationService;
	/** Mock Context service */
	readonly context: MockContextService;
	/** Mock Asset service */
	readonly assets: MockAssetService;
	/** Mock Shared Libraries service */
	readonly libs: MockSharedLibrariesService;
	/** Mock UI components — empty object in dev mode */
	readonly components: WebOSSDKInterface['components'];

	/** @param config - Optional mock SDK configuration */
	constructor(config?: MockSDKConfig) {
		this.ui = new MockUIService();
		this.remote = new MockRemoteService(config?.remote);
		this.data = new MockDataService(config?.data);
		this.i18n = new MockI18nService(config?.i18n);
		this.notifications = new MockNotificationService();
		this.context = new MockContextService(
			config?.context as ConstructorParameters<typeof MockContextService>[0]
		);
		this.assets = new MockAssetService(config?.assets);
		this.libs = new MockSharedLibrariesService(config?.libs?.mockLibraries);
		this.components = {};
	}

	/**
	 * Initialize the mock SDK and attach it to `window.webOS`.
	 *
	 * @param config - Optional mock SDK configuration
	 * @returns The initialized MockWebOSSDK instance
	 *
	 * @example
	 * ```ts
	 * if (!window.webOS) {
	 *   MockWebOSSDK.initialize({
	 *     context: { pluginId: 'my-app' }
	 *   });
	 * }
	 * ```
	 */
	static initialize(config?: MockSDKConfig): MockWebOSSDK {
		const sdk = new MockWebOSSDK(config);

		if (typeof window !== 'undefined') {
			(window as Window).webOS = sdk;
		}

		console.log('[MockWebOSSDK] Initialized in development mode');
		return sdk;
	}
}
