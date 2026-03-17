/**
 * Notification Service
 *
 * Értesítések küldése a notification center-be.
 * Jogosultság ellenőrzéssel.
 */

import type {
	NotificationService as INotificationService,
	NotificationOptions
} from '../../types/index.js';
import { PluginErrorCode } from '../../types/index.js';

export class NotificationService implements INotificationService {
	private readonly pluginId: string;
	private readonly hasPermission: boolean;
	private notificationFn: ((options: NotificationOptions) => Promise<void>) | null = null;

	constructor(pluginId: string, permissions: string[]) {
		this.pluginId = pluginId;
		this.hasPermission = permissions.includes('notifications');
	}

	/**
	 * Notification callback regisztrálása (az ElyOS core hívja meg dev módban)
	 */
	setDevNotificationHandler(fn: (options: NotificationOptions) => Promise<void>): void {
		this.notificationFn = fn;
	}

	/** Értesítés küldése */
	async send(options: NotificationOptions): Promise<void> {
		if (!this.hasPermission) {
			throw new Error(
				`${PluginErrorCode.PERMISSION_DENIED}: Plugin does not have 'notifications' permission`
			);
		}

		// Ha van regisztrált handler (dev mód), azt használjuk
		if (this.notificationFn) {
			return this.notificationFn(options);
		}

		try {
			const response = await fetch(`/api/plugins/${this.pluginId}/notifications`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: options.userId,
					title: options.title,
					message: options.message,
					type: options.type ?? 'info'
				}),
				credentials: 'same-origin'
			});

			if (!response.ok) {
				if (response.status === 403) {
					throw new Error(`${PluginErrorCode.PERMISSION_DENIED}: Permission denied`);
				}
				if (response.status >= 500) {
					throw new Error(`${PluginErrorCode.SERVER_ERROR}: Server error`);
				}
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`Failed to send notification: ${(errorData as Record<string, string>).error ?? 'Unknown error'}`
				);
			}

			const result = (await response.json()) as { success: boolean; error?: string };

			if (!result.success) {
				throw new Error(`Failed to send notification: ${result.error ?? 'Unknown error'}`);
			}
		} catch (error) {
			if (error instanceof Error && error.message.includes('Failed to fetch')) {
				throw new Error(`${PluginErrorCode.NETWORK_ERROR}: Network error`);
			}
			throw error;
		}
	}
}
