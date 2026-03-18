/**
 * Translation Store - Svelte 5 runes alapú reaktív store
 */

import { getContext, setContext } from 'svelte';
import { SvelteSet, SvelteMap } from 'svelte/reactivity';
import type { TranslationState, LocaleConfig } from './types.js';
import { ALL_AVAILABLE_LOCALES, getSupportedLocales } from './config.js';
import { invalidateTranslationCache } from './loader.js';

const TRANSLATION_STORE_KEY = Symbol('translationStore');

/**
 * Alapértelmezett támogatott nyelvek
 * Inicializáláskor az összes nyelvet tartalmazza, de a setSupportedLocales()
 * metódussal beállítható a tényleges támogatott nyelvek listája.
 */
export const DEFAULT_SUPPORTED_LOCALES: LocaleConfig[] = ALL_AVAILABLE_LOCALES;

/**
 * Export az ALL_AVAILABLE_LOCALES-t is
 */
export { ALL_AVAILABLE_LOCALES };

/**
 * Translation Store osztály
 */
export class TranslationStore {
	private _locale = $state<string>('hu');
	private _fallbackLocale = $state<string>('hu');
	private _loadedNamespaces = $state<SvelteSet<string>>(new SvelteSet());
	private _translations = $state<SvelteMap<string, string>>(new SvelteMap());
	private _fallbackTranslations = $state<SvelteMap<string, string>>(new SvelteMap());
	private _error = $state<string | null>(null);
	private _supportedLocales = $state<LocaleConfig[]>(DEFAULT_SUPPORTED_LOCALES);
	private _loadNamespaceCallback:
		| ((namespace: string, locale: string) => Promise<Record<string, string>>)
		| null = null;
	// Hiányzó és placeholder kulcsok - NEM reaktív, mert template renderelés közben módosulnak
	private _missingKeys: Array<{ key: string; locale: string; timestamp: number }> = [];
	private _placeholderKeys: Array<{ key: string; locale: string; timestamp: number }> = [];
	// Reaktív számláló a DevTools frissítéséhez
	private _issueCounter = $state(0);
	private _pendingLoads = new SvelteSet<string>();
	// Namespace-ek amelyek betöltése be van ütemezve (I18nProvider regisztrálta),
	// de az onMount még nem futott le — logMissingKey ezeket kihagyja
	private _registeredNamespaces = new Set<string>();
	// Locale váltás közben ne logoljunk hiányzó kulcsokat (race condition elkerülése)
	private _isSwitchingLocale = false;

	// Placeholder érték konstans
	private static readonly PLACEHOLDER_VALUE = '*****';

	constructor(initialLocale?: string, fallbackLocale?: string) {
		if (initialLocale) this._locale = initialLocale;
		if (fallbackLocale) this._fallbackLocale = fallbackLocale;
	}

	get currentLocale(): string {
		return this._locale;
	}

	get fallbackLocale(): string {
		return this._fallbackLocale;
	}

	get loading(): boolean {
		return this._pendingLoads.size > 0;
	}

	get error(): string | null {
		return this._error;
	}

	get loadedNamespaces(): Set<string> {
		return this._loadedNamespaces;
	}

	get supportedLocales(): LocaleConfig[] {
		return this._supportedLocales;
	}

	get currentLocaleConfig(): LocaleConfig | undefined {
		return this._supportedLocales.find((l) => l.code === this._locale);
	}

	get state(): TranslationState {
		return {
			locale: this._locale,
			fallbackLocale: this._fallbackLocale,
			loadedNamespaces: this._loadedNamespaces,
			translations: this._translations,
			loading: this._pendingLoads.size > 0,
			error: this._error
		};
	}

	setLoadNamespaceCallback(
		callback: (namespace: string, locale: string) => Promise<Record<string, string>>
	): void {
		this._loadNamespaceCallback = callback;
	}

	setSupportedLocales(locales: LocaleConfig[]): void {
		this._supportedLocales = locales;
	}

