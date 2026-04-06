/**
 * UI Service
 *
 * Provides the plugin with access to UI components and functions.
 * Toast notifications, dialogs, theme colors.
 */

import type {
	UIService as IUIService,
	DialogOptions,
	DialogResult,
	ThemeColors,
	ToastType,
	WebOSComponents
} from '../../types/index.js';

/** UI service — toast notifications, dialogs, theme colors, and UI component access. */
export class UIService implements IUIService {
	/** Registered toast display function, set by the ElyOS core */
	private toastFn: ((message: string, type: ToastType, duration: number) => void) | null = null;
	/** Registered dialog display function, set by the ElyOS core */
	private dialogFn: ((options: DialogOptions) => Promise<DialogResult>) | null = null;
	/** Registered components, set by the ElyOS core */
	private _components: WebOSComponents = {};

	/**
	 * Register the components (called by the ElyOS core).
	 * @param components - ElyOS UI components
	 */
	_setComponents(components: WebOSComponents): void {
		this._components = components;
	}

	/**
	 * Register the toast handler (called by the ElyOS core).
	 * @param fn - Function that displays a toast notification
	 */
	_setToastHandler(fn: (message: string, type: ToastType, duration: number) => void): void {
		this.toastFn = fn;
	}

	/**
	 * Register the dialog handler (called by the ElyOS core).
	 * @param fn - Function that displays a dialog
	 */
	_setDialogHandler(fn: (options: DialogOptions) => Promise<DialogResult>): void {
		this.dialogFn = fn;
	}

	/**
	 * Show a toast notification.
	 *
	 * @param message - Text to display
	 * @param type - Toast type (`info` | `success` | `warning` | `error`)
	 * @param duration - Display duration in milliseconds (default: 3000)
	 */
	toast(message: string, type: ToastType = 'info', duration: number = 3000): void {
		if (this.toastFn) {
			this.toastFn(message, type, duration);
		} else {
			// Fallback when no handler is registered
			console.log(`[Toast ${type}] ${message}`);
		}
	}

	/**
	 * Show a dialog.
	 *
	 * @param options - Dialog options (title, message, type, buttons)
	 * @returns The action selected by the user and an optional value
	 */
	async dialog(options: DialogOptions): Promise<DialogResult> {
		if (this.dialogFn) {
			return this.dialogFn(options);
		}

		// Fallback when no handler is registered
		const { title, message, type = 'info' } = options;
		if (type === 'confirm') {
			const confirmed = window.confirm(`${title}\n\n${message}`);
			return { action: confirmed ? 'confirm' : 'cancel' };
		}
		if (type === 'prompt') {
			const value = window.prompt(`${title}\n\n${message}`);
			return { action: value !== null ? 'submit' : 'cancel', value: value ?? undefined };
		}
		window.alert(`${title}\n\n${message}`);
		return { action: 'ok' };
	}

	/**
	 * Access ElyOS UI components.
	 * Components are registered by the ElyOS core via `_setComponents`.
	 */
	get components(): WebOSComponents {
		return this._components;
	}

	/**
	 * Current theme colors read from CSS custom properties.
	 * Returns empty values when running outside a browser environment.
	 */
	get theme(): ThemeColors {
		if (typeof document === 'undefined') {
			return UIService.defaultTheme();
		}

		const style = getComputedStyle(document.documentElement);
		const get = (name: string) => style.getPropertyValue(name).trim();

		return {
			primary: get('--primary'),
			secondary: get('--secondary'),
			accent: get('--accent'),
			background: get('--background'),
			foreground: get('--foreground'),
			muted: get('--muted'),
			mutedForeground: get('--muted-foreground'),
			border: get('--border'),
			input: get('--input'),
			ring: get('--ring'),
			destructive: get('--destructive'),
			destructiveForeground: get('--destructive-foreground')
		};
	}

	/** Returns default empty theme colors for non-browser environments */
	private static defaultTheme(): ThemeColors {
		return {
			primary: '',
			secondary: '',
			accent: '',
			background: '',
			foreground: '',
			muted: '',
			mutedForeground: '',
			border: '',
			input: '',
			ring: '',
			destructive: '',
			destructiveForeground: ''
		};
	}
}
