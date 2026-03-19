/**
 * Mock Notification Service
 *
 * Console-based értesítések.
 */

import type { NotificationService, NotificationOptions } from '../../types/index.js';

export class MockNotificationService implements NotificationService {
	/**
	 * Értesítés szimulálása — console-ra logol, nem küld valódi értesítést.
	 * @param options - Értesítés adatai (userId, title, message, type)
	 */
	async send(options: NotificationOptions): Promise<void> {
		console.log(
			`[Mock Notification] [${options.type ?? 'info'}] ${options.title}: ${options.message} (to: ${options.userId})`
		);
	}
}
