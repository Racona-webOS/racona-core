/**
 * App Shell Composable.
 *
 * Közös logika az alkalmazások menükezeléséhez, navigációjához és lokalizációjához.
 * A layout az app kezében marad — ez csak a reaktív state-et és helper-eket adja.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createAppShell } from '$lib/apps/appShell.svelte';
 *   import menuData from './menu.json';
 *
 *   const shell = createAppShell({
 *     appName: 'settings',
 *     menuData,
 *     extraProps: () => ({ data: { settings } })
 *   });
 * </script>
 *
 * <AppSideBarMenu items={shell.menuItems} onItemClick={shell.handleMenuItemClick} />
 * <AppContentArea component={shell.activeComponent} props={shell.componentProps} />
 * ```
 */

import type { MenuItem, RawMenuItem } from '$lib/types/menu';
import { getAppContext } from '$lib/services/client/appContext';
import { localizeMenuItems } from '$lib/apps/localization';
import { getTranslationStore } from '$lib/i18n/store.svelte';
import { getWindowManager } from '$lib/stores';
import { getCapabilitiesVersion } from '$lib/stores/pluginCapabilitiesStore.svelte';
import { getContext, untrack } from 'svelte';

/** Svelte context kulcs az AppShell elérhetőségéhez dinamikusan betöltött komponensekből. */
export const APP_SHELL_CONTEXT_KEY = Symbol('appShell');

/**
 * AppShell lekérése Svelte context-ből.
 *
 * Csak AppLayout-on belül renderelt komponensekből hívható.
 *
 * @returns {AppShellReturn} Az aktuális app shell példány.
 */
export function getAppShell(): AppShellReturn {
	return getContext<AppShellReturn>(APP_SHELL_CONTEXT_KEY);
}

export interface AppShellOptions {
	/** Az app neve (pl. 'settings', 'log') — a komponens betöltéshez és lokalizációhoz kell. */
	appName: string;

	/** A menu.json-ból importált nyers menüadatok. */
	menuData?: RawMenuItem[];

	/** Plugin mód - menü API-n keresztül töltődik. */
	isPlugin?: boolean;

	/** Opcionális extra props callback, amit minden komponensnek átadunk a menüpont props mellé. */
	extraProps?: () => Record<string, unknown>;
}

export interface AppShellReturn {
	/** Alkalmazás neve. */
	readonly appName: string;

	/** Lokalizált menüpontok — reaktívan frissül nyelv váltáskor. */
	readonly menuItems: MenuItem[];

	/** Az aktív menüpont href-je. */
	readonly activeMenuItem: string | null;

	/** Az aktív komponens neve (a components mappából). */
	readonly activeComponent: string | null;

	/** Az aktív komponensnek átadandó props. */
	readonly componentProps: Record<string, unknown>;

	/** A kinyitott szülő menüpontok label-jei. */
	readonly expandedParents: string[];

	/** Menüpont kattintás kezelő. */
	handleMenuItemClick: (item: MenuItem) => void;

	/** Programozott navigáció egy komponensre a tartalmi területen. */
	navigateTo: (component: string, props?: Record<string, unknown>, menuHref?: string) => void;
}

/**
 * Alapértelmezett menüpont keresése (az első, aminek van component-je).
 *
 * @param {MenuItem[]} items - A menüpontok tömbje.
 * @returns {MenuItem | null} Az első menüpont, aminek van component-je, vagy null.
 */
function findDefaultMenuItem(items: MenuItem[]): MenuItem | null {
	for (const item of items) {
		if (item.component) {
			return item;
		}
		if (item.children) {
			const found = findDefaultMenuItem(item.children);
			if (found) return found;
		}
	}
	return null;
}

/**
 * Menüpont keresése href alapján.
 *
 * @param {MenuItem[]} items - A menüpontok tömbje.
 * @param {string} href - A keresett href érték.
 * @param {string[]} parentPath - A szülő menüpontok útvonala.
 * @returns {{ item: MenuItem | null; parentPath: string[] }} Az eredmény objektum a talált menüponttal és szülő útvonallal.
 */
