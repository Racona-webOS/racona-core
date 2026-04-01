/**
 * @module
 * TypeScript type definitions for the ElyOS SDK.
 *
 * Import types from this module for type-safe access to SDK services
 * without importing any runtime code.
 *
 * @example
 * ```ts
 * import type { WebOSSDKInterface, UIService } from '@elyos-dev/sdk/types';
 * ```
 */

// ─── Toast & Dialog ─────────────────────────────────────────────

/** Toast notification type */
export type ToastType = 'info' | 'success' | 'warning' | 'error';

/** Options for showing a dialog */
export interface DialogOptions {
	/** Dialog title */
	title: string;
	/** Dialog body text */
	message: string;
	/** Dialog type — `info` shows an alert, `confirm` asks yes/no, `prompt` asks for text input */
	type?: 'info' | 'confirm' | 'prompt';
	/** Default value pre-filled in a `prompt` dialog */
	defaultValue?: string;
	/** Custom buttons to show instead of the defaults */
	buttons?: DialogButton[];
}

/** A button in a dialog */
export interface DialogButton {
	/** Button label text */
	label: string;
	/** Action identifier returned in `DialogResult.action` when this button is clicked */
	action: string;
	/** Whether this is the primary (highlighted) button */
	primary?: boolean;
}

/** Result returned after a dialog is closed */
export interface DialogResult {
	/** The action identifier of the button that was clicked */
	action: string;
	/** The value entered by the user (only for `prompt` dialogs) */
	value?: string;
}

// ─── Theme ──────────────────────────────────────────────────────

/** Current theme color palette read from CSS custom properties */
export interface ThemeColors {
	/** Primary brand color */
	primary: string;
	/** Secondary brand color */
	secondary: string;
	/** Accent color */
	accent: string;
	/** Page background color */
	background: string;
	/** Default text color */
	foreground: string;
	/** Muted background color */
	muted: string;
	/** Muted text color */
	mutedForeground: string;
	/** Border color */
	border: string;
	/** Input field background color */
	input: string;
	/** Focus ring color */
	ring: string;
	/** Destructive action color */
	destructive: string;
	/** Text color on destructive backgrounds */
	destructiveForeground: string;
}

// ─── Services ───────────────────────────────────────────────────

/** UI service — toasts, dialogs, theme, and UI components */
export interface UIService {
	/** Show a toast notification */
	toast(message: string, type?: ToastType, duration?: number): void;
	/** Show a dialog (info, confirm, or prompt) and return the user's response */
	dialog(options: DialogOptions): Promise<DialogResult>;
	/** ElyOS UI components registered by the host */
	components: WebOSComponents;
	/** Current theme colors read from CSS custom properties */
	theme: ThemeColors;
}

/** Options for remote function calls */
export interface CallOptions {
	/** Request timeout in milliseconds (default: 30000) */
	timeout?: number;
}

/** Remote service — call server-side functions defined in your app's server/ directory */
export interface RemoteService {
	/** Call a server-side function by name with optional parameters and retry logic */
	call<T = unknown>(
		functionName: string,
		params?: Record<string, unknown>,
		options?: CallOptions
	): Promise<T>;
}

/** A database transaction handle */
export interface Transaction {
	/** Execute a SQL query within this transaction */
	query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
	/** Commit the transaction */
	commit(): Promise<void>;
	/** Roll back the transaction */
	rollback(): Promise<void>;
}

/** Data service — key-value storage and SQL queries scoped to this app */
export interface DataService {
	/** Store a value under the given key */
	set(key: string, value: unknown): Promise<void>;
	/** Retrieve a value by key, or `null` if not found */
	get<T = unknown>(key: string): Promise<T | null>;
	/** Delete a value by key */
	delete(key: string): Promise<void>;
	/** Execute a raw SQL query (scoped to this app's schema only) */
	query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
	/** Execute multiple operations in a single transaction */
	transaction<T = unknown>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
}

/** Internationalization service — translations and locale switching */
export interface I18nService {
	/** Resolve a translation key with optional parameter interpolation */
	t(key: string, params?: Record<string, string | number>): string;
	/** Current locale code (e.g. `"hu"`, `"en"`) */
	locale: string;
	/** Switch locale and reload translations */
	setLocale(locale: string): Promise<void>;
	/** Wait until translations have finished loading */
	ready(): Promise<void>;
	/** Register a callback to be called after each locale change */
	onLocaleChange(callback: () => void): void;
}

/** Options for sending a notification */
export interface NotificationOptions {
	/** ID of the user to notify */
	userId: string;
	/** Notification title */
	title: string;
	/** Notification body text */
	message: string;
	/** Notification type (default: `info`) */
	type?: ToastType;
}

/** Notification service — send notifications to users (requires `notifications` permission) */
export interface NotificationService {
	/** Send a notification to a user (requires `notifications` permission) */
	send(options: NotificationOptions): Promise<void>;
}

