import { io, type Socket } from 'socket.io-client';
import { browser } from '$app/environment';
import type { Notification } from '@racona/database';

export interface NotificationState {
	notifications: Notification[];
	unreadCount: number;
	isConnected: boolean;
}

class NotificationStore {
	private socket: Socket | null = null;
	private state = $state<NotificationState>({
		notifications: [],
		unreadCount: 0,
		isConnected: false
	});

	// Queue for critical notifications that need user acknowledgement
	private _criticalQueue = $state<Notification[]>([]);

	get notifications() {
		return this.state.notifications;
	}

	get unreadCount() {
		return this.state.unreadCount;
	}

	get isConnected() {
		return this.state.isConnected;
	}

	/**
	 * Get the current critical notification (first in queue)
	 */
	get currentCritical(): Notification | null {
		return this._criticalQueue.length > 0 ? this._criticalQueue[0] : null;
	}

	/**
	 * Acknowledge (dismiss) the current critical notification
	 */
	acknowledgeCritical() {
		if (this._criticalQueue.length > 0) {
			const notification = this._criticalQueue[0];
			this._criticalQueue = this._criticalQueue.slice(1);
			// Mark as read automatically
			this.markAsRead(notification.id);
		}
	}

	/**
	 * Whether there are unread critical notifications
	 */
	get hasUnreadCritical(): boolean {
		return this.state.notifications.some((n) => n.type === 'critical' && !n.isRead);
	}

	/**
	 * Initialize Socket.IO connection
	 */
	async connect(userId: number) {
		if (!browser || this.socket?.connected) return;

		try {
			// Initialize socket connection
			this.socket = io({
				path: '/socket.io/',
				transports: ['websocket', 'polling'],
				// Reconnection settings
				reconnection: true,
				reconnectionAttempts: Infinity,
				reconnectionDelay: 1000,
				reconnectionDelayMax: 5000,
				// Timeout settings
				timeout: 20000,
				// Upgrade settings
				upgrade: true,
				rememberUpgrade: true,
				// Force new connection
				forceNew: false,
				// Multiplex
				multiplex: true
			});

			this.socket.on('connect', () => {
				console.log('[NotificationStore] Connected to Socket.IO');
				this.state.isConnected = true;

				// Register user
				this.socket?.emit('register', userId);
			});

			this.socket.on('disconnect', () => {
				console.log('[NotificationStore] Disconnected from Socket.IO');
				this.state.isConnected = false;
			});

			// Listen for new notifications
			this.socket.on('notification:new', (notification: Notification) => {
				console.log('[NotificationStore] New notification received via WebSocket:', notification);

				// Convert date strings to Date objects
				const normalizedNotification = {
					...notification,
					createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
					readAt: notification.readAt ? new Date(notification.readAt) : null
				};

				this.state.notifications = [normalizedNotification, ...this.state.notifications];
				this.state.unreadCount++;

				// Show toast notification with action
				this.showToastNotification(normalizedNotification);

				// Show browser notification if permitted
				this.showBrowserNotification(normalizedNotification);
			});

			// Listen for unread count updates
			this.socket.on('notification:unread-count', (count: number) => {
				console.log('[NotificationStore] Unread count:', count);
				this.state.unreadCount = count;
			});

			// Load initial notifications
			await this.loadNotifications();

			// Poll for new notifications only if WebSocket is disconnected
			// This ensures notifications appear even if Socket.IO fails
			setInterval(() => {
				if (browser && !this.state.isConnected) {
					console.log('[NotificationStore] WebSocket disconnected, polling for notifications');
					this.loadNotifications();
				}
			}, 30000);
		} catch (error) {
			console.error('[NotificationStore] Connection error:', error);
			// Even if Socket.IO fails, try to load notifications via API
			await this.loadNotifications();
		}
	}

