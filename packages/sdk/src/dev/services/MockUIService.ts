/**
 * Mock UI Service
 *
 * Standalone fejlesztői módhoz: böngésző natív dialógusok (confirm/prompt/alert),
 * console-based toast és mock téma.
 */

import type {
	UIService,
	DialogOptions,
	DialogResult,
	ThemeColors,
	ToastType,
	WebOSComponents
} from '../../types/index.js';

export class MockUIService implements UIService {
	toast(message: string, type: ToastType = 'info', duration: number = 3000): void {
		console.log(`[Mock Toast ${type}] ${message} (${duration}ms)`);
	}

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

	get components(): WebOSComponents {
		return {};
	}

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
