/**
 * Mock Notification Service
 *
 * Console-based notification simulation.
 */

import type { NotificationService, NotificationOptions } from '../../types/index.js';

/** Mock Notification service — simulates notifications by logging to the console. */
export class MockNotificationService implements NotificationService {
	/** Creates a new MockNotificationService instance. */
	constructor() {}

	/**
	 * Simulate sending a notification — logs to the console, does not send a real notification.
	 * @param options - Notification data (userId, title, message, type)
	 */
	async send(options: NotificationOptions): Promise<void> {
		console.log(
			`[Mock Notification] [${options.type ?? 'info'}] ${options.title}: ${options.message} (to: ${options.userId})`
		);
	}
}
