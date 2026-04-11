/**
 * Mock UI Service
 *
 * For standalone dev mode: native browser dialogs (confirm/prompt/alert),
 * console-based toasts, and a mock theme palette.
 *
 * A components property tartalmazza a mock DataTable komponenseket,
 * amelyek standalone módban szimulálják a core UI komponenseket.
 */

import type {
	UIService,
	DialogOptions,
	DialogResult,
	ThemeColors,
	ToastType,
	WebOSComponents,
	ActionBarItem
} from '../../types/index.js';

import {
	createActionsColumn,
	renderComponent,
	renderSnippet,
	DataTableColumnHeader
} from '../components/mockDataTableHelpers.js';

// Svelte komponensek dinamikus importja — a plugin Vite buildje fordítja le őket
// Az SDK csak a path-t adja meg, a tényleges import a plugin oldalán történik
const SIMPLE_DATATABLE_PATH = '@elyos-dev/sdk/dev/components/SimpleDataTable.svelte';
const SIMPLE_ROW_ACTIONS_PATH = '@elyos-dev/sdk/dev/components/SimpleRowActions.svelte';

/** Mock UI service — simulates toasts, dialogs, and theme for standalone development. */
export class MockUIService implements UIService {
	private _actionBarItems: ActionBarItem[] = [];
	private _setActionBarFn: ((items: ActionBarItem[]) => void) | null = null;
	private _clearActionBarFn: (() => void) | null = null;

	/** Mock UI components — DataTable és segédfüggvények standalone módban. */
	private _components: WebOSComponents;

	/** @param components - Opcionális felülírt komponensek */
	constructor(components?: WebOSComponents) {
		this._components = {
			// Segédfüggvények — azonnal elérhetők
			createActionsColumn,
			renderComponent,
			renderSnippet,
			DataTableColumnHeader,
			// Felülírható (pl. DataTable: SimpleDataTable)
			...components
		};
	}

	/**
	 * DataTable komponens beállítása.
	 * @internal
	 */
	_setDataTableComponent(component: unknown): void {
		this._components = { ...this._components, DataTable: component };
	}

	/**
	 * Simulate a toast — logs to the console.
	 */
	toast(message: string, type: ToastType = 'info', duration: number = 3000): void {
		console.log(`[Mock Toast ${type}] ${message} (${duration}ms)`);
	}

	/**
	 * Simulate a dialog using native browser `confirm`/`prompt`/`alert`.
	 */
	async dialog(options: DialogOptions): Promise<DialogResult> {
		const title = options.title ? `${options.title}\n\n` : '';
		const text = `${title}${options.message ?? ''}`;

		if (options.type === 'confirm') {
			const confirmed = window.confirm(text);
			return { action: confirmed ? 'confirm' : 'cancel' };
		}

		if (options.type === 'prompt') {
			const value = window.prompt(text, options.defaultValue ?? '');
			if (value === null) return { action: 'cancel' };
			return { action: 'submit', value };
		}

		window.alert(text);
		return { action: 'ok' };
	}

	/** navigateTo — standalone módban console log */
	navigateTo(component: string, props?: Record<string, unknown>): void {
		console.log(`[Mock UI] navigateTo: ${component}`, props);
	}

	/** setActionBar — standalone módban console log + callback */
	setActionBar(items: ActionBarItem[]): void {
		this._actionBarItems = items;
		this._setActionBarFn?.(items);
		console.log('[Mock UI] setActionBar:', items.map((i) => i.label).join(', '));
	}

	/** clearActionBar — standalone módban törlés */
	clearActionBar(): void {
		this._actionBarItems = [];
		this._clearActionBarFn?.();
		console.log('[Mock UI] clearActionBar');
	}

	/** Aktuális action bar elemek (standalone módban) */
	get actionBarItems(): ActionBarItem[] {
		return this._actionBarItems;
	}

	/** Mock UI components */
	get components(): WebOSComponents {
		return this._components;
	}

	/** Mock theme colors — default dev palette. */
	get theme(): ThemeColors {
		return {
			primary: '#667eea',
			secondary: '#764ba2',
			accent: '#f093fb',
			background: '#ffffff',
			foreground: '#1a1a2e',
			muted: '#f1f5f9',
			mutedForeground: '#64748b',
			border: '#e2e8f0',
			input: '#e2e8f0',
			ring: '#667eea',
			destructive: '#ef4444',
			destructiveForeground: '#ffffff'
		};
	}
}

export { SIMPLE_DATATABLE_PATH, SIMPLE_ROW_ACTIONS_PATH };
