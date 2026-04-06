/**
 * WebOS SDK — Runtime SDK
 *
 * Injected into plugins by the ElyOS core.
 * Aggregates all services into a single object.
 */

import type { WebOSComponents, UserInfo, WebOSSDKInterface } from '../types/index.js';
import { UIService } from './services/UIService.js';
import { RemoteService } from './services/RemoteService.js';
import { DataService } from './services/DataService.js';
import { I18nService } from './services/I18nService.js';
import { NotificationService } from './services/NotificationService.js';
import { ContextService } from './services/ContextService.js';
import { AssetService } from './services/AssetService.js';
import { SharedLibrariesService } from './services/SharedLibrariesService.js';

/** WebOS SDK — injected into plugins by the ElyOS core, aggregates all services. */
export class WebOSSDK implements WebOSSDKInterface {
	/** UI service — toasts, dialogs, theme */
	readonly ui: UIService;
	/** Remote service — call server-side functions */
	readonly remote: RemoteService;
	/** Data service — key-value storage and SQL queries */
	readonly data: DataService;
	/** I18n service — translations and locale switching */
	readonly i18n: I18nService;
	/** Notification service — send notifications */
	readonly notifications: NotificationService;
	/** Context service — plugin identity, user, permissions, window controls */
	readonly context: ContextService;
	/** Asset service — generate plugin asset URLs */
	readonly assets: AssetService;
	/** Shared Libraries service — access to core libraries */
	readonly libs: SharedLibrariesService;
	/** ElyOS UI components */
	readonly components: WebOSComponents;

	/**
	 * Create a WebOSSDK instance.
	 *
	 * @param pluginId - Unique plugin identifier
	 * @param user - Authenticated user data
	 * @param params - Parameters passed when the app was launched
	 * @param permissions - List of permissions granted to the plugin
	 * @param windowElement - Optional Window reference (for iframe-based plugins)
	 * @param components - ElyOS UI components
	 * @param devMode - Dev mode flag (skips automatic translation loading)
	 */
	constructor(
		pluginId: string,
		user: UserInfo,
		params: Record<string, unknown>,
		permissions: string[],
		windowElement?: Window,
		components?: WebOSComponents,
		devMode = false
	) {
		this.ui = new UIService();
		this.remote = new RemoteService(pluginId);
		this.data = new DataService(pluginId);
		this.i18n = new I18nService(pluginId, devMode);
		this.notifications = new NotificationService(pluginId, permissions);
		this.context = new ContextService(pluginId, user, params, permissions, windowElement);
		this.assets = new AssetService(pluginId);
		this.libs = new SharedLibrariesService();
		this.components = components ?? {};
		this.ui._setComponents(this.components);
	}

	/**
	 * Initialize the SDK and attach it to the global object.
	 *
	 * @param pluginId - Unique plugin identifier
	 * @param user - Authenticated user data
	 * @param params - Parameters passed when the app was launched
	 * @param permissions - List of permissions granted to the plugin
	 * @param windowElement - Optional Window reference (for iframe-based plugins)
	 * @param components - ElyOS UI components
	 * @param devMode - Dev mode flag
	 * @returns The initialized SDK instance
	 */
	static initialize(
		pluginId: string,
		user: UserInfo,
		params: Record<string, unknown> = {},
		permissions: string[] = [],
		windowElement?: Window,
		components?: WebOSComponents,
		devMode = false
	): WebOSSDK {
		const sdk = new WebOSSDK(
			pluginId,
			user,
			params,
			permissions,
			windowElement,
			components,
			devMode
		);

		if (typeof window !== 'undefined') {
			if (!window.__webOS_instances) {
				window.__webOS_instances = new Map();
			}
			window.__webOS_instances.set(pluginId, sdk);
			window.webOS = sdk;
		}

		return sdk;
	}

	/**
	 * Retrieve an SDK instance by plugin ID.
	 *
	 * @param pluginId - Unique plugin identifier
	 * @returns The SDK instance, or `undefined` if not found
	 */
	static getInstance(pluginId: string): WebOSSDK | undefined {
		if (typeof window !== 'undefined' && window.__webOS_instances) {
			return window.__webOS_instances.get(pluginId) as WebOSSDK | undefined;
		}
		return undefined;
	}

	/**
	 * Clean up the SDK — removes the instance from the global object.
	 *
	 * @param pluginId - If provided, removes only this plugin's instance. Otherwise removes all instances.
	 */
	static cleanup(pluginId?: string): void {
		if (typeof window !== 'undefined') {
			if (pluginId && window.__webOS_instances) {
				window.__webOS_instances.delete(pluginId);
			} else {
				delete window.webOS;
				delete (window as Partial<Window & { __webOS_instances?: unknown }>).__webOS_instances;
			}
		}
	}
}
