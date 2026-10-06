/**
 * @packageDocumentation
 * A megjelenítendő keret (asztali vagy mobil) kiválasztása oldalbetöltéskor.
 */

import type { Cookies } from '@sveltejs/kit';
import { SHELL_COOKIE, type ShellInfo } from '$lib/stores/shellMode';
import { classifyDevice } from './device';

/**
 * A kézzel választott keret (süti) az elsődleges, különben az eszköz típusa dönt.
 * Asztali böngésző összeszűkítése nem vált mobil keretre.
 */
export function resolveShellInfo(cookies: Cookies, userAgent: string | null): ShellInfo {
	const deviceType = classifyDevice(userAgent);
	const chosen = cookies.get(SHELL_COOKIE);
	const mode = chosen === 'desktop' || chosen === 'mobile' ? chosen : deviceType;
	return { mode, deviceType };
}