function findMenuItemByHref(
	items: MenuItem[],
	href: string,
	parentPath: string[] = []
): { item: MenuItem | null; parentPath: string[] } {
	for (const item of items) {
		if (item.href === href && item.component) {
			return { item, parentPath };
		}
		if (item.children) {
			const result = findMenuItemByHref(item.children, href, [...parentPath, item.label]);
			if (result.item) {
				return result;
			}
		}
	}
	return { item: null, parentPath: [] };
}

/**
 * Összegyűjti az összes szülő menüpont label-jét (amelyeknek van children-je).
 *
 * @param {MenuItem[]} items - A menüpontok tömbje.
 * @returns {string[]} A szülő menüpontok label-jeinek tömbje.
 */
function getAllParentLabels(items: MenuItem[]): string[] {
	const parents: string[] = [];
	for (const item of items) {
		if (item.children && item.children.length > 0) {
			parents.push(item.label);
			// Rekurzívan gyűjtjük az almenük szülőit is
			parents.push(...getAllParentLabels(item.children));
		}
	}
	return parents;
}

/**
 * App shell composable létrehozása.
 *
 * FONTOS: Svelte komponens inicializációs fázisában kell meghívni (top-level script),
 * mert getContext-et használ internally.
 *
 * @param {AppShellOptions} options - A konfigurációs opciók.
 * @returns {AppShellReturn} A reaktív state és helper függvények.
 */
