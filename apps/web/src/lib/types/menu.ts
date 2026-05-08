/**
 * MenuItem interface for app navigation menus.
 * Used across all apps for consistent menu structure.
 */
export interface MenuItem {
	/** Display label for the menu item (can be static text or resolved from labelKey). */
	label: string;

	/**
	 * Translation key for the menu item label.
	 * If provided, the label will be resolved from the i18n system using this key.
	 * The key is relative to the app's namespace (e.g., "menu.profile" in settings namespace).
	 */
	labelKey?: string;

	/** Unique identifier/href for the menu item (e.g., "#appearance"). */
	href: string;

	/** Optional icon name (Lucide/Phosphor). */
	icon?: string;

	/** Optional component name to load (from app's components folder). */
	component?: string;

	/** Optional props to pass to the loaded component. */
	props?: Record<string, unknown>;

	/** Optional child menu items for nested menus. */
	children?: MenuItem[];

	/** If true, renders as a visual separator instead of a clickable item. */
	separator?: boolean;

	/** If true, the menu item will be hidden from the menu. */
	hidden?: boolean;
}

/**
 * Raw menu item as stored in menu.json files.
 * Uses labelKey instead of label for i18n support.
 */
export interface RawMenuItem {
	/** Translation key for the menu item label (e.g., "menu.profile"). */
	labelKey?: string;

	/** Static label (fallback if labelKey is not provided). */
	label?: string;

	/** Unique identifier/href for the menu item. */
	href: string;

	/** Optional icon name. */
	icon?: string;

	/** Optional component name. */
	component?: string;

	/** Optional props to pass to the component. */
	props?: Record<string, unknown>;

	/** Optional child menu items. */
	children?: RawMenuItem[];

	/** If true, renders as a separator. */
	separator?: boolean;

	/**
	 * Condition for hiding the menu item.
	 * Supported values:
	 * - 'singleLocale': Hide when only one locale is supported
	 */
	hideWhen?: 'singleLocale';

	/**
	 * Jogosultság, ami szükséges a menüpont megjelenítéséhez.
	 * Ha a felhasználónak nincs meg ez a jogosultsága, a menüpont rejtett lesz.
	 * Formátum: "resource.feature.action" (pl. "log.error.view")
	 */
	requiredPermission?: string;

	/**
	 * Plugin-specifikus képesség, ami szükséges a menüpont megjelenítéséhez.
	 * Csak pluginok használják — a plugin a saját adatbázisából vezeti le a
	 * szervezet-szintű képesség halmazt, és a 'plugin-capabilities-changed'
	 * eseménnyel publikálja a core felé.
	 *
	 * Ellentétben a `requiredPermission`-nel (ami a globális core
	 * auth.permissions alapján szűr), ez a mező a plugin saját
	 * capability-névtérén (pl. "project.create") működik.
	 *
	 * Formátum: "group.action" (pl. "project.create", "roles.manage")
	 */
	requiredCapability?: string;
}

/**
 * Event payload for menu item click events.
 */
export interface MenuItemClickEvent {
	item: MenuItem;
	event: MouseEvent;
}
