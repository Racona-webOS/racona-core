/**
 * WebOS SDK Export
 *
 * Központi export fájl — az @racona/sdk package-ből re-exportálja az SDK-t.
 * Ez a fájl biztosítja a backward compatibility-t a $lib/sdk importokhoz.
 */

export { WebOSSDK } from '@racona/sdk';

// Service-ek exportálása
export { UIService } from '@racona/sdk';
export { RemoteService } from '@racona/sdk';
export { DataService } from '@racona/sdk';
export { I18nService } from '@racona/sdk';
export { NotificationService } from '@racona/sdk';
export { ContextService } from '@racona/sdk';
export { AssetService } from '@racona/sdk';

// Típusok re-exportálása az @racona/sdk-ból
export type {
	UserInfo,
	WindowControls,
	DialogOptions,
	DialogResult,
	ThemeColors,
	CallOptions,
	Transaction,
	NotificationOptions as SDKNotificationOptions,
	ToastType,
	WebOSComponents,
	WebOSSDKInterface,
	MockSDKConfig
} from '@racona/sdk';
