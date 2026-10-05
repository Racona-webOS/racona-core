import { Server as SocketIOServer, type Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { notificationRepository } from '$lib/server/database/repositories';
import { chatRepository } from '$lib/server/database/repositories/chatRepository';
import type { NewNotification, Notification } from '@racona/database';
import { logger } from '$lib/server/logging';
import db from '$lib/server/database';
import { users } from '@racona/database/schemas';
import { auth } from '$lib/auth';

let io: SocketIOServer | null = null;

// A példányon jelöljük az inicializálást, hogy dev HMR modul-újratöltéskor se kerüljenek fel
// duplán a middleware-ek és handlerek ugyanarra a global.io-ra
const INITIALIZED: unique symbol = Symbol.for('racona.socketio.initialized');
type MarkedSocketIOServer = SocketIOServer & { [INITIALIZED]?: boolean };

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
 * Socket.IO auth middleware.
 * A handshake cookie-jaiból oldja fel a Better Auth sessiont (ugyanúgy, mint a hooks.server.ts
 * a locals.user-t), és a felhasználó azonosítóját a socket.data.userId-ba teszi. Session nélkül
 * a kapcsolatot elutasítja — a kliens által küldött userId-ban soha nem bízunk.
 */
async function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
	try {
		const headers = new Headers();
		const cookie = socket.request.headers.cookie;
		if (cookie) headers.set('cookie', cookie);

		// disableRefresh: request kontextuson kívül vagyunk, a sveltekitCookies plugin nem tudna
		// frissített session cookie-t visszaírni (getRequestEvent() itt nem elérhető)
		const session = await auth.api.getSession({ headers, query: { disableRefresh: true } });
		const userId = session ? parseInt(session.user.id) : NaN;

		if (!Number.isInteger(userId)) {
			return next(new Error('Unauthorized'));
		}

		socket.data.userId = userId;
		next();
	} catch (error) {
		// Érvénytelen/lejárt session esetén a Better Auth cookie-t törölne, ami request kontextus
		// híján kivételt dob — ez is hitelesítetlen kapcsolat
		logger.warn(`[Socket.IO] Authentication failed: ${socket.id}`, {
			context: { error: String(error) }
		});
		next(new Error('Unauthorized'));
	}
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

	if (serverOrIo instanceof SocketIOServer && (serverOrIo as MarkedSocketIOServer)[INITIALIZED]) {
		io = serverOrIo;
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

	// Minden kapcsolatnak át kell mennie a session alapú hitelesítésen
	io.use(authenticateSocket);

	io.on('connection', (socket) => {
		// Az auth middleware állította be — ez az egyetlen megbízható felhasználó azonosító
		const userId: number = socket.data.userId;
		const userIdStr = String(userId);

		logger.info(`[Socket.IO] Client connected: ${socket.id} (user: ${userId})`);

		// Felhasználó regisztrálása — a payload csak visszafelé kompatibilitás miatt érkezik,
		// a szobát mindig a session szerinti felhasználó kapja
		socket.on('register', (claimedUserId?: string | number) => {
			if (claimedUserId !== undefined && String(claimedUserId) !== userIdStr) {
				logger.warn(
					`[Socket.IO] Register userId mismatch: claimed ${claimedUserId}, session ${userId} (socket: ${socket.id})`
				);
			}

			if (!userSockets.has(userIdStr)) {
				userSockets.set(userIdStr, new Set());
			}
			userSockets.get(userIdStr)!.add(socket.id);
			socket.join(`user:${userId}`);

			const wasOffline = !onlineUsers.has(userIdStr);
			onlineUsers.add(userIdStr);

			logger.info(`[Socket.IO] User registered: ${userId} (socket: ${socket.id})`);

			// Olvasatlan értesítések száma
			notificationRepository.getUnreadCount(userId).then((count) => {
				socket.emit('notification:unread-count', count);
			});

			// Online státusz broadcast
			if (wasOffline) {
				io!.emit('chat:user-online', userId);
			}

			// Online felhasználók listája az újonnan csatlakozónak
			socket.emit('chat:online-users', Array.from(onlineUsers));
		});

		// Kapcsolat bontása
		socket.on('disconnect', () => {
			logger.info(`[Socket.IO] Client disconnected: ${socket.id}`);

			const sockets = userSockets.get(userIdStr);
			if (!sockets?.delete(socket.id)) return;

			if (sockets.size === 0) {
				userSockets.delete(userIdStr);
				onlineUsers.delete(userIdStr);
				io!.emit('chat:user-offline', userId);
			}
			logger.info(`[Socket.IO] User unregistered: ${userId} (socket: ${socket.id})`);
		});

		// Értesítés olvasottnak jelölése — csak a saját értesítését jelölheti
		socket.on('notification:mark-read', async (notificationId: number) => {
			try {
				await notificationRepository.markAsReadForUser(Number(notificationId), userId);
				logger.info(`[Socket.IO] Notification marked as read: ${notificationId}`);
			} catch (error) {
				logger.error('[Socket.IO] Error marking notification as read:', {
					context: { error: String(error) }
				});
			}
		});

		// Összes értesítés olvasottnak jelölése — a payload userId-t figyelmen kívül hagyjuk
		socket.on('notification:mark-all-read', async () => {
			try {
				await notificationRepository.markAllAsRead(userId);
				socket.emit('notification:unread-count', 0);
				logger.info(`[Socket.IO] All notifications marked as read for user: ${userId}`);
			} catch (error) {
				logger.error('[Socket.IO] Error marking all notifications as read:', {
					context: { error: String(error) }
				});
			}
		});

		// Chat: az új üzeneteket a sendMessage remote függvény kézbesíti szerver oldalon
		// (emitChatMessage) — kliens által relayelt üzenetet nem továbbítunk

		// Chat: üzenet olvasottnak jelölése
		socket.on('chat:mark-read', (conversationId: string) => {
			logger.info(`[Socket.IO] Messages marked as read in conversation ${conversationId}`);
		});

		// Beszélgetés → másik résztvevő, csak az ellenőrzött beszélgetések (socketenként)
		const conversationPartners = new Map<number, number>();

		// Chat: gépelés jelző — a címzett a beszélgetés másik résztvevője, nem a payload recipientId-ja
		socket.on(
			'chat:typing',
			async (data: { recipientId: number; conversationId: number; isTyping: boolean }) => {
				try {
					const conversationId = Number(data?.conversationId);
					let partnerId = conversationPartners.get(conversationId);

					if (partnerId === undefined) {
						if (!Number.isInteger(conversationId)) return;
						const conversation = await chatRepository.getConversationById(conversationId);
						if (!conversation) return;
						if (conversation.participant1Id === userId) partnerId = conversation.participant2Id;
						else if (conversation.participant2Id === userId)
							partnerId = conversation.participant1Id;
						else return;
						conversationPartners.set(conversationId, partnerId);
					}

					io!.to(`user:${partnerId}`).emit('chat:user-typing', {
						conversationId,
						isTyping: Boolean(data.isTyping)
					});
				} catch (error) {
					logger.error('[Socket.IO] Error relaying typing indicator:', {
						context: { error: String(error) }
					});
				}
			}
		);
	});

	(io as MarkedSocketIOServer)[INITIALIZED] = true;

	// Az inicializálás előtt csatlakozott socketek nem mentek át az auth middleware-en és handlerük
	// sincs — a transport bontásával a kliens automatikusan újracsatlakozik, immár hitelesítve
	for (const socket of io.of('/').sockets.values()) {
		socket.conn.close();
	}

	logger.info('[Socket.IO] Server initialized');
	return io;
}

/**
 * Chat üzenet valós idejű kézbesítése a címzett szobájába.
 * A sendMessage remote függvény hívja a mentett üzenettel, így a feladó a sessionből jön.
 */
export function emitChatMessage(
	recipientId: number,
	payload: { message: unknown; conversationId: number }
): void {
	try {
		getSocketIO().to(`user:${recipientId}`).emit('chat:new-message', payload);
	} catch {
		// Socket.IO nélkül (pl. dev) a címzett a következő betöltéskor látja az üzenetet
		logger.warn('[Socket.IO] Server not initialized, chat message not delivered in real time');
	}
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
 * @returns A mentett értesítések (címzettenként egy); csoport célzásnál vagy címzett nélkül üres
 */
export async function sendNotification(payload: NotificationPayload): Promise<Notification[]> {
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
			return [];
		}

		// Check if we have valid target users
		if (targetUserIds.length === 0) {
			logger.warn('[Socket.IO] No target users specified for notification');
			console.log('[sendNotification] No target users specified');
			return [];
		}

		console.log('[sendNotification] Target user IDs:', targetUserIds);

		const savedNotifications: Notification[] = [];

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
			savedNotifications.push(saved);

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

		return savedNotifications;
	} catch (error) {
		console.error('[sendNotification] Error:', error);
		logger.error('[Socket.IO] Error sending notification:', { context: { error: String(error) } });
		throw error;
	}
}
