import type { Plugin, ViteDevServer } from 'vite';
import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

/**
 * Dev módban a Vite HTTP szerverére csatolja a Socket.IO-t és global.io-ként elérhetővé teszi —
 * ugyanúgy, mint a production server.js. Az auth middleware és az event handlerek a SvelteKit
 * oldalon (src/lib/server/socket/index.ts) kerülnek fel a hooks.server.ts-en keresztül, így dev
 * és prod ugyanazt a (session alapú) hitelesítést használja.
 */
export function socketIOPlugin(): Plugin {
	return {
		name: 'vite-plugin-socketio',
		configureServer(server: ViteDevServer) {
			if (!server.httpServer) return;

			try {
				const io = new SocketIOServer(server.httpServer as HTTPServer, {
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

				// global.io beállítása, hogy a SvelteKit kód (initializeSocketIO) elérje
				(global as any).io = io;

				console.log('[Socket.IO] Plugin initialized on Vite dev server');
			} catch (error) {
				console.error('[Socket.IO] Failed to initialize plugin:', error);
			}
		}
	};
}
