import { handler } from './build/handler.js';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();

// Disable X-Powered-By header
app.disable('x-powered-by');

const server = createServer(app);

// Socket.IO inicializálása — az event handlerek a SvelteKit build-ben vannak (src/lib/server/socket/index.ts)
// A global.io-n keresztül érhető el a SvelteKit kódból
const io = new SocketIOServer(server, {
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

// global.io beállítása, hogy a SvelteKit kód (initializeSocketIO) elérje
global.io = io;

// SvelteKit handler (ez inicializálja a Socket.IO event handlereket a hooks.server.ts-en keresztül)
app.use(handler);

const port = process.env.PORT || 3000;
server.listen(port, () => {
	console.log(`[Server] Listening on port ${port}`);
	console.log(`[Socket.IO] WebSocket server ready`);
});
