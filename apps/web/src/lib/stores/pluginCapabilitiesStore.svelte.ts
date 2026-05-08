/**
 * Plugin Capabilities Store
 *
 * A pluginok szervezet-szintű "képességei" (fine-grained, plugin-specifikus).
 * Ezeket a plugin saját adatbázisából vezeti le (pl. racona-work: wp_roles +
 * wp_role_capabilities), és a plugin kliens oldala közzéteszi a
 * 'plugin-capabilities-changed' CustomEvent-en keresztül (lásd
 * hookClientPluginCapabilities a core oldalán).
 *
 * A core oldalon a menü-lokalizáló (localization.ts) a `requiredCapability`
 * mezővel kezdeményezett szűréshez olvassa ezt.
 *
 * A `getCapabilitiesVersion()` egy monoton növekvő verziószámot ad vissza,
 * ami minden módosításnál nő. A menü reaktív $derived számítása ezt olvassa,
 * így szervezet-váltás / szerep-változás után a menü automatikusan újraszűr.
 */

/** Plugin ID → képesség halmaz. */
const caps = new Map<string, Set<string>>();

/** Verzió számláló ($state, hogy a $derived lekövesse). */
let versionState = $state(0);

/** Lekéri az aktuális verziószámot (reaktív tracker). */
export function getCapabilitiesVersion(): number {
	return versionState;
}

/**
 * Frissíti egy plugin képesség halmazát. Ha az értékek nem változtak,
 * nem növeli a verziót (elkerüljük a felesleges újraszámolást).
 */
export function setPluginCapabilities(pluginId: string, capabilities: Iterable<string>): void {
	if (!pluginId) return;
	const next = new Set(capabilities);
	const prev = caps.get(pluginId);

	if (prev && prev.size === next.size) {
		let changed = false;
		for (const c of next) {
			if (!prev.has(c)) {
				changed = true;
				break;
			}
		}
		if (!changed) return;
	}

	caps.set(pluginId, next);
	versionState++;
}

/**
 * Ellenőrzi, hogy egy plugin-nak megvan-e az adott képessége a jelenleg
 * aktív szervezet kontextusában.
 */
export function hasPluginCapability(pluginId: string, capability: string): boolean {
	const set = caps.get(pluginId);
	return !!set && set.has(capability);
}

/**
 * Minden tárolt plugin-képesség törlése. Dev módban / kijelentkezéskor hasznos.
 */
export function clearPluginCapabilities(pluginId?: string): void {
	if (pluginId) {
		if (caps.delete(pluginId)) versionState++;
	} else {
		if (caps.size > 0) {
			caps.clear();
			versionState++;
		}
	}
}
