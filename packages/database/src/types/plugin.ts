/**
 * Plugin Rendszer Típusdefiníciók
 *
 * Ez a fájl tartalmazza a plugin rendszer összes közös típusdefinícióját.
 */

import type { LocalizedText, WindowSize } from '../schemas/platform/apps/apps';
import type { PluginPermission } from '../schemas/platform/plugins/plugins';

// Re-export a duplikáció elkerüléséhez
export type { LocalizedText, WindowSize };
export type { PluginPermission };

/**
 * Plugin manifest struktúra
 */
export interface PluginManifest {
	/** Plugin egyedi azonosítója (kebab-case) */
	id: string;
	/** Megjelenítendő név (lokalizált vagy string) */
	name: LocalizedText | string;
	/** Szemantikus verzió (pl. 1.2.3) */
	version: string;
	/** Rövid leírás (lokalizált vagy string) */
	description: LocalizedText | string;
	/** Szerző neve és email */
	author: string;
	/** Belépési pont fájl (pl. "dist/index.js") */
	entry: string;
	/** Ikon fájl elérési útja */
	icon: string;
	/** Ikon megjelenítési stílus ('icon' vagy 'cover') */
	iconStyle?: 'icon' | 'cover';
	/** Kategória (pl. 'utilities', 'productivity', 'communication') */
	category?: string;
	/** Igényelt jogosultságok */
	permissions: PluginPermission[];
	/** Több példány engedélyezése */
	multiInstance?: boolean;
	/** Alapértelmezett ablak méret */
	defaultSize?: WindowSize;
	/** Minimális ablak méret */
	minSize?: WindowSize;
	/** Maximális ablak méret */
	maxSize?: WindowSize;
	/** Kulcsszavak kereséshez */
	keywords?: string[];
	/** Külső függőségek */
	dependencies?: Record<string, string>;
	/** Minimális webOS verzió */
	minWebOSVersion?: string;
	/** Támogatott nyelvek */
	locales?: string[];
	/** Digitális aláírás fájl elérési útja */
	signature?: string;
	/** Publikus plugin-e (minden felhasználó számára elérhető) */
	isPublic?: boolean;
	/** Rendezési sorrend */
	sortOrder?: number;
}

// ============================================================================
// Validálás
// ============================================================================

/**
 * Validálási hiba
 */
export interface ValidationError {
	/** Géppel olvasható hibakód */
	code: string;
	/** Ember által olvasható üzenet */
	message: string;
	/** Érintett mező (manifest validálásnál) */
	field?: string;
	/** További kontextus */
	details?: unknown;
}

/**
 * Validálási figyelmeztetés
 */
export interface ValidationWarning {
	/** Figyelmeztetés kódja */
	code: string;
	/** Figyelmeztetés üzenete */
	message: string;
	/** Érintett mező */
	field?: string;
}

/**
 * Validálási jelentés
 */
export interface ValidationReport {
	/** Validálás sikeres volt-e */
	valid: boolean;
	/** Hibák listája */
	errors: ValidationError[];
	/** Figyelmeztetések listája */
	warnings: ValidationWarning[];
	/** Validált manifest (ha sikeres) */
	manifest?: PluginManifest;
}

/**
 * Veszélyes kódminta
 */
export interface DangerousPattern {
	/** Minta neve */
	pattern: string;
	/** Fájl neve */
	file: string;
	/** Sor száma */
	line: number;
	/** Kontextus (kód részlet) */
	context: string;
}

/**
 * Kód szkennelési eredmény
 */
export interface CodeScanResult {
	/** Szkennelés sikeres volt-e */
	passed: boolean;
	/** Talált veszélyes minták */
	dangerousPatterns: DangerousPattern[];
}

/**
 * Függőség validálási eredmény
 */
export interface DependencyValidationResult {
	/** Validálás sikeres volt-e */
	valid: boolean;
	/** Érvénytelen függőségek */
	invalidDependencies: string[];
}

// ============================================================================
// Telepítés és Betöltés
// ============================================================================

