import { getContext, setContext } from 'svelte';
import { type AppMetadata, type AppParameters } from '$lib/types/window';
import type { Component } from 'svelte';
import type { WindowSize } from '$lib/types/window';
import {
	getStoredWindowState,
	saveWindowState,
	type StoredWindowState
} from '$lib/services/client/windowStateStorage';
import { getTranslationStore } from '$lib/i18n/store.svelte';

// Vite glob import az alkalmazás komponensekhez
const appModules = import.meta.glob('/src/apps/*/index.svelte') as Record<
	string,
	() => Promise<{ default: Component }>
>;

// Restore méret konstansok
export const RESTORE_SIZE_THRESHOLD = 0.99; // Ha az előző méret 95%-on belül van a maximálishoz
export const RESTORE_SIZE_RATIO = 0.8; // Akkor 70%-os méretre álljon vissza

export type WindowState = {
	id: string;
	icon: string | null | undefined;
	appName: string;
	title: string;
	isActive: boolean;
	isMinimized: boolean;
	isMaximized: boolean;
	zIndex: number;
	position: { x: number; y: number };
	size: WindowSize;
	minSize: WindowSize;
	maxSize: WindowSize;
	component?: Component; // A betöltött komponens példány
	isLoading?: boolean;
	parameters?: AppParameters; // Az appnak átadott paraméterek
	instanceId?: string; // Példány azonosító több példány esetén
	maximizable?: boolean;
	resizable?: boolean;
	helpId?: number;
	allowMultiple?: boolean;
	defaultSize?: WindowSize | { maximized?: boolean };
	screenshot?: string; // Screenshot data URL (base64)
};

export class WindowManager {
	windows = $state<WindowState[]>([]);
	private nextId = 1;
	private baseZIndex = 100;

	openWindow(
		appName: string,
		title: string,
		metadata: Partial<AppMetadata> = {},
		parameters: AppParameters = {}
	) {
		// Ellenőrizzük, hogy az app támogatja-e a több példányt
		if (metadata.allowMultiple) {
			// Több példány esetén paraméterek alapján keresünk egyező ablakot
			const existingWindow = this.windows.find(
				(w) => w.appName === appName && this.parametersMatch(w.parameters || {}, parameters)
			);

			if (existingWindow) {
				// Ha már nyitva van ugyanazokkal a paraméterekkel, aktiváljuk
				existingWindow.isMinimized = false;
				this.activateWindow(existingWindow.id);
				return existingWindow.id;
			}
		} else {
			// Egy példány esetén csak az appName alapján keresünk
			const existingWindow = this.windows.find((w) => w.appName === appName);

			if (existingWindow) {
				// Ha már nyitva van, akkor aktiváljuk és visszaállítjuk a minimalizálásból
				existingWindow.isMinimized = false;
				// Frissítjük a paramétereket, ha vannak újak
				if (Object.keys(parameters).length > 0) {
					existingWindow.parameters = { ...existingWindow.parameters, ...parameters };
					// Trigger reactivity
					this.windows = [...this.windows];
				}
				this.activateWindow(existingWindow.id);
				return existingWindow.id;
			}
		}

		const id = `window-${this.nextId++}`;

		// Több példány esetén instanceId generálása, de cím marad eredeti
		let instanceId: string | undefined;
		if (metadata.allowMultiple && Object.keys(parameters).length > 0) {
			instanceId = this.generateInstanceId(parameters);
		}

		// Tárolt állapot betöltése localStorage-ból
		const storedState = getStoredWindowState(appName);

		const defaultSize = metadata.defaultSize || { width: 600, height: 400 };

		// Workspace méretek lekérése a validációhoz
		const workspace = typeof document !== 'undefined' ? document.getElementById('workspace') : null;
		const workspaceRect = workspace?.getBoundingClientRect();

		let initialSize: { width: number; height: number };
		let initialPosition: { x: number; y: number };
		let initialMaximized: boolean;

		if (workspaceRect) {
			// 1. Próbáljuk a tárolt állapotot (pozíció + méret)
			if (
				storedState &&
				this.isWindowPositionValid(storedState.position, storedState.size, workspaceRect)
			) {
				initialSize = storedState.size;
				initialPosition = storedState.position;
				initialMaximized = storedState.isMaximized;
			}
			// 2. Ha nem fér el, próbáljuk a tárolt méretet bal felső sarokból (0,0)
			else if (
				storedState &&
				this.isWindowPositionValid({ x: 0, y: 0 }, storedState.size, workspaceRect)
			) {
				initialSize = storedState.size;
				initialPosition = { x: 0, y: 0 };
				initialMaximized = false; // Nem maximalizált, mert új pozícióba került
			}
			// 3. Ha még mindig nem fér el, próbáljuk a default méretet + pozíciót
			else if (
				this.isWindowPositionValid(
					this.getNextPosition(),
					{ width: defaultSize.width, height: defaultSize.height },
					workspaceRect
				)
			) {
				initialSize = { width: defaultSize.width, height: defaultSize.height };
				initialPosition = this.getNextPosition();
				initialMaximized = defaultSize.maximized ?? false;
			}
			// 4. Ha a default sem fér el, maximalizáljuk
			else {
				initialSize = { width: defaultSize.width, height: defaultSize.height };
				initialPosition = { x: 0, y: 0 };
				initialMaximized = true;
			}
		} else {
			// Ha nincs workspace (SSR), használjuk a tárolt vagy default értékeket
			initialSize = storedState?.size || {
				width: defaultSize.width,
				height: defaultSize.height
			};
			initialPosition = storedState?.position || this.getNextPosition();
			initialMaximized = storedState?.isMaximized ?? defaultSize.maximized ?? false;
		}

		const newWindow: WindowState = {
			id,
			appName,
			icon: metadata.icon,
			title, // Eredeti cím marad
			isActive: true,
			isMinimized: false,
			isMaximized: initialMaximized,
			zIndex: this.getNextZIndex(),
			position: initialPosition,
			size: initialSize,
			minSize: metadata.minSize || { width: 300, height: 200 },
			maxSize: metadata.maxSize || { width: 5000, height: 5000 },
			component: undefined,
			isLoading: true,
			parameters,
			instanceId,
			maximizable: metadata.maximizable ?? true,
			resizable: metadata.resizable ?? true,
			helpId: metadata.helpId,
			allowMultiple: metadata.allowMultiple ?? false,
			defaultSize: metadata.defaultSize
		};

		// Deaktiváljuk az összes többi ablakot
		this.windows.forEach((w) => (w.isActive = false));

		this.windows.push(newWindow);

		// Aszinkron komponens betöltés
		this.loadComponent(id, appName);

		return id;
	}

