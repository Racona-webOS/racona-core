/**
 * Közvetlen link egy apphoz: `/admin?app=<appName>&entry=<mobil bejegyzés>` vagy
 * `/admin?app=<appName>&section=<menüpont>`. Pl. e-mailekből: a hiányzó
 * munkanapló emlékeztetője egy koppintással a munkanapló rögzítéséhez visz.
 *
 * Csak a felhasználó számára elérhető app nyílik meg (app-nyilvántartás), és csak
 * az `entry` és a `section` paraméter jut át.
 */
import type { WindowManager } from '$lib/stores';
import type { ShellMode } from '$lib/stores/shellMode';
import type { AppMetadata } from '$lib/types/window';
import {
	findMobileEntry,
	openMobileEntry,
	openOnMobile,
	MOBILE_ENTRY_PARAM
} from '$lib/components/core/mobile/mobileNavigation';

export const DEEP_LINK_PARAMS = ['app', 'entry', 'section'] as const;

export interface DeepLink {
	app: string;
	entry?: string;
	section?: string;
}

const APP_NAME = /^[a-z0-9-]{1,50}$/;
const ENTRY_ID = /^[a-z0-9-]{1,50}$/;
const SECTION = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

/** A közvetlen link a címből; érvénytelen értéket figyelmen kívül hagy */
export function parseDeepLink(url: URL): DeepLink | null {
	const app = url.searchParams.get('app');
	if (!app || !APP_NAME.test(app)) return null;

	const entry = url.searchParams.get('entry');
	const section = url.searchParams.get('section');
	return {
		app,
		entry: entry && ENTRY_ID.test(entry) ? entry : undefined,
		section: section && section.length <= 100 && SECTION.test(section) ? section : undefined
	};
}

/** A cím a közvetlen link paraméterei nélkül (újratöltéskor ne nyíljon meg újra) */
export function stripDeepLink(url: URL): URL {
	const clean = new URL(url);
	for (const param of DEEP_LINK_PARAMS) clean.searchParams.delete(param);
	return clean;
}

/**
 * A közvetlen link megnyitása. Mobilon csak mobilon támogatott app vagy bejegyzés
 * nyílik meg; asztalon a bejegyzés komponense az app ablakában. Visszaadja, hogy
 * megnyílt-e.
 */
export function openDeepLink(
	windowManager: WindowManager,
	app: AppMetadata,
	link: DeepLink,
	mode: ShellMode
): boolean {
	if (mode === 'mobile') {
		return openOnMobile(windowManager, app, link.entry ? { [MOBILE_ENTRY_PARAM]: link.entry } : {});
	}

	const entry = findMobileEntry(app, link.entry);
	if (entry) {
		openMobileEntry(windowManager, app, entry);
	} else {
		windowManager.openWindow(
			app.appName,
			app.title,
			app,
			link.section ? { section: link.section } : {}
		);
	}
	return true;
}
