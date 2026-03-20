import type { WebOSSDKInterface } from './index.js';

/**
 * Global window interface extensions for WebOS SDK.
 *
 * Extends the standard browser Window interface with WebOS-specific properties
 * to provide access to the SDK and manage multiple SDK instances.
 */
declare global {
	/**
	 * Extended Window interface with WebOS SDK properties.
	 *
	 * @interface Window
	 * @property {WebOSSDKInterface} [webOS] - Primary WebOS SDK instance. Available when the SDK is initialized in the current context.
	 * @property {Map<string, WebOSSDKInterface>} [__webOS_instances] - Internal map storing multiple SDK instances by identifier. Used for managing isolated SDK contexts (e.g., in iframes or plugin sandboxes).
	 */
	interface Window {
		/**
		 * Primary WebOS SDK instance.
		 *
		 * This is the main entry point for accessing WebOS functionality including:
		 * - Window management (create, close, focus windows)
		 * - Notifications and toasts
		 * - i18n and localization
		 * - Storage and data services
		 * - Plugin communication
		 *
		 * @type {WebOSSDKInterface}
		 * @optional
		 */
		webOS?: WebOSSDKInterface;

		/**
		 * Internal registry of WebOS SDK instances.
		 *
		 * Stores multiple SDK instances keyed by their unique identifiers.
		 * This is primarily used internally for managing SDK instances in isolated contexts
		 * such as iframes, Web Workers, or plugin sandboxes.
		 *
		 * @type {Map<string, WebOSSDKInterface>}
		 * @internal
		 * @optional
		 */
		__webOS_instances?: Map<string, WebOSSDKInterface>;
	}
}
