/**
 * @module
 * Runtime SDK for ElyOS apps.
 *
 * When your app runs inside ElyOS, the SDK is automatically injected into `window.webOS`.
 * Import this module to access the runtime services and TypeScript types.
 *
 * @example
 * ```ts
 * import { WebOSSDK } from '@elyos-dev/sdk';
 *
 * const sdk = window.webOS!;
 * sdk.ui.toast('Hello from my app!', 'success');
 * ```
 */

export { WebOSSDK } from './runtime/WebOSSDK.js';
export { UIService } from './runtime/services/UIService.js';
export { RemoteService } from './runtime/services/RemoteService.js';
export { DataService } from './runtime/services/DataService.js';
export { I18nService } from './runtime/services/I18nService.js';
export { NotificationService } from './runtime/services/NotificationService.js';
export { ContextService } from './runtime/services/ContextService.js';
export { AssetService } from './runtime/services/AssetService.js';
export { SharedLibrariesService } from './runtime/services/SharedLibrariesService.js';

export { PluginErrorCode } from './types/index.js';

export type {
	UIService as IUIService,
	RemoteService as IRemoteService,
	DataService as IDataService,
	I18nService as II18nService,
	NotificationService as INotificationService,
	ContextService as IContextService,
	AssetService as IAssetService,
	SharedLibrariesService as ISharedLibrariesService,
	DialogOptions,
	DialogButton,
	DialogResult,
	ThemeColors,
	ToastType,
	CallOptions,
	Transaction,
	NotificationOptions as SDKNotificationOptions,
	UserInfo,
	WindowControls,
	WebOSComponents,
	WebOSSDKInterface,
	MockSDKConfig
} from './types/index.js';
