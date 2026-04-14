import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { notificationRepository } from '$lib/server/database/repositories';
import type { NewNotification } from '@racona/database';
import { logger } from '$lib/server/logging';
import db from '$lib/server/database';
import { users } from '@racona/database/schemas';

let io: SocketIOServer | null = null;

// User ID to socket ID mapping
const userSockets = new Map<string, Set<string>>();
// Online user tracking
const onlineUsers = new Set<string>();

// Helper type for i18n content
export type I18nContent = {
	hu: string;
	en: string;
	[key: string]: string;
};

export interface NotificationPayload {
	userId?: number; // Single user
	userIds?: number[]; // Multiple users
	groupId?: string; // Group (future implementation)
	broadcast?: boolean; // All users
	appName?: string;
	title: string | I18nContent; // Support both string (backward compat) and i18n object
	message: string | I18nContent; // Support both string (backward compat) and i18n object
	details?: string | I18nContent | null; // Optional detailed message
	type?: 'info' | 'success' | 'warning' | 'error' | 'critical';
	data?: Record<string, unknown>;
}

/**
 * Initialize Socket.IO server
 * Elfogad egy HTTP szervert (dev) vagy egy már létező SocketIOServer példányt (prod, global.io)
 */
export function initializeSocketIO(serverOrIo: HTTPServer | SocketIOServer) {
	if (io) {
		logger.warn('[Socket.IO] Already initialized');
		return io;
	}

	if (serverOrIo instanceof SocketIOServer) {
		// Production: a server.js már létrehozta a Socket.IO példányt
		io = serverOrIo;
	} else {
		// Development: Vite dev szerveren hozzuk létre
		io = new SocketIOServer(serverOrIo, {
			cors: {
				origin: '*',
				methods: ['GET', 'POST']
			},
			path: '/socket.io/',
			pingTimeout: 60000,
			pingInterval: 25000,
			connectTimeout: 45000,
			upgradeTimeout: 10000,
			transports: ['websocket', 'polling']
		});
	}

	io.on('connection', (socket) => {
		logger.info(`[Socket.IO] Client connected: ${socket.id}`);

		// Felhasználó regisztrálása
		socket.on('register', (userId: string | number) => {
			if (!userId) {
				logger.warn(`[Socket.IO] Registration attempt without userId: ${socket.id}`);
				return;
			}

			const userIdStr = String(userId);
			const userIdNum = typeof userId === 'number' ? userId : parseInt(userId);

			if (!userSockets.has(userIdStr)) {
				userSockets.set(userIdStr, new Set());
			}
			userSockets.get(userIdStr)!.add(socket.id);
			socket.join(`user:${userIdNum}`);

			const wasOffline = !onlineUsers.has(userIdStr);
			onlineUsers.add(userIdStr);

			logger.info(`[Socket.IO] User registered: ${userIdNum} (socket: ${socket.id})`);

			// Olvasatlan értesítések száma
			notificationRepository.getUnreadCount(userIdNum).then((count) => {
				socket.emit('notification:unread-count', count);
			});

			// Online státusz broadcast
			if (wasOffline) {
				io!.emit('chat:user-online', userIdNum);
			}

			// Online felhasználók listája az újonnan csatlakozónak
			socket.emit('chat:online-users', Array.from(onlineUsers));
		});

		// Kapcsolat bontása
		socket.on('disconnect', () => {
			logger.info(`[Socket.IO] Client disconnected: ${socket.id}`);

			for (const [userId, sockets] of userSockets.entries()) {
				if (sockets.has(socket.id)) {
					sockets.delete(socket.id);
					if (sockets.size === 0) {
						userSockets.delete(userId);
						onlineUsers.delete(userId);
						io!.emit('chat:user-offline', parseInt(userId));
					}
					logger.info(`[Socket.IO] User unregistered: ${userId} (socket: ${socket.id})`);
					break;
				}
			}
		});

		// Értesítés olvasottnak jelölése
		socket.on('notification:mark-read', async (notificationId: number) => {
			try {
				await notificationRepository.markAsRead(notificationId);
				logger.info(`[Socket.IO] Notification marked as read: ${notificationId}`);
			} catch (error) {
				logger.error('[Socket.IO] Error marking notification as read:', {
					context: { error: String(error) }
				});
			}
		});

		// Összes értesítés olvasottnak jelölése
		socket.on('notification:mark-all-read', async (userId: string | number) => {
			try {
				const userIdNum = typeof userId === 'number' ? userId : parseInt(userId);
				await notificationRepository.markAllAsRead(userIdNum);
				socket.emit('notification:unread-count', 0);
				logger.info(`[Socket.IO] All notifications marked as read for user: ${userIdNum}`);
			} catch (error) {
				logger.error('[Socket.IO] Error marking all notifications as read:', {
					context: { error: String(error) }
				});
			}
		});

		// Chat: üzenet küldése
		socket.on(
			'chat:send-message',
			(data: { recipientId: number; message: unknown; conversationId: string }) => {
				const { recipientId, message, conversationId } = data;
				io!.to(`user:${recipientId}`).emit('chat:new-message', { message, conversationId });
			}
		);

		// Chat: üzenet olvasottnak jelölése
		socket.on('chat:mark-read', (conversationId: string) => {
			logger.info(`[Socket.IO] Messages marked as read in conversation ${conversationId}`);
		});

		// Chat: gépelés jelző
		socket.on(
			'chat:typing',
			(data: { recipientId: number; conversationId: string; isTyping: boolean }) => {
				const { recipientId, conversationId, isTyping } = data;
				io!.to(`user:${recipientId}`).emit('chat:user-typing', { conversationId, isTyping });
			}
		);
	});

	logger.info('[Socket.IO] Server initialized');
	return io;
}

