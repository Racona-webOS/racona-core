export interface WindowSize {
	width: number;
	height: number;
	/** Whether the window should open maximized. */
	maximized?: boolean;
}

export interface AppMetadata {
	/** Application name. */
	appName: string;
	/** Application title. */
	title: string;
	/** Default window size. */
	defaultSize: WindowSize;
	/** Icon identifier. */
	icon?: string;
	/** Icon display style: 'icon' (centered with padding) or 'cover' (fills entire area). */
	iconStyle?: 'icon' | 'cover';
	/** Application category. */
	category?: string;
	/** Whether multiple instances are allowed. */
	allowMultiple?: boolean;
	/** Minimum window size. */
	minSize?: WindowSize;
	/** Maximum window size. */
	maxSize?: WindowSize;
	/** Whether window is resizable. */
	resizable?: boolean;
	/** Whether window can be maximized. */
	maximizable?: boolean;
	/** Whether window can be minimized. */
	minimizable?: boolean;
	/** Help ID for the application. */
	helpId?: number;
	parameters?: AppParameters;
	/** Mobil támogatás. Ha nincs megadva, az app mobilon nem jelenik meg. */
	mobile?: AppMobileSupport;
}

/** Az app mobil támogatása */
export interface AppMobileSupport {
	/**
	 * Mobil bejegyzések (gyors műveletek a kezdőképernyőn), mindegyik egy önálló
	 * képernyő. Ha üres, a teljes app nyílik meg mobilon.
	 */
	entries: AppMobileEntry[];
}

/** Egy mobil bejegyzés: az app egy komponense, amely önállóan, teljes képernyőn nyílik meg */
export interface AppMobileEntry {
	/** Azonosító az appon belül (közvetlen linkben is ez szerepel) */
	id: string;
	/** Felirat (már a felhasználó nyelvén) */
	label: string;
	/** Ikon (lucide név, mint az app ikonjánál) */
	icon?: string;
	/** A megnyitandó komponens neve */
	component: string;
}

/** Parameters that can be passed to an app when opening. */
export interface AppParameters {
	[key: string]: unknown;
}