	private async loadComponent(id: string, componentName: string) {
		try {
			// Dev plugin kezelése (dev: prefix)
			const window_obj = this.windows.find((w) => w.id === id);
			if (componentName.startsWith('dev:') && window_obj?.parameters?.devUrl) {
				await this.loadDevPluginComponent(id, componentName, window_obj);
				return;
			}

			// Ellenőrizzük, hogy plugin-e
			const isPlugin = await this.isPluginApp(componentName);

			if (isPlugin) {
				// Plugin betöltése API-n keresztül
				await this.loadPluginComponent(id, componentName);
			} else {
				// Normál app betöltése
				const moduleKey = `/src/apps/${componentName}/index.svelte`;
				const moduleLoader = appModules[moduleKey];

				if (!moduleLoader) {
					throw new Error(`Alkalmazás modul nem található: ${componentName}`);
				}

				const module = await moduleLoader();
				const window = this.windows.find((w) => w.id === id);
				if (window) {
					window.component = module.default;
					window.isLoading = false;
					// Trigger reactivity
					this.windows = [...this.windows];
				}
			}
		} catch (error) {
			console.error(`Nem sikerült betölteni: ${componentName}`, error);
			const window = this.windows.find((w) => w.id === id);
			if (window) {
				window.isLoading = false;
				// Trigger reactivity
				this.windows = [...this.windows];
			}
		}
	}

	/**
	 * Ellenőrzi, hogy az app plugin-e
	 */
	private async isPluginApp(appName: string): Promise<boolean> {
		try {
			const response = await fetch(`/api/apps/${appName}`);
			if (!response.ok) return false;

			const app = await response.json();
			return app.appType === 'plugin';
		} catch {
			return false;
		}
	}

	/**
	 * Plugin komponens betöltése
	 */
	private async loadPluginComponent(id: string, pluginId: string) {
		try {
			const window_obj = this.windows.find((w) => w.id === id);
			if (!window_obj) {
				throw new Error('Window not found');
			}

			// Plugin metaadatok lekérése az apps API-n keresztül
			const metaResponse = await fetch(`/api/apps/${pluginId}`);
			if (!metaResponse.ok) {
				throw new Error(`Failed to fetch plugin metadata: ${metaResponse.statusText}`);
			}
			const appData = await metaResponse.json();

			// Ellenőrizzük, hogy van-e menu.json a pluginnak
			const menuResponse = await fetch(`/api/plugins/${pluginId}/menu`);
			const menuData = menuResponse.ok ? await menuResponse.json() : null;
			const hasMenu = menuData?.success && menuData?.menu && menuData.menu.length > 0;

			if (hasMenu) {
				// Ha van menü, használjuk az AppLayout-ot
				await this.loadPluginWithLayout(
					id,
					pluginId,
					window_obj,
					appData,
					menuData.menu,
					menuData.layout ?? {}
				);
			} else {
				// Ha nincs menü, használjuk a Web Component módot
				await this.loadPluginAsWebComponent(id, pluginId, window_obj, appData);
			}
		} catch (error) {
			console.error(`Failed to load plugin ${pluginId}:`, error);
			throw error;
		}
	}

