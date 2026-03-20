/**
 * Mock I18n Service
 *
 * Mock translations with a configurable translation map.
 */

import type { I18nService } from '../../types/index.js';

/**
 * Configuration for the mock i18n service.
 *
 * Allows you to configure the initial locale and provide a translation map
 * for testing and standalone development.
 *
 * @example
 * ```ts
 * const config: MockI18nConfig = {
 *   locale: 'hu',
 *   translations: {
 *     en: { greeting: 'Hello', farewell: 'Goodbye' },
 *     hu: { greeting: 'Szia', farewell: 'Viszlát' }
 *   }
 * };
 * ```
 */
export interface MockI18nConfig {
	/**
	 * Initial locale code.
	 * @default `"en"`
	 */
	locale?: string;
	/**
	 * Translations map: `{ [locale]: { [key]: value } }`.
	 * Each locale maps to an object of translation keys and their values.
	 */
	translations?: Record<string, Record<string, string>>;
}

/** Mock I18n service — resolves translations from a configurable in-memory map. */
export class MockI18nService implements I18nService {
	/** Currently active locale code */
	private _locale: string;
	/** Translations map: `{ [locale]: { [key]: value } }` */
	private translations: Record<string, Record<string, string>>;
	/** Registered locale change callback */
	private _onLocaleChange: (() => void) | null = null;

	/** @param config - Optional locale and translations configuration */
	constructor(config?: MockI18nConfig) {
		this._locale = config?.locale ?? 'en';
		this.translations = config?.translations ?? {};
	}

	/**
	 * Resolve a translation key from the configured translations.
	 * @param key - Translation key
	 * @param params - Interpolation parameters
	 * @returns Translated string, or the key if no translation is found
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

	/** Current locale code. */
	get locale(): string {
		return this._locale;
	}

	/**
	 * Switch locale — logs to the console and calls the `onLocaleChange` callback.
	 * @param locale - New locale code
	 */
	async setLocale(locale: string): Promise<void> {
		this._locale = locale;
		console.log(`[Mock I18n] Locale changed to: ${locale}`);
		this._onLocaleChange?.();
	}

	/** Immediately ready in mock mode — no async loading. */
	async ready(): Promise<void> {
		// No-op in mock mode
	}

	/**
	 * Register a callback to be called after locale changes.
	 * @param callback - Function to call after locale change
	 */
	onLocaleChange(callback: () => void): void {
		this._onLocaleChange = callback;
	}
}
