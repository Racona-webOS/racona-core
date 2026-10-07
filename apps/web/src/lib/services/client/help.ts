import { getAppByName } from '$lib/services/client/appRegistry';
import type { WindowManager } from '$lib/stores';

/**
 * Súgó alkalmazás megnyitása, opcionálisan egy adott oldalon.
 *
 * Azonos oldalra már nyitott súgó ablak esetén azt aktiválja új ablak helyett.
 *
 * @param windowManager - Az ablakkezelő
 * @param topic - A súgó oldal azonosítója (pl. 'applications/settings')
 */
export async function openHelp(windowManager: WindowManager, topic?: string): Promise<void> {
	const helpApp = await getAppByName('help');
	if (!helpApp) return;
	windowManager.openWindow(
		helpApp.appName,
		helpApp.title,
		helpApp,
		topic ? { section: topic } : {}
	);
}
