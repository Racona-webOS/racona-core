/**
 * WebOS SDK Export
 *
 * Központi export fájl — az @elyos/sdk package-ből re-exportálja az SDK-t.
 * Ez a fájl biztosítja a backward compatibility-t a $lib/sdk importokhoz.
 */

export { WebOSSDK } from '@elyos/sdk';

// Service-ek exportálása
export { UIService } from '@elyos/sdk';
export { RemoteService } from '@elyos/sdk';
export { DataService } from '@elyos/sdk';
export { I18nService } from '@elyos/sdk';
export { NotificationService } from '@elyos/sdk';
export { ContextService } from '@elyos/sdk';
export { AssetService } from '@elyos/sdk';

// Típusok re-exportálása az @elyos/sdk-ból
export type {
	UserInfo,
	WindowControls,
	DialogOptions,
	DialogResult,
	ThemeColors,
	CallOptions,
	Transaction,
	SDKNotificationOptions,
	ToastType,
	WebOSComponents,
	WebOSSDKInterface,
	MockSDKConfig
} from '@elyos/sdk';
