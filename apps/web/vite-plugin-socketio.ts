import type { Plugin, ViteDevServer } from 'vite';
import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;
const userSockets = new Map<string, Set<string>>();

export function socketIOPlugin(): Plugin {
	return {
		name: 'vite-plugin-socketio',
		configureServer(server: ViteDevServer) {
			if (!server.httpServer) return;

			try {
				// Initialize Socket.IO on Vite dev server
				io = new SocketIOServer(server.httpServer as HTTPServer, {
					cors: {
						origin: '*',
						methods: ['GET', 'POST']
					},
					path: '/socket.io/',
					// Ping/pong configuration to keep connections alive
					pingTimeout: 60000, // 60 seconds
					pingInterval: 25000, // 25 seconds
					connectTimeout: 45000,
					upgradeTimeout: 10000,
					transports: ['websocket', 'polling'],
					// A Vite HMR websocket ugyanezen a HTTP szerveren fut. Az engine.io alapból 1 s után
					// lezár minden nem neki szóló upgrade-et, ha a socketre addig "nem írtak" — Bun alatt
					// a socket.bytesWritten az upgrade után is 0, így a HMR kapcsolatot is lelőné, amire a
					// Vite kliens "server connection lost" után végtelen oldal-újratöltésbe esik.
					destroyUpgrade: false
				});

				// Import notification repository dynamically
				let notificationRepository: any;

				// Use setTimeout to avoid blocking the config load
				setTimeout(() => {
					import('./src/lib/server/database/repositories/index.js')
						.then((module) => {
							notificationRepository = module.notificationRepository;
							console.log('[Socket.IO] Notification repository loaded');
						})
						.catch((error) => {
							console.error('[Socket.IO] Failed to import notification repository:', error);
						});
				}, 1000);

				io.on('connection', (socket) => {
					console.log(`[Socket.IO] Client connected: ${socket.id}`);

					socket.on('register', async (userId: string | number) => {
						if (!userId) {
							console.warn(`[Socket.IO] Registration attempt without userId: ${socket.id}`);
							return;
						}

						const userIdStr = String(userId);
						const userIdNum = typeof userId === 'number' ? userId : parseInt(userId);

						if (!userSockets.has(userIdStr)) {
							userSockets.set(userIdStr, new Set());
						}
						userSockets.get(userIdStr)!.add(socket.id);
						socket.join(`user:${userIdNum}`);

						console.log(`[Socket.IO] User registered: ${userIdNum} (socket: ${socket.id})`);

						// Send initial unread count
						if (notificationRepository) {
							try {
								const count = await notificationRepository.getUnreadCount(userIdNum);
								socket.emit('notification:unread-count', count);
							} catch (error) {
								console.error('[Socket.IO] Error getting unread count:', error);
							}
						}
					});

					socket.on('disconnect', () => {
						console.log(`[Socket.IO] Client disconnected: ${socket.id}`);

						for (const [userId, sockets] of userSockets.entries()) {
							if (sockets.has(socket.id)) {
								sockets.delete(socket.id);
								if (sockets.size === 0) {
									userSockets.delete(userId);
								}
								console.log(`[Socket.IO] User unregistered: ${userId} (socket: ${socket.id})`);
								break;
							}
						}
					});

					socket.on('notification:mark-read', async (notificationId: number) => {
						if (!notificationRepository) return;

						try {
							await notificationRepository.markAsRead(notificationId);
							console.log(`[Socket.IO] Notification marked as read: ${notificationId}`);
						} catch (error) {
							console.error('[Socket.IO] Error marking notification as read:', error);
						}
					});

					socket.on('notification:mark-all-read', async (userId: string | number) => {
						if (!notificationRepository) return;

						try {
							const userIdNum = typeof userId === 'number' ? userId : parseInt(userId);
							await notificationRepository.markAllAsRead(userIdNum);
							socket.emit('notification:unread-count', 0);
							console.log(`[Socket.IO] All notifications marked as read for user: ${userIdNum}`);
						} catch (error) {
							console.error('[Socket.IO] Error marking all notifications as read:', error);
						}
					});
				});

				// Make io available globally
				(global as any).io = io;

				console.log('[Socket.IO] Plugin initialized on Vite dev server');
			} catch (error) {
				console.error('[Socket.IO] Failed to initialize plugin:', error);
			}
		}
	};
}

export function getSocketIO(): SocketIOServer | null {
	return io;
}
