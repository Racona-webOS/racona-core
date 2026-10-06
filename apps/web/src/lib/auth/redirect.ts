/**
 * Belépés utáni visszatérési cím (`?redirectTo=`) kezelése.
 *
 * Ha egy kijelentkezett felhasználó védett címet nyit meg (pl. egy e-mailben
 * kapott közvetlen linket), a belépőoldal megkapja az eredeti címet, és belépés
 * után oda visz vissza. Csak az alkalmazáson belüli, `/admin` alatti címet
 * fogadjuk el, hogy a paraméterrel ne lehessen idegen oldalra irányítani.
 */

export const REDIRECT_PARAM = 'redirectTo';

export const DEFAULT_REDIRECT = '/admin';

/** Belépéssel kapcsolatos oldalak: ide nem érdemes visszavinni */
const AUTH_PATHS = [
	'/admin/sign-in',
	'/admin/sign-up',
	'/admin/verify-2fa',
	'/admin/forget-password',
	'/admin/reset-password',
	'/admin/resend-verification'
];

const BASE = 'http://racona.invalid';

/**
 * Biztonságos visszatérési cím. Érvénytelen, külső vagy belépéssel kapcsolatos
 * cím esetén az alapértelmezett `/admin`.
 */
export function safeRedirectTarget(value: string | null | undefined): string {
	if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
		return DEFAULT_REDIRECT;
	}

	let url: URL;
	try {
		url = new URL(value, BASE);
	} catch {
		return DEFAULT_REDIRECT;
	}

	if (url.origin !== BASE) return DEFAULT_REDIRECT;
	if (url.pathname !== '/admin' && !url.pathname.startsWith('/admin/')) return DEFAULT_REDIRECT;
	if (AUTH_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`))) {
		return DEFAULT_REDIRECT;
	}

	return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Belépéssel kapcsolatos oldal címe a visszatérési cím továbbadásával.
 * Az alapértelmezett célt nem írjuk ki, hogy a cím rövid maradjon.
 */
export function withRedirectTarget(path: string, target: string): string {
	if (target === DEFAULT_REDIRECT) return path;
	return `${path}?${REDIRECT_PARAM}=${encodeURIComponent(target)}`;
}