/**
 * Feltöltési eredmény
 */
export interface UploadResult {
	/** Feltöltés sikeres volt-e */
	success: boolean;
	/** Ideiglenes fájl útvonala */
	tempPath?: string;
	/** Hibaüzenet */
	error?: string;
}

/**
 * Telepítési eredmény
 */
export interface InstallResult {
	/** Telepítés sikeres volt-e */
	success: boolean;
	/** Plugin azonosítója */
	pluginId?: string;
	/** Hibaüzenet */
	error?: string;
}

/**
 * Betöltési eredmény
 */
export interface LoadResult {
	/** Betöltés sikeres volt-e */
	success: boolean;
	/** Plugin komponens */
	component?: PluginModule;
	/** Hibaüzenet */
	error?: string;
}

/**
 * Plugin modul
 */
export interface PluginModule {
	/** Default export (Svelte komponens) */
	default: any; // SvelteComponent
	/** Plugin metaadatok */
	metadata?: PluginMetadata;
}

/**
 * Plugin metaadatok
 */
export interface PluginMetadata {
	/** Plugin név */
	name: string;
	/** Plugin verzió */
	version: string;
	/** Plugin leírás */
	description?: string;
}

// ============================================================================
// Frissítés és Eltávolítás
// ============================================================================

/**
 * Frissítési eredmény
 */
export interface UpdateResult {
	/** Frissítés sikeres volt-e */
	success: boolean;
	/** Régi verzió */
	oldVersion?: string;
	/** Új verzió */
	newVersion?: string;
	/** Hibaüzenet */
	error?: string;
}

/**
 * Eltávolítási eredmény
 */
export interface RemoveResult {
	/** Eltávolítás sikeres volt-e */
	success: boolean;
	/** Hibaüzenet */
	error?: string;
	/** Aktív felhasználók listája */
	activeUsers?: string[];
}

// ============================================================================
// Plugin Információk
// ============================================================================

/**
 * Plugin státusz
 */
export type PluginStatus = 'active' | 'inactive' | 'error';

/**
 * Plugin alapinformációk
 */
export interface PluginInfo {
	/** Plugin azonosítója */
	id: string;
	/** Plugin neve */
	name: string;
	/** Plugin verziója */
	version: string;
	/** Szerző */
	author: string;
	/** Leírás */
	description: string;
	/** Státusz */
	status: PluginStatus;
	/** Telepítés időpontja */
	installedAt: string;
	/** Frissítés időpontja */
	updatedAt?: string;
}

/**
 * Plugin részletes információk
 */
export interface PluginDetails extends PluginInfo {
	/** Jogosultságok */
	permissions: PluginPermission[];
	/** Függőségek */
	dependencies: Record<string, string>;
	/** Minimális webOS verzió */
	minWebOSVersion?: string;
	/** Támogatott nyelvek */
	locales: string[];
}

// ============================================================================
// API Request/Response Típusok
// ============================================================================

/**
 * Feltöltési kérés
 */
export interface UploadRequest {
	/** Plugin csomag fájl (kiterjesztés: környezeti változóból) */
	file: File;
}

/**
 * Feltöltési válasz
 */
export interface UploadResponse {
	/** Sikeres volt-e */
	success: boolean;
	/** Plugin azonosítója */
	pluginId?: string;
	/** Validálási hibák */
	errors?: ValidationError[];
}

/**
 * Plugin lista válasz
 */
export interface ListPluginsResponse {
	/** Pluginok listája */
	plugins: PluginInfo[];
}

/**
 * Plugin részletek válasz
 */
export interface GetPluginResponse {
	/** Plugin részletek */
	plugin: PluginDetails;
}

/**
 * Státusz frissítési kérés
 */
export interface UpdateStatusRequest {
	/** Új státusz */
	status: 'active' | 'inactive';
}

/**
 * Státusz frissítési válasz
 */
export interface UpdateStatusResponse {
	/** Sikeres volt-e */
	success: boolean;
}

