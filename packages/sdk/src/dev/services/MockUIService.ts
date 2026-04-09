/**
 * Mock UI Service
 *
 * For standalone dev mode: native browser dialogs (confirm/prompt/alert),
 * console-based toasts, and a mock theme palette.
 */

import type {
	UIService,
	DialogOptions,
	DialogResult,
	ThemeColors,
	ToastType,
	WebOSComponents
} from '../../types/index.js';

/** Mock UI service — simulates toasts, dialogs, and theme for standalone development. */
export class MockUIService implements UIService {
	/** Creates a new MockUIService instance. */
	constructor() {}

	/**
	 * Simulate a toast — logs to the console.
	 * @param message - Text to display
	 * @param type - Toast type
	 * @param duration - Display duration in ms
	 */
	toast(message: string, type: ToastType = 'info', duration: number = 3000): void {
		console.log(`[Mock Toast ${type}] ${message} (${duration}ms)`);
	}

	/**
	 * Simulate a dialog using native browser `confirm`/`prompt`/`alert`.
	 * @param options - Dialog options
	 * @returns The action selected by the user
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

		// info / alert
		window.alert(text);
		return { action: 'ok' };
	}

	/** Mock UI components — empty object in dev mode. */
	get components(): WebOSComponents {
		return {};
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
