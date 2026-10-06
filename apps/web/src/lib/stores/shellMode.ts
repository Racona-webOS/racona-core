/**
 * A felület kerete: asztali (ablakok, tálca) vagy mobil (egy app teljes képernyőn).
 *
 * A szerver dönti el oldalbetöltéskor (`racona_shell` süti, különben az eszköz
 * típusa), a védett layout kontextusba teszi. Váltás: süti + újratöltés.
 */
import { getContext, setContext } from 'svelte';

export type ShellMode = 'desktop' | 'mobile';

export interface ShellInfo {
	/** A megjelenített keret */
	mode: ShellMode;
	/** Az eszköz típusa a böngészőazonosító alapján (a kézi választástól függetlenül) */
	deviceType: ShellMode;
}

/** Süti a kézzel választott kerethez (asztali nézet telefonon és vissza) */
export const SHELL_COOKIE = 'racona_shell';

const SHELL_INFO_KEY = Symbol('shellInfo');

const DEFAULT_INFO: ShellInfo = { mode: 'desktop', deviceType: 'desktop' };

export function setShellInfo(info: ShellInfo): void {
	setContext(SHELL_INFO_KEY, info);
}

/** A keret adatai; kontextuson kívül (vagy beállítás nélkül) asztali */
export function getShellInfo(): ShellInfo {
	try {
		return getContext<ShellInfo | undefined>(SHELL_INFO_KEY) ?? DEFAULT_INFO;
	} catch {
		return DEFAULT_INFO;
	}
}

export function isMobileShell(): boolean {
	return getShellInfo().mode === 'mobile';
}

/** Keret kézi kiválasztása: a süti egy évig él, utána újratöltés */
export function switchShell(mode: ShellMode): void {
	document.cookie = `${SHELL_COOKIE}=${mode}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
	window.location.reload();
}
