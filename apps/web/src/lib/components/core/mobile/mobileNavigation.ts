/**
 * Appok megnyitása a mobil keretben. A megnyitott ablak aktívvá válik, a
 * MobileShell pedig az aktív ablakot mutatja teljes képernyőn.
 */
import type { WindowManager } from '$lib/stores';
import type { AppMetadata, AppMobileEntry, AppParameters } from '$lib/types/window';

/** Az app-ablak paramétere, amely a megnyitandó mobil bejegyzést adja meg */
export const MOBILE_ENTRY_PARAM = 'mobileEntry';

/** Teljes app megnyitása (mobil bejegyzés nélküli, mobilon támogatott app) */
export function openMobileApp(windowManager: WindowManager, app: AppMetadata): string {
	return windowManager.openWindow(app.appName, app.title, app);
}

/** Egy mobil bejegyzés megnyitása: az app a bejegyzés komponensével, önálló képernyőként */
export function openMobileEntry(
	windowManager: WindowManager,
	app: AppMetadata,
	entry: AppMobileEntry
): string {
	const id = windowManager.openWindow(app.appName, entry.label, app, {
		[MOBILE_ENTRY_PARAM]: entry.id
	});
	// Már nyitott (egypéldányos) appnál a cím az előző bejegyzésé maradna
	windowManager.updateWindowTitle(id, entry.label);
	return id;
}

/**
 * Megnyitható-e mobilon egy app a megadott paraméterekkel (pl. egy értesítésből).
 * Bejegyzések nélküli appnál bármikor; bejegyzésekkel csak akkor, ha a paraméter
 * egy létező bejegyzésre mutat (különben a teljes, asztali felület nyílna meg).
 */
export function canOpenOnMobile(app: AppMetadata | undefined, parameters: AppParameters = {}) {
	if (!app?.mobile) return false;
	const entries = app.mobile.entries;
	if (entries.length === 0) return true;
	const entryId = parameters[MOBILE_ENTRY_PARAM];
	return entries.some((entry) => entry.id === entryId);
}