	/**
	 * Plugin betöltése AppLayout-tal (sidebar menüvel)
	 */
	private async loadPluginWithLayout(
		id: string,
		pluginId: string,
		window_obj: WindowState,
		appData: any,
		menuData: any[],
		layout: Record<string, string> = {}
	) {
		try {
			// WebOS SDK inicializálása
			const { WebOSSDK } = await import('@elyos-dev/sdk');
			const PluginLayoutWrapper = await import('$lib/components/shared/PluginLayoutWrapper.svelte');

			// DataTable komponensek importálása
			const {
				DataTable,
				DataTableColumnHeader,
				DataTableFacetedFilter,
				renderComponent,
				renderSnippet,
				createActionsColumn
			} = await import('$lib/components/ui/data-table');
			const { Input } = await import('$lib/components/ui/input');
			const { Button } = await import('$lib/components/ui/button');
			const ContentSection = await import('$lib/components/shared/ContentSection.svelte');

			const user = {
				id: 'current-user',
				name: 'Current User',
				email: 'user@example.com',
				roles: [],
				groups: []
			};

			const sdk = WebOSSDK.initialize(
				pluginId,
				user,
				window_obj.parameters || {},
				appData.pluginPermissions || [],
				undefined,
				{
					AppLayout: null,
					createAppShell: null,
					DataTable,
					DataTableColumnHeader,
					DataTableFacetedFilter,
					renderComponent,
					renderSnippet,
					createActionsColumn,
					Input,
					Button,
					ContentSection: ContentSection.default
				}
			);

			// Toast handler regisztrálása az SDK UIService-hez
			const { toast: showToast } = await import('svelte-sonner');
			sdk.ui._setToastHandler((message, type, duration) => {
				const toastFn =
					type === 'success'
						? showToast.success
						: type === 'error'
							? showToast.error
							: type === 'warning'
								? showToast.warning
								: showToast.info;
				toastFn(message, { duration });
			});

			// Dialog handler regisztrálása
			const dialogHandler = getGlobalDialogHandler();
			if (dialogHandler) sdk.ui._setDialogHandler(dialogHandler);

			console.log('[Plugin Loader] WebOS SDK initialized for plugin with layout:', pluginId);

			// Store the menu data and wrapper component
			(window_obj as any).pluginMenuData = menuData;
			(window_obj as any).pluginId = pluginId;
			(window_obj as any).pluginLayout = layout;
			(window_obj as any).isPluginWithLayout = true;
			window_obj.component = PluginLayoutWrapper.default as any;
			window_obj.isLoading = false;
			this.windows = [...this.windows];

			console.log('[Plugin Loader] Plugin with layout loaded successfully');
		} catch (error) {
			console.error(`Failed to load plugin with layout ${pluginId}:`, error);
			throw error;
		}
	}
	private async loadDevPluginComponent(id: string, componentName: string, window_obj: WindowState) {
		try {
			const devUrl = (window_obj.parameters?.devUrl as string).replace(/\/$/, '');
			const pluginId = componentName.replace('dev:', '');

			// Manifest lekérése a dev szerverről
			const manifestResponse = await fetch(`${devUrl}/manifest.json`, {
				mode: 'cors',
				credentials: 'omit'
			});
			if (!manifestResponse.ok) {
				throw new Error(`Manifest nem található: ${devUrl}/manifest.json`);
			}
			const manifest = await manifestResponse.json();

			// WebOS SDK inicializálása a dev plugin számára
			const { WebOSSDK } = await import('@elyos-dev/sdk');
			const { AppLayout } = await import('$lib/components/shared');
			const { createAppShell } = await import('$lib/apps/appShell.svelte');
			const {
				DataTable,
				DataTableColumnHeader,
				DataTableFacetedFilter,
				renderComponent,
				renderSnippet,
				createActionsColumn
			} = await import('$lib/components/ui/data-table');
			const { Input } = await import('$lib/components/ui/input');
			const { Button } = await import('$lib/components/ui/button');
			const ContentSection = await import('$lib/components/shared/ContentSection.svelte');

			const user = {
				id: 'current-user',
				name: 'Current User',
				email: 'user@example.com',
				roles: [],
				groups: []
			};

			const sdk = WebOSSDK.initialize(
				pluginId,
				user,
				window_obj.parameters || {},
				manifest.permissions || [],
				undefined,
				{
					AppLayout,
					createAppShell,
					DataTable,
					DataTableColumnHeader,
					DataTableFacetedFilter,
					renderComponent,
					renderSnippet,
					createActionsColumn,
					Input,
					Button,
					ContentSection: ContentSection.default
				},
				true // devMode — ne indítson API hívást a fordításokhoz
			);

			// Dev módban a DataService localStorage-t használ (nincs DB bejegyzés)
			const devDataPrefix = `devplugin:${pluginId}:`;
			const devDataService = {
				async set(key: string, value: unknown): Promise<void> {
					localStorage.setItem(`${devDataPrefix}${key}`, JSON.stringify(value));
				},
				async get<T = unknown>(key: string): Promise<T | null> {
					try {
						const raw = localStorage.getItem(`${devDataPrefix}${key}`);
						return raw ? (JSON.parse(raw) as T) : null;
					} catch {
						return null;
					}
				},
				async delete(key: string): Promise<void> {
					localStorage.removeItem(`${devDataPrefix}${key}`);
				},
				async query<T = unknown>(..._args: unknown[]): Promise<T[]> {
					console.warn('[DevPlugin] SQL query nem támogatott dev módban');
					return [] as T[];
				},
				async transaction<T>(
					callback: (tx: {
						query: (...args: unknown[]) => Promise<unknown[]>;
						commit: () => Promise<void>;
						rollback: () => Promise<void>;
					}) => Promise<T>
				): Promise<T> {
					return callback({
						query: async () => [],
						commit: async () => {},
						rollback: async () => {}
					});
				}
			};
			Object.defineProperty(sdk, 'data', {
				value: devDataService,
				writable: false,
				configurable: true
			});

			// Toast handler regisztrálása
			const { toast: showToast } = await import('svelte-sonner');
			sdk.ui._setToastHandler((message, type, duration) => {
				const toastFn =
					type === 'success'
						? showToast.success
						: type === 'error'
							? showToast.error
							: type === 'warning'
								? showToast.warning
								: showToast.info;
				toastFn(message, { duration });
			});

			// Dialog handler regisztrálása
			const dialogHandler = getGlobalDialogHandler();
			if (dialogHandler) sdk.ui._setDialogHandler(dialogHandler);

			// Notification handler regisztrálása (dev módban nincs DB plugin bejegyzés)
			const { toast: devNotifToast } = await import('svelte-sonner');
			(
				sdk.notifications as unknown as {
					setDevNotificationHandler: (
						fn: (opts: { title: string; message: string; type?: string }) => Promise<void>
					) => void;
				}
			).setDevNotificationHandler(async (opts) => {
				devNotifToast.info(`${opts.title}: ${opts.message}`);
			});

			console.log('[DevPlugin] WebOS SDK inicializálva:', pluginId);

			// Ellenőrizzük, hogy van-e menu.json a dev szerveren
			let devMenuData: any[] | null = null;
			try {
				const menuResponse = await fetch(`${devUrl}/menu.json`, {
					mode: 'cors',
					credentials: 'omit'
				});
				if (menuResponse.ok) {
					const menuJson = await menuResponse.json();
					if (Array.isArray(menuJson) && menuJson.length > 0) {
						devMenuData = menuJson;
						console.log('[DevPlugin] menu.json found, loading with layout mode');
					}
				}
			} catch {
				console.log('[DevPlugin] No menu.json found, loading as Web Component');
			}

			// Fordítások betöltése a dev szerverről és injektálása az SDK-ba
			const locale = localStorage.getItem('locale') ?? navigator.language.split('-')[0] ?? 'en';
			try {
				const localeResponse = await fetch(`${devUrl}/locales/${locale}.json`, {
					mode: 'cors',
					credentials: 'omit'
				});
				type I18nWithLoader = { loadTranslationsFromObject: (t: Record<string, string>) => void };
				if (localeResponse.ok) {
					const translations = (await localeResponse.json()) as Record<string, string>;
					(sdk.i18n as unknown as I18nWithLoader).loadTranslationsFromObject(translations);

					// Core TranslationStore-ba is betöltjük a fordításokat,
					// hogy a sidebar menü lokalizáció is működjön dev módban
					try {
						const translationStore = getTranslationStore();
						translationStore.addTranslations(`plugin:${pluginId}`, translations);
						console.log(`[DevPlugin] Fordítások betöltve core store-ba: plugin:${pluginId}`);
					} catch {
						console.warn('[DevPlugin] Core TranslationStore nem elérhető');
					}

					console.log(
						`[DevPlugin] Fordítások betöltve: ${locale} (${Object.keys(translations).length} kulcs)`
					);
				} else {
					// Fallback: en.json
					const fallbackResponse = await fetch(`${devUrl}/locales/en.json`, {
						mode: 'cors',
						credentials: 'omit'
					});
					if (fallbackResponse.ok) {
						const translations = (await fallbackResponse.json()) as Record<string, string>;
						(sdk.i18n as unknown as I18nWithLoader).loadTranslationsFromObject(translations);

						// Core TranslationStore-ba is betöltjük
						try {
							const translationStore = getTranslationStore();
							translationStore.addTranslations(`plugin:${pluginId}`, translations);
						} catch {
							// nem kritikus
						}
					}
				}
			} catch {
				console.warn(`[DevPlugin] Fordítások nem tölthetők be: ${devUrl}/locales/${locale}.json`);
			}

			// Ha van menu.json, layout módban töltjük be (PluginLayoutWrapper)
			if (devMenuData) {
				const PluginLayoutWrapper =
					await import('$lib/components/shared/PluginLayoutWrapper.svelte');

				// IIFE bundle is kell — a komponensek factory function-jeit regisztrálja
				const entry = manifest.entry || 'dist/index.iife.js';
				const bundleResponse = await fetch(`${devUrl}/${entry}`, {
					mode: 'cors',
					credentials: 'omit'
				});
				if (bundleResponse.ok) {
					const code = await bundleResponse.text();
					const factoryName = `${pluginId.replace(/-/g, '_')}_Plugin`;
					if (!(window as any)[factoryName]) {
						const script = document.createElement('script');
						script.textContent = code;
						document.head.appendChild(script);
					}
					// Factory meghívása, hogy a custom element regisztrálódjon
					const pluginFactory = (window as any)[factoryName];
					if (pluginFactory) pluginFactory();
				}

				// Komponens bundle-ök betöltése a dev szerverről
				for (const menuItem of devMenuData) {
					const compName = menuItem.component;
					if (!compName) continue;
					const compFactoryName = `${pluginId.replace(/-/g, '_')}_Component_${compName}`;
					if ((window as any)[compFactoryName]) continue; // Már betöltve

					try {
						const compResponse = await fetch(`${devUrl}/dist/components/${compName}.iife.js`, {
							mode: 'cors',
							credentials: 'omit'
						});
						if (compResponse.ok) {
							const compCode = await compResponse.text();
							const compScript = document.createElement('script');
							compScript.textContent = compCode;
							document.head.appendChild(compScript);
							console.log(`[DevPlugin] Component loaded: ${compName}`);
						}
					} catch {
						console.warn(`[DevPlugin] Failed to load component: ${compName}`);
					}
				}

				(window_obj as any).pluginMenuData = devMenuData;
				(window_obj as any).pluginId = pluginId;
				(window_obj as any).isPluginWithLayout = true;
				window_obj.component = PluginLayoutWrapper.default as any;
				window_obj.isLoading = false;
				// Betöltés után fókuszáljuk az ablakot
				this.windows.forEach((w) => (w.isActive = false));
				window_obj.isActive = true;
				window_obj.zIndex = this.getNextZIndex();
				this.windows = [...this.windows];

				console.log(`[DevPlugin] Layout módban betöltve: ${pluginId} (${devUrl})`);
				return;
			}

			// IIFE bundle lekérése a dev szerverről
			const entry = manifest.entry || 'dist/index.iife.js';
			const bundleResponse = await fetch(`${devUrl}/${entry}`, {
				mode: 'cors',
				credentials: 'omit'
			});
			if (!bundleResponse.ok) {
				throw new Error(`Bundle nem található: ${devUrl}/${entry}`);
			}
			const code = await bundleResponse.text();

			// Factory függvény neve a plugin ID alapján
			const factoryName = `${pluginId.replace(/-/g, '_')}_Plugin`;
			const expectedTagName = `${pluginId}-plugin`;
			const isAlreadyRegistered = customElements.get(expectedTagName) !== undefined;

			if (!isAlreadyRegistered) {
				// Bundle futtatása — regisztrálja a custom element-et
				const script = document.createElement('script');
				script.textContent = code;
				document.head.appendChild(script);
			}

			// Factory mindig meghívandó, hogy a tagName-t visszaadja
			// (az SDK már be van állítva window.webOS-ra a fenti initialize hívásban)
			const pluginFactory = (window as any)[factoryName];
			if (!pluginFactory || typeof pluginFactory !== 'function') {
				throw new Error(`Plugin factory '${factoryName}' nem található`);
			}

			const pluginInfo = pluginFactory();
			const tagName = pluginInfo.tagName;

			(window_obj as any).customElementTag = tagName;
			(window_obj as any).pluginProps = {
				windowId: id,
				pluginId,
				parameters: window_obj.parameters
			};
			window_obj.component = null as any;
			window_obj.isLoading = false;
			// Betöltés után fókuszáljuk az ablakot
			this.windows.forEach((w) => (w.isActive = false));
			window_obj.isActive = true;
			window_obj.zIndex = this.getNextZIndex();
			this.windows = [...this.windows];

			console.log(`[DevPlugin] Betöltve: ${pluginId} → <${tagName}> (${devUrl})`);
		} catch (error) {
			console.error(`[DevPlugin] Nem sikerült betölteni: ${componentName}`, error);
			const w = this.windows.find((w) => w.id === id);
			if (w) {
				w.isLoading = false;
				this.windows = [...this.windows];
			}
			throw error;
		}
	}

