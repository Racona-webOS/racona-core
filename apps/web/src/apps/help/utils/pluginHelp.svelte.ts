/**
 * Plugin súgók tartalomjegyzéke (kliens oldal)
 *
 * A szerver a felhasználó által elérhető, help/ mappát hozó pluginek listáját adja.
 * Egyszer töltődik be; plugin telepítés, frissítés, eltávolítás és nyelvváltás
 * után újra kell tölteni (refreshPluginHelp).
 */

import { getPluginHelpIndex } from '../help.remote';
import type { PluginHelpInfo } from '../types';

const state = $state<{ plugins: PluginHelpInfo[]; loaded: boolean; version: number }>({
	plugins: [],
	loaded: false,
	version: 0
});

let pending: Promise<void> | null = null;

/** Az elérhető pluginek súgója (reaktív). */
export function getPluginHelpList(): PluginHelpInfo[] {
	return state.plugins;
}

/** Növekszik, ha az újratöltés változást hozott (reaktív); a Súgó ehhez köti a menü újraépítését. */
export function getPluginHelpVersion(): number {
	return state.version;
}

/**
 * Egy plugin súgója, ha van.
 *
 * @param pluginId - A plugin azonosítója
 */
export function findPluginHelp(pluginId: string): PluginHelpInfo | undefined {
	return state.plugins.find((p) => p.pluginId === pluginId);
}

/**
 * A tartalomjegyzék betöltése, ha még nem történt meg.
 *
 * @returns A betöltés befejeződése (hiba esetén is teljesül)
 */
export function ensurePluginHelp(): Promise<void> {
	if (state.loaded) return Promise.resolve();
	return pending ?? refreshPluginHelp();
}

/**
 * A tartalomjegyzék újratöltése a szerverről.
 *
 * @returns A betöltés befejeződése (hiba esetén is teljesül)
 */
export function refreshPluginHelp(): Promise<void> {
	pending = loadPluginHelpIndex().finally(() => {
		pending = null;
	});
	return pending;
}

async function loadPluginHelpIndex(): Promise<void> {
	try {
		const plugins = await getPluginHelpIndex();
		// Csak tényleges változásnál épül újra a nyitott súgó ablakok menüje
		if (JSON.stringify(plugins) !== JSON.stringify(state.plugins)) {
			state.plugins = plugins;
			state.version++;
		}
		state.loaded = true;
	} catch (err) {
		console.warn('[Help] Plugin súgók betöltése sikertelen:', err);
	}
}