/** Authenticated user information */
export interface UserInfo {
	/** Unique user ID */
	id: string;
	/** Display name */
	name: string;
	/** Email address */
	email: string;
	/** Assigned role names */
	roles: string[];
	/** Assigned group names */
	groups: string[];
}

/** Controls for the app's window */
export interface WindowControls {
	/** Close the app window */
	close(): void;
	/** Set the window title */
	setTitle(title: string): void;
}

/** Context service — app identity, user info, permissions, and window controls */
export interface ContextService {
	/** This app's unique plugin ID */
	pluginId: string;
	/** Currently authenticated user */
	user: UserInfo;
	/** Parameters passed when the app was launched */
	params: Record<string, unknown>;
	/** Permissions granted to this app */
	permissions: string[];
	/** Window controls (close, setTitle) */
	window: WindowControls;
}

/** Asset service — resolve URLs for bundled app assets */
export interface AssetService {
	/** Generate a URL for an asset file (path traversal protected) */
	getUrl(assetPath: string): string;
}

/** Shared Libraries service — access to libraries installed in the ElyOS core */
export interface SharedLibrariesService {
	/** Get a shared library by name */
	get(libraryName: string): any;
	/** Check if a library is available */
	has(libraryName: string): boolean;
	/** Get all available shared libraries */
	list(): string[];
	/** Get library version information */
	version(libraryName: string): string | undefined;
	/** Lucide Svelte icons library */
	lucide: any;
	/** Phosphor Svelte icons library */
	phosphor: any;
	/** Svelte MapLibre GL library */
	maplibre: any;
	/** TanStack Table Core library */
	tanstackTable: any;
	/** Clsx utility for conditional class names */
	clsx: any;
	/** Tailwind Merge utility */
	tailwindMerge: any;
}

// ─── Components ─────────────────────────────────────────────────

/** ElyOS UI components exposed to apps */
export interface WebOSComponents {
	/** Component registry — keyed by component name */
	[key: string]: unknown;
}

// ─── SDK Main Interface ─────────────────────────────────────────

/** Main SDK interface — injected into `window.webOS` by ElyOS at runtime */
export interface WebOSSDKInterface {
	/** UI service — toasts, dialogs, theme */
	ui: UIService;
	/** Remote service — call server-side functions */
	remote: RemoteService;
	/** Data service — key-value storage and SQL */
	data: DataService;
	/** I18n service — translations and locale */
	i18n: I18nService;
	/** Notification service — send notifications */
	notifications: NotificationService;
	/** Context service — app identity, user, permissions, window */
	context: ContextService;
	/** Asset service — resolve asset URLs */
	assets: AssetService;
	/** Shared Libraries service — access to core libraries */
	libs: SharedLibrariesService;
	/** ElyOS UI components */
	components: WebOSComponents;
}

// ─── Mock SDK Config ────────────────────────────────────────────

/** Configuration for the mock SDK used during standalone development */
export interface MockSDKConfig {
	/** Override mock UI service behavior */
	ui?: Partial<UIService>;
	/** Configure mock remote service handlers */
	remote?: {
		/** Map of function name → handler for simulated server calls */
		handlers?: Record<string, (...args: unknown[]) => unknown>;
	};
	/** Configure mock data service initial state */
	data?: {
		/** Pre-populated key-value data */
		initialData?: Record<string, unknown>;
	};
	/** Configure mock i18n service */
	i18n?: {
		/** Initial locale code */
		locale?: string;
		/** Translations map: `{ [locale]: { [key]: value } }` */
		translations?: Record<string, Record<string, string>>;
	};
	/** Override mock notification service behavior */
	notifications?: Partial<NotificationService>;
	/** Override mock context service values */
	context?: Partial<ContextService>;
	/** Configure mock asset service */
	assets?: {
		/** Base URL prepended to all asset paths (default: `/assets`) */
		baseUrl?: string;
	};
	/** Configure mock shared libraries service */
	libs?: {
		/** Mock libraries to make available in dev mode */
		mockLibraries?: Record<string, any>;
	};
}

// ─── Error Codes ────────────────────────────────────────────────

/** Error codes thrown by SDK operations */
export enum PluginErrorCode {
	/** The app does not have the required permission */
	PERMISSION_DENIED = 'PERMISSION_DENIED',
	/** A remote call exceeded the configured timeout */
	REMOTE_CALL_TIMEOUT = 'REMOTE_CALL_TIMEOUT',
	/** The server returned an error response for a remote call */
	REMOTE_ERROR = 'REMOTE_ERROR',
	/** A network error occurred (e.g. offline, DNS failure) */
	NETWORK_ERROR = 'NETWORK_ERROR',
	/** The server returned a 5xx error */
	SERVER_ERROR = 'SERVER_ERROR',
	/** The server returned a 4xx error */
	CLIENT_ERROR = 'CLIENT_ERROR'
}