/**
 * Get Socket.IO server instance
 */
export function getSocketIO(): SocketIOServer {
	// In production, use global.io set by server.js
	// In development, use global.io set by vite-plugin-socketio
	if (typeof global !== 'undefined' && (global as any).io) {
		return (global as any).io;
	}

	if (!io) {
		throw new Error('[Socket.IO] Server not initialized');
	}
	return io;
}

/**
 * Send notification to user(s)
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
	console.log('[sendNotification] Called with payload:', payload);
	let socketIO: SocketIOServer | null = null;

	try {
		socketIO = getSocketIO();
		console.log('[sendNotification] Socket.IO available');
	} catch (error) {
		console.warn('[sendNotification] Socket.IO not initialized, will save to database only');
		logger.warn('[Socket.IO] Server not initialized, will save to database only');
	}

	try {
		// Determine target users
		let targetUserIds: number[] = [];

		if (payload.broadcast) {
			// Get all user IDs from database
			console.log('[sendNotification] Fetching all user IDs for broadcast');
			const allUsers = await db.select({ id: users.id }).from(users);
			targetUserIds = allUsers.map((u) => u.id);
			console.log(`[sendNotification] Broadcasting to ${targetUserIds.length} users`);

			// Note: We don't emit a general broadcast here because we'll send
			// individual notifications to each user below (which includes Socket.IO emit)

			// Continue to save to database for all users
		} else if (payload.userId) {
			targetUserIds = [payload.userId];
		} else if (payload.userIds) {
			targetUserIds = payload.userIds;
		} else if (payload.groupId) {
			// TODO: Implement group notification
			logger.warn('[Socket.IO] Group notifications not yet implemented');
			console.log('[sendNotification] Group notifications not yet implemented');
			return;
		}

		// Check if we have valid target users
		if (targetUserIds.length === 0) {
			logger.warn('[Socket.IO] No target users specified for notification');
			console.log('[sendNotification] No target users specified');
			return;
		}

		console.log('[sendNotification] Target user IDs:', targetUserIds);

		// Save notifications to database and emit to users
		for (const userId of targetUserIds) {
			console.log('[sendNotification] Processing notification for user:', userId);

			// Convert string to i18n object if needed (backward compatibility)
			const normalizeContent = (content: string | I18nContent): I18nContent => {
				if (typeof content === 'string') {
					return { hu: content, en: content };
				}
				return content;
			};

			const notification: NewNotification = {
				userId,
				appName: payload.appName || null,
				title: normalizeContent(payload.title) as any,
				message: normalizeContent(payload.message) as any,
				details: payload.details ? (normalizeContent(payload.details) as any) : null,
				type: payload.type || 'info',
				data: payload.data || null
			};

			console.log('[sendNotification] Creating notification in DB:', notification);
			const saved = await notificationRepository.create(notification);
			console.log('[sendNotification] Notification saved to DB:', saved);

			// Emit to user's room (only if Socket.IO is available)
			if (socketIO) {
				socketIO.to(`user:${userId}`).emit('notification:new', {
					id: saved.id,
					userId: saved.userId,
					title: saved.title,
					message: saved.message,
					details: saved.details,
					type: saved.type,
					appName: saved.appName,
					data: saved.data,
					isRead: saved.isRead,
					createdAt: saved.createdAt,
					readAt: saved.readAt
				});

				// Update unread count
				const unreadCount = await notificationRepository.getUnreadCount(userId);
				socketIO.to(`user:${userId}`).emit('notification:unread-count', unreadCount);
			}

			logger.info(`[Socket.IO] Notification sent to user: ${userId}`);
		}
	} catch (error) {
		console.error('[sendNotification] Error:', error);
		logger.error('[Socket.IO] Error sending notification:', { context: { error: String(error) } });
		throw error;
	}
}
