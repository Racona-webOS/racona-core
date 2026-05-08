/**
 * Menu Lokalizáció
 *
 * Segédfüggvények az alkalmazás menük lokalizálásához.
 * A fordítások az app namespace-ben találhatók.
 */

import type { MenuItem, RawMenuItem } from '$lib/types/menu.js';
import { getI18nService } from '$lib/i18n/service.js';
import { getTranslationStore } from '$lib/i18n/store.svelte.js';
import { hasPermission } from '$lib/stores/permissionStore.svelte.js';
import { isDevMode } from '$lib/stores/devModeStore.svelte.js';
import { hasPluginCapability } from '$lib/stores/pluginCapabilitiesStore.svelte.js';

/**
 * Ellenőrzi, hogy egy hideWhen feltétel teljesül-e.
 *
 * @param hideWhen - A feltétel típusa
 * @returns true, ha a menüpontot el kell rejteni
 */
function shouldHideMenuItem(hideWhen?: string): boolean {
	if (!hideWhen) return false;

	switch (hideWhen) {
		case 'singleLocale': {
			try {
				const store = getTranslationStore();
				return store.supportedLocales.length <= 1;
			} catch {
				return false;
			}
		}
		case 'notDevMode': {
			return !isDevMode();
		}
		default:
			return false;
	}
}

/**
 * Ellenőrzi, hogy a menüpontot el kell-e rejteni jogosultság hiánya miatt.
 *
 * @param requiredPermission - A szükséges jogosultság neve (pl. "log.error.view")
 * @returns true, ha a menüpontot el kell rejteni (nincs meg a jogosultsága)
 */
function shouldHideByPermission(requiredPermission?: string): boolean {
	if (!requiredPermission) return false;
	return !hasPermission(requiredPermission);
}

/**
 * Ellenőrzi, hogy a menüpontot el kell-e rejteni plugin-capability hiánya miatt.
 *
 * Csak pluginoknál (namespace: "plugin:<pluginId>") van értelme. Beépített
 * appoknál a mező ignorálódik (nincs pluginId, tehát nincs capability halmaz).
 *
 * @param namespace - Az app namespace-e (pl. "plugin:racona-work")
 * @param requiredCapability - A szükséges plugin-capability (pl. "project.create")
 * @returns true, ha a menüpontot el kell rejteni
 */
function shouldHideByCapability(namespace: string, requiredCapability?: string): boolean {
	if (!requiredCapability) return false;
	if (!namespace.startsWith('plugin:')) return false; // beépített appnál ignoráljuk
	const pluginId = namespace.slice('plugin:'.length);
	return !hasPluginCapability(pluginId, requiredCapability);
}

/**
 * Lokalizált menüpont címke lekérése.
 *
 * Ha a menüpontnak van labelKey-je, a fordítást az i18n rendszerből kéri le.
 * Ha nincs labelKey vagy a fordítás nem található, a labelKey-t vagy üres stringet ad vissza.
 *
 * @param namespace - Az app namespace-e (pl. "settings")
 * @param labelKey - A fordítási kulcs (pl. "menu.profile")
 * @returns Lokalizált címke
 */
export function getLocalizedMenuLabel(namespace: string, labelKey: string): string {
	try {
		const i18nService = getI18nService();

		// Plugin namespace esetén (plugin:hello-world) a teljes kulcs: plugin:hello-world.menu.overview
		// Normál app esetén (settings) a teljes kulcs: settings.menu.profile
		const fullKey = `${namespace}.${labelKey}`;

		if (i18nService.hasTranslation(fullKey)) {
			return i18nService.t(fullKey);
		}

		// Fallback: visszaadjuk a labelKey-t (utolsó rész pont után)
		return labelKey.split('.').pop() || labelKey;
	} catch {
		// Ha az i18n service nem elérhető, fallback a labelKey-re
		return labelKey.split('.').pop() || labelKey;
	}
}

/**
 * Egyetlen menüpont lokalizálása.
 *
 * A RawMenuItem-ből MenuItem-et készít, ahol a label a lokalizált szöveg.
 *
 * @param namespace - Az app namespace-e
 * @param item - A nyers menüpont (menu.json-ból)
 * @returns Lokalizált menüpont
 */
export function localizeMenuItem(namespace: string, item: RawMenuItem): MenuItem {
	const label = item.labelKey ? getLocalizedMenuLabel(namespace, item.labelKey) : item.label || '';

	const localizedItem: MenuItem = {
		label,
		labelKey: item.labelKey,
		href: item.href,
		icon: item.icon,
		component: item.component,
		props: item.props,
		separator: item.separator,
		hidden:
			shouldHideMenuItem(item.hideWhen) ||
			shouldHideByPermission(item.requiredPermission) ||
			shouldHideByCapability(namespace, item.requiredCapability)
	};

	// Rekurzívan lokalizáljuk a gyerek elemeket
	if (item.children && item.children.length > 0) {
		localizedItem.children = item.children.map((child) => localizeMenuItem(namespace, child));

		// Szülő menüpont akkor is rejtett, ha MINDEN gyereke rejtett
		// (pl. egy "Beállítások" fölé ne rakjunk üres csoportot).
		if (!localizedItem.hidden && localizedItem.children.every((c) => c.hidden)) {
			localizedItem.hidden = true;
		}
	}

	return localizedItem;
}

/**
 * Menüpontok tömbjének lokalizálása.
 *
 * A menu.json-ból betöltött RawMenuItem tömböt MenuItem tömbbé alakítja,
 * ahol minden label lokalizálva van az i18n rendszerből.
 *
 * @param namespace - Az app namespace-e (pl. "settings")
 * @param items - A nyers menüpontok tömbje
 * @returns Lokalizált menüpontok tömbje
 *
 * @example
 * ```typescript
 * import menuData from './menu.json';
 * import { localizeMenuItems } from '$lib/apps/localization';
 *
 * // A komponensben:
 * const localizedMenu = $derived(localizeMenuItems('settings', menuData));
 * ```
 */
export function localizeMenuItems(namespace: string, items: RawMenuItem[]): MenuItem[] {
	return items.map((item) => localizeMenuItem(namespace, item));
}