	/**
	 * Plugin betöltése Web Component-ként (menü nélkül)
	 */
	private async loadPluginAsWebComponent(
		id: string,
		pluginId: string,
		window_obj: WindowState,
		appData: any
	) {
		try {
			// WebOS SDK inicializálása a plugin számára
			const { WebOSSDK } = await import('@elyos-dev/sdk');
			const { AppLayout } = await import('$lib/components/shared');
			const { createAppShell } = await import('$lib/apps/appShell.svelte');

			// DataTable komponensek importálása
			const {
				DataTable,
				DataTableColumnHeader,
				DataTableFacetedFilter,
				renderComponent,
				renderSnippet,
				createActionsColumn
			} = await import('$lib/components/ui/data-table');
			const { Input } = await import('$lib/components/ui/input');
			const { Button } = await import('$lib/components/ui/button');
			const ContentSection = await import('$lib/components/shared/ContentSection.svelte');

			// User info lekérése (egyszerűsített - valós implementációban session-ből)
			const user = {
				id: 'current-user',
				name: 'Current User',
				email: 'user@example.com',
				roles: [],
				groups: []
			};

			const sdk = WebOSSDK.initialize(
				pluginId,
				user,
				window_obj.parameters || {},
				appData.pluginPermissions || [],
				undefined,
				{
					AppLayout,
					createAppShell,
					DataTable,
					DataTableColumnHeader,
					DataTableFacetedFilter,
					renderComponent,
					renderSnippet,
					createActionsColumn,
					Input,
					Button,
					ContentSection: ContentSection.default
				}
			);

			// Toast handler regisztrálása az SDK UIService-hez
			const { toast: showToast } = await import('svelte-sonner');
			sdk.ui._setToastHandler((message, type, duration) => {
				const toastFn =
					type === 'success'
						? showToast.success
						: type === 'error'
							? showToast.error
							: type === 'warning'
								? showToast.warning
								: showToast.info;
				toastFn(message, { duration });
			});

			// Dialog handler regisztrálása
			const dialogHandler = getGlobalDialogHandler();
			if (dialogHandler) sdk.ui._setDialogHandler(dialogHandler);

			console.log('[Plugin Loader] WebOS SDK initialized for plugin:', pluginId);
			console.log('[Plugin Loader] SDK instances:', (window as any).__webOS_instances);

			// Plugin JavaScript kód betöltése
			const response = await fetch(`/api/plugins/${pluginId}/load`);
			if (!response.ok) {
				throw new Error(`Failed to load plugin: ${response.statusText}`);
			}

			const code = await response.text();

			console.log('[Plugin Loader] Loading plugin as Web Component');

			// A plugin factory function dinamikus névvel lesz elérhető
			const factoryName = `${pluginId.replace(/-/g, '_')}_Plugin`;
			let pluginFactory = (window as any)[factoryName];

			// Ellenőrizzük, hogy a custom element már regisztrálva van-e
			const expectedTagName = `${pluginId}-plugin`;
			const isAlreadyRegistered = customElements.get(expectedTagName) !== undefined;

			if (!pluginFactory || typeof pluginFactory !== 'function') {
				// Plugin még nincs betöltve, futtatjuk a kódot
				const script = document.createElement('script');
				script.textContent = code;
				document.head.appendChild(script);

				console.log('[Plugin Loader] Plugin script executed');

				// Most már elérhetőnek kell lennie
				pluginFactory = (window as any)[factoryName];
				if (!pluginFactory || typeof pluginFactory !== 'function') {
					throw new Error(`Plugin factory function '${factoryName}' not found on window object`);
				}
			} else if (isAlreadyRegistered) {
				console.log('[Plugin Loader] Plugin already loaded, reusing');
			}
			// Hívjuk meg a factory-t a tag name lekéréséhez
			const pluginInfo = pluginFactory();
			const tagName = pluginInfo.tagName;

			console.log('[Plugin Loader] Plugin registered as custom element:', tagName);

			console.log('[Plugin Loader] Plugin registered as custom element:', tagName);

			// Store the custom element tag name as a special marker
			(window_obj as any).customElementTag = tagName;
			// Store window parameters to pass to the custom element
			(window_obj as any).pluginProps = {
				windowId: id,
				pluginId: pluginId,
				parameters: window_obj.parameters
			};
			window_obj.component = null as any; // Will be handled specially in Window.svelte
			window_obj.isLoading = false;
			this.windows = [...this.windows];

			console.log('[Plugin Loader] Plugin component loaded successfully');
		} catch (error) {
			console.error(`Failed to load plugin ${pluginId}:`, error);
			throw error;
		}
	}