	async setLocale(locale: string): Promise<void> {
		const isSupported = this._supportedLocales.some((l) => l.code === locale);
		if (!isSupported) {
			console.warn(`[I18n] Locale "${locale}" is not supported`);
			return;
		}

		if (locale === this._locale) return;

		const previousLocale = this._locale;
		const namespacesToReload = new SvelteSet(this._loadedNamespaces);

		this._error = null;

		try {
			this._isSwitchingLocale = true;
			this._locale = locale;
			this._translations = new SvelteMap();
			this._loadedNamespaces = new SvelteSet();
			// Loader cache invalidálása az új locale-ra, hogy friss adatot kapjunk
			invalidateTranslationCache(undefined, locale);

			if (locale !== this._fallbackLocale) {
				await this.loadFallbackTranslations(namespacesToReload);
			}

			for (const namespace of namespacesToReload) {
				await this.loadNamespace(namespace);
			}
		} catch (error) {
			this._locale = previousLocale;
			this._error = error instanceof Error ? error.message : 'Failed to change locale';
			console.error('[I18n] Failed to change locale:', error);
		} finally {
			this._isSwitchingLocale = false;
		}
	}

	private async loadFallbackTranslations(namespaces: SvelteSet<string>): Promise<void> {
		if (!this._loadNamespaceCallback) return;

		this._fallbackTranslations = new SvelteMap();

		for (const namespace of namespaces) {
			try {
				const translations = await this._loadNamespaceCallback(namespace, this._fallbackLocale);
				for (const [key, value] of Object.entries(translations)) {
					this._fallbackTranslations.set(`${namespace}.${key}`, value);
				}
			} catch (error) {
				console.warn(`[I18n] Failed to load fallback for "${namespace}":`, error);
			}
		}
	}

	/**
	 * Namespace regisztrálása betöltésre (I18nProvider hívja mount előtt).
	 * Csak a logMissingKey elnyomásához — a tényleges betöltés loadNamespace-ben történik.
	 */
	registerNamespace(namespace: string): void {
		if (!this._loadedNamespaces.has(namespace)) {
			this._registeredNamespaces.add(namespace);
		}
	}

	async loadNamespace(namespace: string): Promise<void> {
		if (this._loadedNamespaces.has(namespace)) return;
		if (this._pendingLoads.has(namespace)) return;

		if (!this._loadNamespaceCallback) {
			console.warn('[I18n] Loader callback not set');
			return;
		}

		this._pendingLoads.add(namespace);

		try {
			const translations = await this._loadNamespaceCallback(namespace, this._locale);

			for (const [key, value] of Object.entries(translations)) {
				this._translations.set(`${namespace}.${key}`, value);
			}

			if (this._locale !== this._fallbackLocale) {
				try {
					const fallbackTranslations = await this._loadNamespaceCallback(
						namespace,
						this._fallbackLocale
					);
					for (const [key, value] of Object.entries(fallbackTranslations)) {
						const fullKey = `${namespace}.${key}`;
						if (!this._fallbackTranslations.has(fullKey)) {
							this._fallbackTranslations.set(fullKey, value);
						}
					}
				} catch {
					// Fallback betöltési hiba nem kritikus
				}
			}

			this._loadedNamespaces.add(namespace);
		} catch (error) {
			this._error =
				error instanceof Error ? error.message : `Failed to load namespace: ${namespace}`;
			console.error(`[I18n] Failed to load namespace "${namespace}":`, error);
		} finally {
			this._pendingLoads.delete(namespace);
			this._registeredNamespaces.delete(namespace);
		}
	}

	getTranslation(key: string, params?: Record<string, string | number>): string {
		let translation = this._translations.get(key);

		if (translation === undefined) {
			translation = this._fallbackTranslations.get(key);
		}

		if (translation === undefined) {
			this.logMissingKey(key);
			return key;
		}

		// Placeholder érték ellenőrzése
		if (translation === TranslationStore.PLACEHOLDER_VALUE) {
			this.logPlaceholderKey(key);
			return key;
		}

		if (params) {
			return this.interpolate(translation, params);
		}

		return translation;
	}

	hasTranslation(key: string): boolean {
		return this._translations.has(key) || this._fallbackTranslations.has(key);
	}

	clearCache(): void {
		this._translations = new SvelteMap();
		this._fallbackTranslations = new SvelteMap();
		this._loadedNamespaces = new SvelteSet();
		this._error = null;
	}