/**
 * Plugin törlési kérés
 */
export interface DeletePluginRequest {
	/** Kényszerített törlés */
	force?: boolean;
}

/**
 * Plugin törlési válasz
 */
export interface DeletePluginResponse {
	/** Sikeres volt-e */
	success: boolean;
	/** Aktív felhasználók */
	activeUsers?: string[];
}

/**
 * Plugin frissítési kérés
 */
export interface UpdatePluginRequest {
	/** Új plugin csomag fájl (kiterjesztés: környezeti változóból) */
	file: File;
}

/**
 * Plugin frissítési válasz
 */
export interface UpdatePluginResponse {
	/** Sikeres volt-e */
	success: boolean;
	/** Régi verzió */
	oldVersion?: string;
	/** Új verzió */
	newVersion?: string;
	/** Validálási hibák */
	errors?: ValidationError[];
}

/**
 * Remote hívás kérés
 */
export interface RemoteCallRequest {
	/** Paraméterek */
	params: Record<string, unknown>;
}

/**
 * Remote hívás válasz
 */
export interface RemoteCallResponse {
	/** Sikeres volt-e */
	success: boolean;
	/** Eredmény */
	result?: unknown;
	/** Hibaüzenet */
	error?: string;
}

/**
 * Logok lekérdezési kérés
 */
export interface GetLogsRequest {
	/** Esemény típus szűrő */
	eventType?: string;
	/** Limit */
	limit?: number;
	/** Offset */
	offset?: number;
}

/**
 * Plugin log bejegyzés
 */
export interface PluginLog {
	/** Log azonosítója */
	id: number;
	/** Esemény típusa */
	eventType: string;
	/** Esemény adatok */
	eventData: unknown;
	/** Felhasználó azonosítója */
	userId?: string;
	/** Létrehozás időpontja */
	createdAt: string;
}

/**
 * Logok lekérdezési válasz
 */
export interface GetLogsResponse {
	/** Logok listája */
	logs: PluginLog[];
	/** Összes log száma */
	total: number;
}

/**
 * Metrikák lekérdezési kérés
 */
export interface GetMetricsRequest {
	/** Metrika típus szűrő */
	metricType?: string;
	/** Kezdő dátum */
	startDate?: string;
	/** Záró dátum */
	endDate?: string;
}

/**
 * Plugin metrika
 */
export interface PluginMetric {
	/** Metrika azonosítója */
	id: number;
	/** Metrika típusa */
	metricType: string;
	/** Metrika értéke */
	metricValue: number;
	/** Metaadatok */
	metadata: unknown;
	/** Létrehozás időpontja */
	createdAt: string;
}

/**
 * Metrikák lekérdezési válasz
 */
export interface GetMetricsResponse {
	/** Metrikák listája */
	metrics: PluginMetric[];
}

// ============================================================================
// Hibakódok
// ============================================================================

/**
 * Plugin rendszer hibakódok
 */
export enum PluginErrorCode {
	// Feltöltési hibák
	INVALID_EXTENSION = 'INVALID_EXTENSION',
	FILE_TOO_LARGE = 'FILE_TOO_LARGE',

	// ZIP hibák
	INVALID_ZIP = 'INVALID_ZIP',
	MISSING_MANIFEST = 'MISSING_MANIFEST',

	// Manifest hibák
	INVALID_MANIFEST = 'INVALID_MANIFEST',
	MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

	// Biztonsági hibák
	INVALID_SIGNATURE = 'INVALID_SIGNATURE',
	DANGEROUS_CODE_PATTERN = 'DANGEROUS_CODE_PATTERN',
	INVALID_DEPENDENCY = 'INVALID_DEPENDENCY',

	// Telepítési hibák
	DUPLICATE_PLUGIN_ID = 'DUPLICATE_PLUGIN_ID',
	INSTALLATION_FAILED = 'INSTALLATION_FAILED',

	// Frissítési hibák
	VERSION_NOT_GREATER = 'VERSION_NOT_GREATER',
	UPDATE_FAILED = 'UPDATE_FAILED',