	closeWindow(id: string) {
		const index = this.windows.findIndex((w) => w.id === id);
		if (index !== -1) {
			const window = this.windows[index];

			// Mentjük az ablak állapotát bezárás előtt
			this.saveWindowStateToStorage(window);

			this.windows.splice(index, 1);

			// Ha volt aktív ablak és bezártuk, aktiváljuk a legfelső másikat
			if (this.windows.length > 0) {
				const topWindow = this.windows.reduce((prev, current) =>
					current.zIndex > prev.zIndex ? current : prev
				);
				topWindow.isActive = true;
				// Trigger reactivity
				this.windows = [...this.windows];
			}
		}
	}

	activateWindow(id: string) {
		const window = this.windows.find((w) => w.id === id);

		// Ha az ablak már aktív, ne csináljunk semmit
		if (!window || window.isActive) {
			return;
		}

		// Deaktiváljuk az összes többi ablakot
		this.windows.forEach((w) => (w.isActive = false));

		// Aktiváljuk az aktuális ablakot
		window.isActive = true;
		window.zIndex = this.getNextZIndex();

		// Trigger reactivity
		this.windows = [...this.windows];
	}

	async minimizeWindow(id: string, beforeMinimize?: () => Promise<void>) {
		const window = this.windows.find((w) => w.id === id);
		if (window) {
			// Ha minimalizálunk (nem visszaállítunk) és van callback, hívjuk meg
			if (!window.isMinimized && beforeMinimize) {
				await beforeMinimize();
			}

			window.isMinimized = !window.isMinimized;
			if (window.isMinimized) {
				// Minimalizálás: deaktiváljuk az ablakot
				window.isActive = false;
				// Trigger reactivity azonnal
				this.windows = [...this.windows];

				// Aktiváljuk a következő nem-minimalizált ablakot
				const nextWindow = this.windows
					.filter((w) => w.id !== id && !w.isMinimized)
					.reduce<WindowState | null>(
						(prev, current) => (!prev || current.zIndex > prev.zIndex ? current : prev),
						null
					);
				if (nextWindow) {
					this.activateWindow(nextWindow.id);
				}
			} else {
				// Visszaállítás: aktiváljuk az ablakot
				this.activateWindow(id);
			}
		}
	}