	/**
	 * Fordítások közvetlen hozzáadása egy namespace-hez (pl. dev plugin fordítások).
	 * A namespace betöltöttnek lesz jelölve, így az I18nProvider nem próbálja újra betölteni.
	 */
	addTranslations(namespace: string, translations: Record<string, string>): void {
		for (const [key, value] of Object.entries(translations)) {
			this._translations.set(`${namespace}.${key}`, value);
		}
		this._loadedNamespaces.add(namespace);
	}

	getMissingKeys(): Array<{ key: string; locale: string; timestamp: number }> {
		// Számláló olvasása a reaktivitás érdekében
		void this._issueCounter;
		return [...this._missingKeys];
	}

	getPlaceholderKeys(): Array<{ key: string; locale: string; timestamp: number }> {
		// Számláló olvasása a reaktivitás érdekében
		void this._issueCounter;
		return [...this._placeholderKeys];
	}

	private interpolate(text: string, params: Record<string, string | number>): string {
		return text.replace(/\{(\w+)\}/g, (_, key) => {
			const value = params[key];
			if (value === undefined) return '';
			return String(value);
		});
	}

	private logMissingKey(key: string): void {
		// Locale váltás közben ne logoljunk — a fordítások még töltődnek
		if (this._isSwitchingLocale) return;

		// Ha a kulcs namespace-e még töltés alatt van, ne logoljunk
		const keyNamespace = key.split('.')[0];
		if (keyNamespace && this._pendingLoads.has(keyNamespace)) return;

		// Ha a namespace be van ütemezve (I18nProvider regisztrálta, de onMount még nem futott),
		// ne logoljunk — a fordítások hamarosan betöltődnek
		if (keyNamespace && this._registeredNamespaces.has(keyNamespace)) return;

		if (typeof window !== 'undefined' && import.meta.env?.DEV) {
			console.warn(`[I18n] Missing key: "${key}" for locale "${this._locale}"`);
		}

		const exists = this._missingKeys.some((m) => m.key === key && m.locale === this._locale);
		if (!exists) {
			this._missingKeys.push({ key, locale: this._locale, timestamp: Date.now() });
			// Késleltetett számláló növelés a renderelési cikluson kívül
			queueMicrotask(() => {
				this._issueCounter++;
			});
		}
	}

	private logPlaceholderKey(key: string): void {
		if (typeof window !== 'undefined' && import.meta.env?.DEV) {
			console.warn(`[I18n] Placeholder value: "${key}" for locale "${this._locale}"`);
		}

		const exists = this._placeholderKeys.some((m) => m.key === key && m.locale === this._locale);
		if (!exists) {
			this._placeholderKeys.push({ key, locale: this._locale, timestamp: Date.now() });
			// Késleltetett számláló növelés a renderelési cikluson kívül
			queueMicrotask(() => {
				this._issueCounter++;
			});
		}
	}
}

// Globális singleton
let globalTranslationStore: TranslationStore | null = null;

// Globális "egyszer már betöltöttük" flag — layout újramountolásnál sem resetelődik
let globalEverLoaded = false;

export function getGlobalEverLoaded(): boolean {
	return globalEverLoaded;
}

export function setGlobalEverLoaded(value: boolean): void {
	globalEverLoaded = value;
}

export function createTranslationStore(
	initialLocale?: string,
	fallbackLocale?: string
): TranslationStore {
	if (!globalTranslationStore) {
		globalTranslationStore = new TranslationStore(initialLocale, fallbackLocale);
	}
	return globalTranslationStore;
}

export function setTranslationStore(store: TranslationStore): void {
	globalTranslationStore = store;
	setContext(TRANSLATION_STORE_KEY, store);
}

export function getTranslationStore(): TranslationStore {
	try {
		const contextStore = getContext<TranslationStore>(TRANSLATION_STORE_KEY);
		if (contextStore) return contextStore;
	} catch {
		// Context nem elérhető
	}

	if (!globalTranslationStore) {
		globalTranslationStore = new TranslationStore();
	}
	return globalTranslationStore;
}

export function resetTranslationStore(): void {
	globalTranslationStore = null;
}