	// Betöltési hibák
	PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND',
	PLUGIN_INACTIVE = 'PLUGIN_INACTIVE',
	PLUGIN_LOAD_TIMEOUT = 'PLUGIN_LOAD_TIMEOUT',
	LOAD_ERROR = 'LOAD_ERROR',

	// Jogosultság hibák
	PERMISSION_DENIED = 'PERMISSION_DENIED',

	// Remote hibák
	REMOTE_CALL_TIMEOUT = 'REMOTE_CALL_TIMEOUT',
	REMOTE_ERROR = 'REMOTE_ERROR',

	// Hálózati hibák
	NETWORK_ERROR = 'NETWORK_ERROR',
	TIMEOUT_ERROR = 'TIMEOUT_ERROR',
	SERVER_ERROR = 'SERVER_ERROR',
	CLIENT_ERROR = 'CLIENT_ERROR'
}

/**
 * Futásidejű hiba
 */
export interface RuntimeError {
	/** Plugin azonosítója */
	pluginId: string;
	/** Hiba típusa */
	errorType: 'load_error' | 'remote_error' | 'permission_error' | 'data_error';
	/** Hibaüzenet */
	message: string;
	/** Stack trace (csak fejlesztői módban) */
	stack?: string;
	/** Időbélyeg */
	timestamp: string;
}

// ============================================================================
// Digitális Aláírás
// ============================================================================

/**
 * Aláírás fájl struktúra
 */
export interface SignatureFile {
	/** Algoritmus */
	algorithm: 'RSA-SHA256';
	/** Publikus kulcs (PEM formátum) */
	publicKey: string;
	/** Aláírás (Base64 kódolt) */
	signature: string;
	/** Időbélyeg (ISO 8601 formátum) */
	timestamp: string;
	/** Fájl hash-ek (SHA256) */
	files: Record<string, string>;
}

// ============================================================================
// WebOS SDK Típusok
// ============================================================================

/**
 * Dialógus opciók
 */
export interface DialogOptions {
	/** Dialógus címe */
	title: string;
	/** Dialógus üzenete */
	message: string;
	/** Dialógus típusa */
	type?: 'info' | 'confirm' | 'prompt';
	/** Gombok */
	buttons?: DialogButton[];
}

/**
 * Dialógus gomb
 */
export interface DialogButton {
	/** Gomb szövege */
	label: string;
	/** Gomb akciója */
	action: string;
	/** Elsődleges gomb-e */
	primary?: boolean;
}

/**
 * Dialógus eredmény
 */
export interface DialogResult {
	/** Választott akció */
	action: string;
	/** Beírt érték (prompt esetén) */
	value?: string;
}

/**
 * Téma színek
 */
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

/**
 * Felhasználó információk
 */
export interface UserInfo {
	/** Felhasználó azonosítója */
	id: string;
	/** Felhasználó neve */
	name: string;
	/** Email cím */
	email: string;
	/** Szerepkörök */
	roles: string[];
	/** Csoportok */
	groups: string[];
}

/**
 * Ablak vezérlők
 */
export interface WindowControls {
	/** Ablak bezárása */
	close(): void;
	/** Ablak címének beállítása */
	setTitle(title: string): void;
}

/**
 * Értesítés opciók
 */
export interface NotificationOptions {
	/** Címzett felhasználó azonosítója */
	userId: string;
	/** Értesítés címe */
	title: string;
	/** Értesítés üzenete */
	message: string;
	/** Értesítés típusa */
	type?: 'info' | 'success' | 'warning' | 'error';
}

/**
 * Remote hívás opciók
 */
export interface CallOptions {
	/** Timeout milliszekundumban */
	timeout?: number;
}

/**
 * Tranzakció interfész
 */
export interface Transaction {
	/** SQL lekérdezés végrehajtása */
	query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
	/** Tranzakció commit */
	commit(): Promise<void>;
	/** Tranzakció rollback */
	rollback(): Promise<void>;
}