	maximizeWindow(id: string) {
		const window = this.windows.find((w) => w.id === id);
		if (window) {
			const wasMaximized = window.isMaximized;
			window.isMaximized = !window.isMaximized;

			// Ha restore történik (maximalizáltból vissza), ellenőrizzük a célméretet
			if (wasMaximized && !window.isMaximized) {
				// Workspace méret lekérése
				const workspace = document.getElementById('workspace');
				if (workspace) {
					const workspaceRect = workspace.getBoundingClientRect();
					const maxWidth = workspaceRect.width;
					const maxHeight = workspaceRect.height;

					// Ellenőrizzük, hogy a jelenlegi méret 95%-on belül van-e a maximálishoz
					const widthRatio = window.size.width / maxWidth;
					const heightRatio = window.size.height / maxHeight;

					if (widthRatio >= RESTORE_SIZE_THRESHOLD || heightRatio >= RESTORE_SIZE_THRESHOLD) {
						// Ha igen, állítsuk 70%-ra
						window.size.width = Math.round(maxWidth * RESTORE_SIZE_RATIO);
						window.size.height = Math.round(maxHeight * RESTORE_SIZE_RATIO);

						// Pozíció centrálása
						window.position.x = Math.round((maxWidth - window.size.width) / 2);
						window.position.y = Math.round((maxHeight - window.size.height) / 2);
					}
				}
			}

			// Mentjük az állapotot
			this.saveWindowStateToStorage(window);

			// Trigger reactivity
			this.windows = [...this.windows];
		}
	}

