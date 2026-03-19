/**
 * I18n Service
 *
 * Plugin fordítások kezelése.
 * Kulcsok automatikusan prefixelve plugin:{plugin_id} névtérrel.
 */

import type { I18nService as II18nService } from '../../types/index.js';

export class I18nService implements II18nService {
	private readonly pluginId: string;
	private translations: Map<string, string> = new Map();
	private _locale: string = 'en';
	private loadingPromise: Promise<void> | null = null;
	private storageListener: ((e: StorageEvent) => void) | null = null;
	private _onLocaleChangeCallbacks: Array<() => void> = [];

	/**
	 * @param pluginId - Plugin egyedi azonosítója
	 * @param skipAutoLoad - Ha `true`, nem tölti be automatikusan a fordításokat (dev módhoz)
	 */
	constructor(pluginId: string, skipAutoLoad = false) {
		this.pluginId = pluginId;
		this.detectLocale();
		if (!skipAutoLoad) {
			this.loadingPromise = this.loadTranslations();
		}
		this.listenForLocaleChanges();
	}

	/**
	 * Callback regisztrálása locale váltáskor (pl. Svelte `$state` frissítéshez).
	 * Több callback is regisztrálható — mindegyik meghívódik a fordítások betöltése után.
	 * @param callback - Meghívandó függvény locale váltás után
	 */
	onLocaleChange(callback: () => void): void {
		this._onLocaleChangeCallbacks.push(callback);
	}

	/** Rendszer szintű locale váltás figyelése (ElyOS CustomEvent) */
	private listenForLocaleChanges(): void {
		if (typeof window === 'undefined') return;

		this.storageListener = ((e: Event) => {
			const detail = (e as CustomEvent<{ locale: string }>).detail;
			if (detail?.locale && detail.locale !== this._locale) {
				this._locale = detail.locale;
				this.translations.clear();
				this.loadingPromise = this.loadTranslations().then(() => {
					this._onLocaleChangeCallbacks.forEach((cb) => cb());
				});
			}
		}) as (e: StorageEvent) => void;

		window.addEventListener('elyos:locale-change', this.storageListener as EventListener);
	}

	/** Listener eltávolítása — hívd meg a plugin unmount-jakor. */
	destroy(): void {
		if (this.storageListener && typeof window !== 'undefined') {
			window.removeEventListener('elyos:locale-change', this.storageListener as EventListener);
			this.storageListener = null;
		}
	}

	/** Aktuális nyelv detektálása az ElyOS elyos_locale cookie-ból */
	private detectLocale(): void {
		if (typeof document !== 'undefined') {
			const match = document.cookie.match(/(?:^|;\s*)elyos_locale=([^;]+)/);
			if (match?.[1]) {
				this._locale = decodeURIComponent(match[1]);
				return;
			}
		}
		if (typeof navigator !== 'undefined') {
			this._locale = navigator.language.split('-')[0] ?? 'en';
		}
	}

	/**
	 * Fordítások közvetlen betöltése objektumból (dev módhoz).
	 * Az ElyOS core hívja meg dev plugin betöltésekor.
	 * @param translations - Fordítások kulcs-érték párokban
	 */
	loadTranslationsFromObject(translations: Record<string, string>): void {
		this.translations.clear();
		for (const [key, value] of Object.entries(translations)) {
			this.translations.set(key, value);
		}
		// Megakadályozzuk, hogy az API hívás felülírja a dev szerverről betöltött fordításokat
		this.loadingPromise = Promise.resolve();
	}

	/** Fordítások betöltése a szerverről */
	private async loadTranslations(): Promise<void> {
		try {
			const response = await fetch(
				`/api/plugins/${this.pluginId}/translations?locale=${this._locale}`
			);

			if (!response.ok) {
				console.warn(`[I18nService] Failed to load translations for ${this.pluginId}`);
				return;
			}

			const data = (await response.json()) as {
				success: boolean;
				translations?: Record<string, string>;
			};

			if (data.success && data.translations) {
				for (const [key, value] of Object.entries(data.translations)) {
					this.translations.set(key, value);
				}
			}
		} catch (error) {
			console.error(`[I18nService] Error loading translations:`, error);
		}
	}

	/** Várja meg a fordítások betöltését a szerverről. */
	async ready(): Promise<void> {
		if (this.loadingPromise) {
			await this.loadingPromise;
		}
	}

	/**
	 * Fordítási kulcs feloldása
	 *
	 * @param key - Fordítási kulcs (prefix nélkül, pl. "title")
	 * @param params - Paraméterek interpolációhoz
	 * @returns Fordított szöveg
	 */
	t(key: string, params?: Record<string, string | number>): string {
		let translation = this.translations.get(key);

		if (!translation) {
			console.warn(`[I18nService] Translation not found: plugin:${this.pluginId}.${key}`);
			return key;
		}

		if (params) {
			for (const [paramKey, paramValue] of Object.entries(params)) {
				translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
			}
		}

		return translation;
	}

	/** Aktuális nyelv kódja (pl. `"hu"`, `"en"`). */
	get locale(): string {
		return this._locale;
	}

	/**
	 * Nyelv váltása és fordítások újratöltése a szerverről.
	 * @param newLocale - Az új nyelv kódja
	 */
	async setLocale(newLocale: string): Promise<void> {
		this._locale = newLocale;
		this.translations.clear();
		this.loadingPromise = this.loadTranslations();
		await this.loadingPromise;
	}
}
