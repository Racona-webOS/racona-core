/**
 * ElyOS SDK Type Definitions
 *
 * TypeScript típusdefiníciók a WebOS SDK-hoz.
 */

// ─── Toast & Dialog ─────────────────────────────────────────────

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface DialogOptions {
	title: string;
	message: string;
	type?: 'info' | 'confirm' | 'prompt';
	defaultValue?: string;
	buttons?: DialogButton[];
}

export interface DialogButton {
	label: string;
	action: string;
	primary?: boolean;
}

export interface DialogResult {
	action: string;
	value?: string;
}

// ─── Theme ──────────────────────────────────────────────────────

export interface ThemeColors {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
	foreground: string;
	muted: string;
	mutedForeground: string;
	border: string;
	input: string;
	ring: string;
	destructive: string;
	destructiveForeground: string;
}

// ─── Services ───────────────────────────────────────────────────

export interface UIService {
	/** Toast értesítés megjelenítése */
	toast(message: string, type?: ToastType, duration?: number): void;
	/** Dialógus megjelenítése (info, confirm, prompt) */
	dialog(options: DialogOptions): Promise<DialogResult>;
	/** WebOS UI komponensek elérése */
	components: WebOSComponents;
	/** Aktuális téma színek (CSS változókból) */
	theme: ThemeColors;
}

export interface CallOptions {
	timeout?: number;
}

export interface RemoteService {
	/** Szerver oldali függvény hívása (retry logikával) */
	call<T = unknown>(
		functionName: string,
		params?: Record<string, unknown>,
		options?: CallOptions
	): Promise<T>;
}

export interface Transaction {
	query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
	commit(): Promise<void>;
	rollback(): Promise<void>;
}

export interface DataService {
	/** Kulcs-érték pár tárolása */
	set(key: string, value: unknown): Promise<void>;
	/** Kulcs-érték pár lekérdezése */
	get<T = unknown>(key: string): Promise<T | null>;
	/** Kulcs-érték pár törlése */
	delete(key: string): Promise<void>;
	/** SQL lekérdezés végrehajtása (csak a plugin saját sémájában) */
	query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
	/** Tranzakció végrehajtása */
	transaction<T = unknown>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
}

export interface I18nService {
	/** Fordítási kulcs feloldása (paraméter interpolációval) */
	t(key: string, params?: Record<string, string | number>): string;
	/** Aktuális nyelv kódja */
	locale: string;
	/** Nyelv váltása és fordítások újratöltése */
	setLocale(locale: string): Promise<void>;
	/** Várja meg a fordítások betöltését */
	ready(): Promise<void>;
	/** Callback regisztrálása locale váltás után (fordítások betöltése után hívódik) */
	onLocaleChange(callback: () => void): void;
}

export interface NotificationOptions {
	userId: string;
	title: string;
	message: string;
	type?: ToastType;
}

export interface NotificationService {
	/** Értesítés küldése (jogosultság szükséges) */
	send(options: NotificationOptions): Promise<void>;
}

export interface UserInfo {
	id: string;
	name: string;
	email: string;
	roles: string[];
	groups: string[];
}

export interface WindowControls {
	close(): void;
	setTitle(title: string): void;
}

export interface ContextService {
	/** Plugin azonosítója */
	pluginId: string;
	/** Felhasználó információk */
	user: UserInfo;
	/** Átadott paraméterek */
	params: Record<string, unknown>;
	/** Plugin jogosultságai */
	permissions: string[];
	/** Ablak vezérlők (close, setTitle) */
	window: WindowControls;
}

export interface AssetService {
	/** Asset URL generálása (path traversal védelemmel) */
	getUrl(assetPath: string): string;
}

// ─── Components ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface WebOSComponents {
	[key: string]: any;
}

// ─── SDK Main Interface ─────────────────────────────────────────

export interface WebOSSDKInterface {
	ui: UIService;
	remote: RemoteService;
	data: DataService;
	i18n: I18nService;
	notifications: NotificationService;
	context: ContextService;
	assets: AssetService;
	components: WebOSComponents;
}

// ─── Mock SDK Config ────────────────────────────────────────────

export interface MockSDKConfig {
	ui?: Partial<UIService>;
	remote?: {
		handlers?: Record<string, (...args: unknown[]) => unknown>;
	};
	data?: {
		initialData?: Record<string, unknown>;
	};
	i18n?: {
		locale?: string;
		translations?: Record<string, Record<string, string>>;
	};
	notifications?: Partial<NotificationService>;
	context?: Partial<ContextService>;
	assets?: {
		baseUrl?: string;
	};
}

// ─── Global Window Extension ────────────────────────────────────

declare global {
	interface Window {
		webOS?: WebOSSDKInterface;
		__webOS_instances?: Map<string, WebOSSDKInterface>;
	}
}

// ─── Error Codes ────────────────────────────────────────────────

export enum PluginErrorCode {
	PERMISSION_DENIED = 'PERMISSION_DENIED',
	REMOTE_CALL_TIMEOUT = 'REMOTE_CALL_TIMEOUT',
	REMOTE_ERROR = 'REMOTE_ERROR',
	NETWORK_ERROR = 'NETWORK_ERROR',
	SERVER_ERROR = 'SERVER_ERROR',
	CLIENT_ERROR = 'CLIENT_ERROR'
}