	updatePosition(id: string, position: { x: number; y: number }) {
		const window = this.windows.find((w) => w.id === id);
		if (window) {
			window.position = position;
			// Debounce-szal mentjük az állapotot (ne minden pixel mozgatásnál)
			this.debouncedSaveWindowState(window);
		}
	}

	updateSize(id: string, size: { width: number; height: number }) {
		const window = this.windows.find((w) => w.id === id);
		if (window) {
			window.size = size;
			// Debounce-szal mentjük az állapotot (ne minden pixel átméretezésnél)
			this.debouncedSaveWindowState(window);
		}
	}

	deactivateAllWindows() {
		// Minden nem-minimalizált ablakot inaktívvá teszünk
		this.windows.forEach((w) => {
			if (!w.isMinimized) {
				w.isActive = false;
			}
		});
		// Trigger reactivity
		this.windows = [...this.windows];
	}

	getWindowParameters(id: string): AppParameters | undefined {
		const window = this.windows.find((w) => w.id === id);
		return window?.parameters;
	}

	getWindowById(id: string): WindowState | undefined {
		return this.windows.find((w) => w.id === id);
	}

	updateWindowTitle(id: string, newTitle: string) {
		const window = this.windows.find((w) => w.id === id);
		if (window) {
			window.title = newTitle;
			// Trigger reactivity
			this.windows = [...this.windows];
		}
	}

	updateWindowScreenshot(id: string, screenshotData: string) {
		const window = this.windows.find((w) => w.id === id);
		if (window) {
			window.screenshot = screenshotData;
			// Trigger reactivity
			this.windows = [...this.windows];
		}
	}

	updateWindowParameters(id: string, parameters: AppParameters) {
		const window = this.windows.find((w) => w.id === id);
		if (window) {
			window.parameters = { ...window.parameters, ...parameters };
			this.windows = [...this.windows];
		}
	}

