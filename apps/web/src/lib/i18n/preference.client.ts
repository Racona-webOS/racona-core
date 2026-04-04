/**
 * I18n Preference Client Utilities
 *
 * Kliens oldali segédfüggvények a nyelvi preferenciák kezeléséhez.
 * Cookie olvasás és írás a böngészőben.
 *
 * Requirements: 5.3
 */

import { LOCALE_COOKIE_NAME, LOCALE_COOKIE_MAX_AGE, isLocaleSupported } from './preference.js';

/**
 * Locale cookie olvasása a böngészőben
 */
export function getLocaleCookie(): string | null {
	if (typeof document === 'undefined') return null;

	const cookies = document.cookie.split(';');
	for (const cookie of cookies) {
		const [name, value] = cookie.trim().split('=');
		if (name === LOCALE_COOKIE_NAME) {
			const locale = decodeURIComponent(value);
			return isLocaleSupported(locale) ? locale : null;
		}
	}
	return null;
}

/**
 * Locale cookie beállítása a böngészőben
 */
export function setLocaleCookie(locale: string): boolean {
	if (typeof document === 'undefined') return false;

	if (!isLocaleSupported(locale)) {
		console.warn(`Cannot set unsupported locale: ${locale}`);
		return false;
	}

	const expires = new Date();
	expires.setTime(expires.getTime() + LOCALE_COOKIE_MAX_AGE * 1000);

	const secure = location.protocol === 'https:' ? '; Secure' : '';
	document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax${secure}`;

	return true;
}

/**
 * Locale cookie törlése
 */
export function clearLocaleCookie(): void {
	if (typeof document === 'undefined') return;

	const secure = location.protocol === 'https:' ? '; Secure' : '';
	document.cookie = `${LOCALE_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
}

/**
 * Böngésző nyelv lekérése
 */
export function getBrowserLocale(): string | null {
	if (typeof navigator === 'undefined') return null;

	const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage;
	if (!browserLang) return null;

	// Normalizálás: csak az első rész (pl. "en-US" -> "en")
	const normalized = browserLang.toLowerCase().split('-')[0];

	return isLocaleSupported(normalized) ? normalized : null;
}
