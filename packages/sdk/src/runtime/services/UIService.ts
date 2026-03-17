/**
 * UI Service
 *
 * Biztosítja a plugin számára a UI komponensek és funkciók elérését.
 * Toast értesítések, dialógusok, téma színek.
 */

import type {
	UIService as IUIService,
	DialogOptions,
	DialogResult,
	ThemeColors,
	ToastType,
	WebOSComponents
} from '../../types/index.js';

export class UIService implements IUIService {
	private toastFn: ((message: string, type: ToastType, duration: number) => void) | null = null;
	private dialogFn: ((options: DialogOptions) => Promise<DialogResult>) | null = null;

	/**
	 * Toast callback regisztrálása (az ElyOS core hívja meg)
	 */
	_setToastHandler(fn: (message: string, type: ToastType, duration: number) => void): void {
		this.toastFn = fn;
	}

	/**
	 * Dialog callback regisztrálása (az ElyOS core hívja meg)
	 */
	_setDialogHandler(fn: (options: DialogOptions) => Promise<DialogResult>): void {
		this.dialogFn = fn;
	}

	/**
	 * Toast értesítés megjelenítése
	 */
	toast(message: string, type: ToastType = 'info', duration: number = 3000): void {
		if (this.toastFn) {
			this.toastFn(message, type, duration);
		} else {
			// Fallback ha nincs regisztrált handler
			console.log(`[Toast ${type}] ${message}`);
		}
	}

	/**
	 * Dialógus megjelenítése
	 */
	async dialog(options: DialogOptions): Promise<DialogResult> {
		if (this.dialogFn) {
			return this.dialogFn(options);
		}

		// Fallback ha nincs regisztrált handler
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
	 * Svelte komponensek elérése
	 */
	get components(): WebOSComponents {
		return {};
	}

	/**
	 * Téma színek elérése CSS változókból
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