	private parametersMatch(params1: AppParameters, params2: AppParameters): boolean {
		// Mély összehasonlítás a paraméterek között
		return JSON.stringify(params1) === JSON.stringify(params2);
	}

	private generateInstanceId(parameters: AppParameters): string {
		// Rövid azonosító generálása a paraméterek alapján
		const keyValues = Object.entries(parameters)
			.filter(([, value]) => value !== undefined && value !== null)
			.map(([key, value]) => `${key}:${String(value)}`)
			.slice(0, 2) // Csak az első 2 paramétert használjuk
			.join(',');

		return keyValues || 'default';
	}

	private getNextZIndex(): number {
		if (this.windows.length === 0) return this.baseZIndex;
		const maxZ = Math.max(...this.windows.map((w) => w.zIndex));
		return maxZ + 1;
	}

	private getNextPosition(): { x: number; y: number } {
		const offset = (this.windows.length % 10) * 30;
		return { x: 100 + offset, y: 100 + offset };
	}

	/**
	 * Ellenőrzi, hogy az ablak pozíció és méret érvényes-e (belefér a workspace-be)
	 * @param position Ablak pozíció
	 * @param size Ablak méret
	 * @param workspaceRect Workspace méretei
	 * @returns true ha az ablak látható a workspace-ben
	 */
	private isWindowPositionValid(
		position: { x: number; y: number },
		size: { width: number; height: number },
		workspaceRect: DOMRect
	): boolean {
		// Ellenőrizzük, hogy az ablak jobb alsó sarka belefér-e a workspace-be
		const rightEdge = position.x + size.width;
		const bottomEdge = position.y + size.height;

		// Az ablak bal felső sarkának legalább a workspace-ben kell lennie
		// És a jobb alsó saroknak sem szabad túllógnia
		const isXValid = position.x >= 0 && rightEdge <= workspaceRect.width;
		const isYValid = position.y >= 0 && bottomEdge <= workspaceRect.height;

		return isXValid && isYValid;
	}

	// Debounce timer tárolása app-onként
	private saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

	/**
	 * Ablak állapot mentése localStorage-ba
	 * @param window Window state to save
	 */
	private saveWindowStateToStorage(window: WindowState): void {
		const state: StoredWindowState = {
			size: window.size,
			position: window.position,
			isMaximized: window.isMaximized
		};
		saveWindowState(window.appName, state);
	}

	/**
	 * Debounced mentés - ne minden pixel mozgatásnál/átméretezésnél mentsen
	 * @param window Window state to save
	 */
	private debouncedSaveWindowState(window: WindowState): void {
		// Töröljük az előző timer-t ha van
		const existingTimer = this.saveTimers.get(window.appName);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		// Új timer beállítása - 500ms után menti
		const timer = setTimeout(() => {
			this.saveWindowStateToStorage(window);
			this.saveTimers.delete(window.appName);
		}, 500);

		this.saveTimers.set(window.appName, timer);
	}
}

const WINDOW_MANAGER_KEY = Symbol('windowManager');

// Global singleton instance
let globalWindowManager: WindowManager | null = null;

/**
 * Creates a new window manager instance.
 * @returns {WindowManager} The window manager instance.
 */
export function createWindowManager() {
	if (!globalWindowManager) {
		globalWindowManager = new WindowManager();
	}
	return globalWindowManager;
}

/**
 * Set the window manager instance.
 * @param {WindowManager} manager Instance.
 */
export function setWindowManager(manager: WindowManager) {
	globalWindowManager = manager;
	setContext(WINDOW_MANAGER_KEY, manager);
}

/**
 * Gets the window manager instance.
 * @returns {WindowManager} The window manager instance.
 */
export function getWindowManager(): WindowManager {
	// Try context first (for components), then fallback to global
	try {
		return getContext(WINDOW_MANAGER_KEY);
	} catch {
		// If context fails (e.g., outside component), use global
		if (!globalWindowManager) {
			globalWindowManager = new WindowManager();
		}
		return globalWindowManager;
	}
}

// ─── Globális dialog handler ─────────────────────────────────────────────────

import type { DialogOptions, DialogResult } from '@elyos-dev/sdk';

/** Globális dialog handler — a +layout.svelte regisztrálja, a plugin betöltők használják */
let globalDialogHandler: ((options: DialogOptions) => Promise<DialogResult>) | null = null;

/**
 * Dialog handler regisztrálása (a +layout.svelte hívja meg mountkor)
 */
export function setGlobalDialogHandler(
	fn: (options: DialogOptions) => Promise<DialogResult>
): void {
	globalDialogHandler = fn;
}

/**
 * Globális dialog handler lekérése (plugin betöltők használják)
 */
export function getGlobalDialogHandler():
	| ((options: DialogOptions) => Promise<DialogResult>)
	| null {
	return globalDialogHandler;
}