export function createAppShell(options: AppShellOptions): AppShellReturn {
	const { appName, menuData, isPlugin = false, extraProps } = options;

	const appContext = getAppContext();
	const translationStore = getTranslationStore();
	const windowManager = getWindowManager();

	// Plugin menü betöltése API-n keresztül
	let rawMenuData = $state<RawMenuItem[]>(menuData || []);

	if (isPlugin && !menuData) {
		// Aszinkron menü betöltés plugin esetén
		fetch(`/api/plugins/${appName}/menu`)
			.then((res) => res.json())
			.then((data) => {
				if (data.success && data.menu) {
					rawMenuData = data.menu;
				}
			})
			.catch((err) => {
				console.error(`Failed to load plugin menu for ${appName}:`, err);
			});
	}

	// Lokalizált menü — reaktívan frissül nyelv váltáskor ÉS plugin-capability változáskor
	// Plugin esetén a namespace plugin:appName, különben csak appName
	const namespace = isPlugin ? `plugin:${appName}` : appName;
	const menuItems = $derived.by(() => {
		void translationStore.currentLocale;
		void getCapabilitiesVersion();
		return localizeMenuItems(namespace, rawMenuData);
	});

	// Állapotkezelés
	let activeMenuItem = $state<string | null>(null);
	let activeComponent = $state<string | null>(null);
	let componentProps = $state<Record<string, unknown>>({});
	let expandedParents = $state<string[]>([]);

	// Reaktívan frissítjük az expandedParents-t, amikor a menuItems megváltozik
	$effect(() => {
		const currentMenuItems = menuItems;
		// Ha már van expandedParents, de a menuItems megváltozott (pl. fordítások betöltődtek),
		// akkor frissítsük az expandedParents-t a lokalizált label-ekkel
		if (expandedParents.length > 0) {
			const allParents = getAllParentLabels(currentMenuItems);
			// Csak akkor frissítsük, ha tényleg változott
			if (JSON.stringify(allParents) !== JSON.stringify(expandedParents)) {
				untrack(() => {
					expandedParents = allParents;
				});
			}
		}
	});

	// Paraméterként kapott section
	const section = $derived(appContext?.parameters?.section as string | undefined);

	/**
	 * Menüpont kattintás kezelése.
	 *
	 * @param {MenuItem} item - A kattintott menüpont.
	 */
	function handleMenuItemClick(item: MenuItem, updateParams = false) {
		activeMenuItem = item.href;
		activeComponent = item.component || null;

		const extra = extraProps ? extraProps() : {};
		componentProps = { ...item.props, ...extra };

		// Csak valódi felhasználói kattintásnál írjuk vissza a section-t,
		// az $effect-ből való híváskor nem (elkerüli a végtelen ciklust)
		if (updateParams && appContext?.windowId && item.href) {
			const section = item.href.startsWith('#') ? item.href.slice(1) : item.href;
			windowManager.updateWindowParameters(appContext.windowId, { section });
		}
	}

	// Publikus wrapper felhasználói kattintáshoz — visszaírja a section-t a window paraméterekbe
	function handleMenuItemClickByUser(item: MenuItem) {
		handleMenuItemClick(item, true);
	}

	/**
	 * Programozott navigáció egy komponensre.
	 *
	 * @param {string} component - A komponens neve a components mappából.
	 * @param {Record<string, unknown>} [props] - Opcionális props a komponensnek.
	 * @param {string} [menuHref] - Opcionálisan megtartandó aktív menüpont href-je (pl. '#users').
	 */
	function navigateTo(component: string, props?: Record<string, unknown>, menuHref?: string) {
		activeComponent = component;
		const extra = extraProps ? extraProps() : {};
		componentProps = { ...props, ...extra };
		if (menuHref !== undefined) {
			activeMenuItem = menuHref;
		}
		// Jelezzük, hogy ez egy programozott navigáció volt, ne írja felül az $effect
		isProgrammaticNavigation = true;
	}

	// Flag to track programmatic navigation
	let isProgrammaticNavigation = false;

	// Track if initial setup is done
	let initialSetupDone = false;

	// Track previous menuItems length to detect real changes
	let previousMenuItemsLength = 0;

	// Alapértelmezett vagy paraméterezett menüpont beállítása
	$effect(() => {
		const currentMenuItems = menuItems;
		const currentSection = section;
		const currentActiveComponent = untrack(() => activeComponent);
		const currentInitialSetupDone = untrack(() => initialSetupDone);
		const currentIsProgrammaticNavigation = untrack(() => isProgrammaticNavigation);

		// Ha a menuItems még üres (plugin betöltés közben), várjunk
		if (currentMenuItems.length === 0) {
			return;
		}

		// Ha a menuItems hossza nem változott és már inicializáltunk, ne futtassuk újra
		const currentLength = currentMenuItems.length;
		if (currentLength === previousMenuItemsLength && currentInitialSetupDone && !currentSection) {
			return;
		}
		previousMenuItemsLength = currentLength;

		console.log(
			'[appShell] Effect triggered, menuItems count:',
			currentMenuItems.length,
			'activeComponent:',
			currentActiveComponent,
			'initialSetupDone:',
			currentInitialSetupDone
		);

		// Ha programozott navigáció volt, ne írjuk felül a componentProps-ot
		if (currentIsProgrammaticNavigation) {
			isProgrammaticNavigation = false;
			// De az expandedParents-t frissítsük
			if (currentSection) {
				const result = findMenuItemByHref(currentMenuItems, `#${currentSection}`);
				if (result.item) {
					expandedParents = result.parentPath;
				}
			} else {
				// Ha nincs section, akkor minden szülő menüpontot nyissunk ki
				const allParents = getAllParentLabels(currentMenuItems);
				expandedParents = allParents;
			}
			return;
		}

		// Ha már van aktív komponens és nincs section paraméter változás,
		// akkor ne írjuk felül a felhasználó választását
		// DE ha az expandedParents üres, akkor inicializáljuk
		if (currentActiveComponent && !currentSection && currentInitialSetupDone) {
			if (expandedParents.length === 0) {
				const allParents = getAllParentLabels(currentMenuItems);
				expandedParents = allParents;
			}
			return;
		}

		let targetItem: MenuItem | null = null;
		let parentPath: string[] = [];

		if (currentSection) {
			const result = findMenuItemByHref(currentMenuItems, `#${currentSection}`);
			targetItem = result.item;
			parentPath = result.parentPath;
		}

		if (!targetItem) {
			targetItem = findDefaultMenuItem(currentMenuItems);
		}

		if (targetItem) {
			// Ha van section paraméter, csak az adott útvonalat nyitjuk ki
			// Ha nincs, akkor minden szülő menüpontot kinyitunk
			const allParents = getAllParentLabels(currentMenuItems);
			expandedParents = currentSection ? parentPath : allParents;
			initialSetupDone = true;
			handleMenuItemClick(targetItem);
		}
	});

	return {
		get appName() {
			return appName;
		},
		get menuItems() {
			return menuItems;
		},
		get activeMenuItem() {
			return activeMenuItem;
		},
		get activeComponent() {
			return activeComponent;
		},
		get componentProps() {
			return componentProps;
		},
		get expandedParents() {
			return expandedParents;
		},
		handleMenuItemClick: handleMenuItemClickByUser,
		navigateTo
	};
}
