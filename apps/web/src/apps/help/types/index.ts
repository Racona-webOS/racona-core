/** A súgó oldalak közötti navigáció állapota, amit a HelpLayout ad át az oldalaknak. */
export interface HelpNavigation {
	/** Az oldal betöltése után ide görgetünk (címsor azonosító). */
	anchor?: string;
}

/** Egy súgó oldal a tartalomjegyzékben. */
export interface HelpTocPage {
	/** Az oldal azonosítója a forráson belül, kiterjesztés nélkül (pl. 'index', 'projects/create'). */
	slug: string;
	title: string;
	description?: string;
	order: number;
}

/** Egy plugin súgója: a plugin csomag help/ mappájából olvasott tartalomjegyzék. */
export interface PluginHelpInfo {
	/** A plugin azonosítója. */
	pluginId: string;
	/** A plugin neve a felhasználó nyelvén. */
	title: string;
	/** Oldalak nyelvenként (csak a ténylegesen meglévő nyelvek). */
	pages: Record<string, HelpTocPage[]>;
}
