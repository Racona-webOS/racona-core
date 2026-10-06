/**
 * Appok és mobil bejegyzések megnyitása. A megnyitott ablak aktívvá válik, a
 * MobileShell pedig az aktív ablakot mutatja teljes képernyőn. Asztalon is
 * használható (közvetlen link): ott a bejegyzés komponense nyílik meg az app ablakában.
 */
import type { WindowManager } from '$lib/stores';
import type { AppMetadata, AppMobileEntry, AppParameters } from '$lib/types/window';

/** Az ablak paramétere: a megnyitott mobil bejegyzés azonosítója (értesítés, közvetlen link) */
export const MOBILE_ENTRY_PARAM = 'mobileEntry';

/** Az ablak paramétere: a bejegyzés komponense, erre navigál az app shell */
export const MOBILE_COMPONENT_PARAM = 'mobileComponent';

/** A megadott azonosítójú mobil bejegyzés, ha az app ilyet deklarál */
export function findMobileEntry(
	app: AppMetadata | undefined,
	entryId: unknown
): AppMobileEntry | undefined {
	if (typeof entryId !== 'string') return undefined;
	return app?.mobile?.entries.find((entry) => entry.id === entryId);
}

/** Teljes app megnyitása */
export function openMobileApp(
	windowManager: WindowManager,
	app: AppMetadata,
	parameters: AppParameters = {}
): string {
	return windowManager.openWindow(app.appName, app.title, app, parameters);
}

/**
 * Egy mobil bejegyzés megnyitása: az app a bejegyzés komponensével, önálló képernyőként.
 * A további paraméterek (pl. egy értesítés adatai) a komponens felé továbbmennek.
 */
export function openMobileEntry(
	windowManager: WindowManager,
	app: AppMetadata,
	entry: AppMobileEntry,
	parameters: AppParameters = {}
): string {
	const id = windowManager.openWindow(app.appName, entry.label, app, {
		...parameters,
		// Egypéldányos appnál a korábbi menüpont ne írja felül a bejegyzést
		section: undefined,
		[MOBILE_ENTRY_PARAM]: entry.id,
		[MOBILE_COMPONENT_PARAM]: entry.component
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
	if (app.mobile.entries.length === 0) return true;
	return findMobileEntry(app, parameters[MOBILE_ENTRY_PARAM]) !== undefined;
}

/**
 * Megnyitás a mobil keretben: bejegyzésre mutató paraméternél a bejegyzés, különben
 * a teljes app (ha mobilon támogatott). Visszaadja, hogy megnyílt-e.
 */
export function openOnMobile(
	windowManager: WindowManager,
	app: AppMetadata | undefined,
	parameters: AppParameters = {}
): boolean {
	if (!app || !canOpenOnMobile(app, parameters)) return false;
	const entry = findMobileEntry(app, parameters[MOBILE_ENTRY_PARAM]);
	if (entry) openMobileEntry(windowManager, app, entry, parameters);
	else openMobileApp(windowManager, app, parameters);
	return true;
}
