/**
 * WebOS SDK — Runtime SDK
 *
 * Az ElyOS core injektálja ezt az SDK-t a pluginokba.
 * Összefogja az összes service-t egyetlen objektumba.
 */

import type { WebOSComponents, UserInfo, WebOSSDKInterface } from '../types/index.js';
import { UIService } from './services/UIService.js';
import { RemoteService } from './services/RemoteService.js';
import { DataService } from './services/DataService.js';
import { I18nService } from './services/I18nService.js';
import { NotificationService } from './services/NotificationService.js';
import { ContextService } from './services/ContextService.js';
import { AssetService } from './services/AssetService.js';

export class WebOSSDK implements WebOSSDKInterface {
	/** UI service — toasts, dialógusok, téma */
	readonly ui: UIService;
	/** Remote service — szerver oldali függvények hívása */
	readonly remote: RemoteService;
	/** Data service — kulcs-érték tárolás és SQL lekérdezések */
	readonly data: DataService;
	/** I18n service — fordítások és locale váltás */
	readonly i18n: I18nService;
	/** Notification service — értesítések küldése */
	readonly notifications: NotificationService;
	/** Context service — plugin azonosító, felhasználó, jogosultságok, ablak vezérlők */
	readonly context: ContextService;
	/** Asset service — plugin asset URL-ek generálása */
	readonly assets: AssetService;
	/** ElyOS UI komponensek */
	readonly components: WebOSComponents;

	/**
	 * WebOSSDK példány létrehozása.
	 *
	 * @param pluginId - Plugin egyedi azonosítója
	 * @param user - Bejelentkezett felhasználó adatai
	 * @param params - Plugin indításkor átadott paraméterek
	 * @param permissions - Plugin jogosultságok listája
	 * @param windowElement - Opcionális Window referencia (iframe-hez)
	 * @param components - ElyOS UI komponensek
	 * @param devMode - Fejlesztői mód (kihagyja a fordítások automatikus betöltését)
	 */
	constructor(
		pluginId: string,
		user: UserInfo,
		params: Record<string, unknown>,
		permissions: string[],
		windowElement?: Window,
		components?: WebOSComponents,
		devMode = false
	) {
		this.ui = new UIService();
		this.remote = new RemoteService(pluginId);
		this.data = new DataService(pluginId);
		this.i18n = new I18nService(pluginId, devMode);
		this.notifications = new NotificationService(pluginId, permissions);
		this.context = new ContextService(pluginId, user, params, permissions, windowElement);
		this.assets = new AssetService(pluginId);
		this.components = components ?? {};
	}

	/**
	 * SDK inicializálása és globális objektumhoz csatolása.
	 *
	 * @param pluginId - Plugin egyedi azonosítója
	 * @param user - Bejelentkezett felhasználó adatai
	 * @param params - Plugin indításkor átadott paraméterek
	 * @param permissions - Plugin jogosultságok listája
	 * @param windowElement - Opcionális Window referencia (iframe-hez)
	 * @param components - ElyOS UI komponensek
	 * @param devMode - Fejlesztői mód
	 * @returns Az inicializált SDK példány
	 */
	static initialize(
		pluginId: string,
		user: UserInfo,
		params: Record<string, unknown> = {},
		permissions: string[] = [],
		windowElement?: Window,
		components?: WebOSComponents,
		devMode = false
	): WebOSSDK {
		const sdk = new WebOSSDK(
			pluginId,
			user,
			params,
			permissions,
			windowElement,
			components,
			devMode
		);

		if (typeof window !== 'undefined') {
			if (!window.__webOS_instances) {
				window.__webOS_instances = new Map();
			}
			window.__webOS_instances.set(pluginId, sdk);
			window.webOS = sdk;
		}

		return sdk;
	}

	/**
	 * SDK lekérése plugin ID alapján.
	 *
	 * @param pluginId - Plugin egyedi azonosítója
	 * @returns Az SDK példány, vagy `undefined` ha nem található
	 */
	static getInstance(pluginId: string): WebOSSDK | undefined {
		if (typeof window !== 'undefined' && window.__webOS_instances) {
			return window.__webOS_instances.get(pluginId) as WebOSSDK | undefined;
		}
		return undefined;
	}

	/**
	 * SDK cleanup — eltávolítja az SDK példányt a globális objektumból.
	 *
	 * @param pluginId - Ha meg van adva, csak ezt a plugin példányt távolítja el. Ha nincs, az összes SDK példányt törli.
	 */
	static cleanup(pluginId?: string): void {
		if (typeof window !== 'undefined') {
			if (pluginId && window.__webOS_instances) {
				window.__webOS_instances.delete(pluginId);
			} else {
				delete window.webOS;
				delete (window as Partial<Window & { __webOS_instances?: unknown }>).__webOS_instances;
			}
		}
	}
}
