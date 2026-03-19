/**
 * Mock I18n Service
 *
 * Mock fordítások konfigurálható translation map-pel.
 */

import type { I18nService } from '../../types/index.js';

export interface MockI18nConfig {
	locale?: string;
	translations?: Record<string, Record<string, string>>;
}

export class MockI18nService implements I18nService {
	private _locale: string;
	private translations: Record<string, Record<string, string>>;
	private _onLocaleChange: (() => void) | null = null;

	/** @param config - Opcionális locale és fordítások konfigurálása */
	constructor(config?: MockI18nConfig) {
		this._locale = config?.locale ?? 'en';
		this.translations = config?.translations ?? {};
	}

	/**
	 * Fordítási kulcs feloldása a konfigurált fordítások alapján.
	 * @param key - Fordítási kulcs
	 * @param params - Interpolációs paraméterek
	 * @returns Fordított szöveg, vagy a kulcs ha nincs fordítás
	 */
	t(key: string, params?: Record<string, string | number>): string {
		const localeTranslations = this.translations[this._locale];
		let translation = localeTranslations?.[key];

		if (!translation) {
			return key;
		}

		if (params) {
			for (const [paramKey, paramValue] of Object.entries(params)) {
				translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
			}
		}

		return translation;
	}

	/** Aktuális nyelv kódja. */
	get locale(): string {
		return this._locale;
	}

	/**
	 * Nyelv váltása — console-ra logol és meghívja az `onLocaleChange` callbacket.
	 * @param locale - Az új nyelv kódja
	 */
	async setLocale(locale: string): Promise<void> {
		this._locale = locale;
		console.log(`[Mock I18n] Locale changed to: ${locale}`);
		this._onLocaleChange?.();
	}

	/** Mock módban azonnal kész — nincs aszinkron betöltés. */
	async ready(): Promise<void> {
		// Mock — azonnal kész
	}

	/**
	 * Callback regisztrálása locale váltáskor.
	 * @param callback - Meghívandó függvény locale váltás után
	 */
	onLocaleChange(callback: () => void): void {
		this._onLocaleChange = callback;
	}
}