	/**
	 * Disconnect from Socket.IO
	 */
	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
			this.state.isConnected = false;
		}
	}

	/**
	 * Load notifications from API
	 */
	async loadNotifications(showToast: boolean = false) {
		try {
			const response = await fetch('/api/notifications');
			if (response.ok) {
				const data = await response.json();

				// Detect new notifications (compare with current state)
				const currentIds = new Set(this.state.notifications.map((n) => n.id));
				const newNotifications = data.notifications.filter(
					(n: Notification) => !currentIds.has(n.id)
				);

				// Show toast for new notifications only if:
				// 1. We already had notifications loaded (not initial load)
				// 2. There are new notifications
				// 3. showToast is explicitly true (for dev mode)
				if (this.state.notifications.length > 0 && newNotifications.length > 0 && showToast) {
					// Show toast only for the most recent new notification
					const newestNotification = newNotifications[0];
					this.showToastNotification(newestNotification);
				}

				this.state.notifications = data.notifications;
				this.state.unreadCount = data.notifications.filter((n: Notification) => !n.isRead).length;
			}
		} catch (error) {
			console.error('[NotificationStore] Error loading notifications:', error);
		}
	}

	/**
	 * Reload notifications (useful in dev mode without Socket.IO)
	 */
	async reload() {
		await this.loadNotifications(true);
	}

	/**
	 * Mark notification as read
	 */
	async markAsRead(notificationId: number) {
		try {
			const response = await fetch(`/api/notifications/${notificationId}/read`, {
				method: 'POST'
			});

			if (response.ok) {
				// Update local state
				const notification = this.state.notifications.find((n) => n.id === notificationId);
				if (notification && !notification.isRead) {
					notification.isRead = true;
					notification.readAt = new Date();
					this.state.unreadCount = Math.max(0, this.state.unreadCount - 1);
				}

				// Emit to socket
				this.socket?.emit('notification:mark-read', notificationId);
			}
		} catch (error) {
			console.error('[NotificationStore] Error marking notification as read:', error);
		}
	}

	/**
	 * Mark all notifications as read
	 */
	async markAllAsRead() {
		try {
			const response = await fetch('/api/notifications/read-all', {
				method: 'POST'
			});

			if (response.ok) {
				// Update local state
				this.state.notifications.forEach((n) => {
					if (!n.isRead) {
						n.isRead = true;
						n.readAt = new Date();
					}
				});
				this.state.unreadCount = 0;
			}
		} catch (error) {
			console.error('[NotificationStore] Error marking all notifications as read:', error);
		}
	}

	/**
	 * Delete a notification
	 */
	async deleteNotification(notificationId: number) {
		try {
			const response = await fetch(`/api/notifications/${notificationId}/delete`, {
				method: 'POST'
			});

			if (response.ok) {
				// Remove from local state
				const notification = this.state.notifications.find((n) => n.id === notificationId);
				this.state.notifications = this.state.notifications.filter((n) => n.id !== notificationId);

				// Update unread count if the deleted notification was unread
				if (notification && !notification.isRead) {
					this.state.unreadCount = Math.max(0, this.state.unreadCount - 1);
				}
			}
		} catch (error) {
			console.error('[NotificationStore] Error deleting notification:', error);
			throw error;
		}
	}

	/**
	 * Delete all notifications
	 */
	async deleteAllNotifications() {
		try {
			const response = await fetch('/api/notifications/delete-all', {
				method: 'POST'
			});

			if (response.ok) {
				// Clear local state
				this.state.notifications = [];
				this.state.unreadCount = 0;
			}
		} catch (error) {
			console.error('[NotificationStore] Error deleting all notifications:', error);
			throw error;
		}
	}

	/**
	 * Send a notification
	 */
	async sendNotification(payload: {
		userId?: number | string;
		userIds?: (number | string)[];
		broadcast?: boolean;
		appName?: string;
		title: string;
		message: string;
		type?: 'info' | 'success' | 'warning' | 'error' | 'critical';
		data?: Record<string, unknown>;
	}) {
		try {
			const response = await fetch('/api/notifications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error('Failed to send notification');
			}
		} catch (error) {
			console.error('[NotificationStore] Error sending notification:', error);
			throw error;
		}
	}

	/**
	 * Show toast notification (or queue critical notification for alert dialog)
	 */
	private showToastNotification(notification: Notification) {
		console.log('[NotificationStore] showToastNotification called', { browser, notification });
		if (!browser) return;

		// Critical notifications go to the alert dialog queue instead of toast
		if (notification.type === 'critical') {
			console.log('[NotificationStore] Queuing critical notification:', notification.id);
			this._criticalQueue = [...this._criticalQueue, notification];
			return;
		}

		// Dynamically import toast to avoid SSR issues
		import('svelte-sonner')
			.then(({ toast }) => {
				console.log('[NotificationStore] Toast imported successfully');

				// Get localized text
				const getLocalizedText = (content: any): string => {
					if (typeof content === 'string') return content;
					if (content && typeof content === 'object') {
						// Try to get browser language or fallback to 'hu'
						const locale = navigator.language.split('-')[0] || 'hu';
						return (
							content[locale] || content['hu'] || content['en'] || Object.values(content)[0] || ''
						);
					}
					return '';
				};

				const title = getLocalizedText(notification.title);
				const message = getLocalizedText(notification.message);

				console.log('[NotificationStore] Showing toast:', {
					title,
					message,
					type: notification.type
				});

				// Show toast based on notification type
				const toastFn = toast[notification.type as keyof typeof toast] || toast.info;

				(toastFn as Function)(title, {
					description: message,
					duration: 5000,
					action: {
						label: 'Megnyitás',
						onClick: () => this.openNotificationInApp(notification.id)
					}
				});
			})
			.catch((error) => {
				console.error('[NotificationStore] Failed to import toast:', error);
			});
	}

	/**
	 * Open notification in the notifications app
	 */
	private async openNotificationInApp(notificationId: number) {
		try {
			// Dynamically import to avoid circular dependencies
			const { getWindowManager } = await import('$lib/stores');
			const { getAppByName } = await import('$lib/services/client/appRegistry');

			const windowManager = getWindowManager();
			const app = await getAppByName('notifications');

			if (app && windowManager) {
				windowManager.openWindow('notifications', app.title, app, {
					view: 'NotificationDetail',
					notificationId
				});
			}
		} catch (error) {
			console.error('[NotificationStore] Failed to open notification:', error);
		}
	}

	/**
	 * Show browser notification
	 */
	private showBrowserNotification(notification: Notification) {
		if (!browser || !('Notification' in window)) return;

		if (Notification.permission === 'granted') {
			new Notification(String(notification.title), {
				body: String(notification.message),
				icon: '/favicon.svg',
				tag: `notification-${notification.id}`
			});
		} else if (Notification.permission !== 'denied') {
			Notification.requestPermission().then((permission) => {
				if (permission === 'granted') {
					new Notification(String(notification.title), {
						body: String(notification.message),
						icon: '/favicon.svg',
						tag: `notification-${notification.id}`
					});
				}
			});
		}
	}

	/**
	 * Get notifications for a specific app
	 */
	getAppNotifications(appName: string): Notification[] {
		return this.state.notifications.filter((n) => n.appName === appName);
	}

	/**
	 * Get unread count for a specific app
	 */
	getAppUnreadCount(appName: string): number {
		return this.state.notifications.filter((n) => n.appName === appName && !n.isRead).length;
	}
}

// Singleton instance
let notificationStore: NotificationStore | null = null;

export function getNotificationStore(): NotificationStore {
	if (!notificationStore) {
		notificationStore = new NotificationStore();
	}
	return notificationStore;
}
