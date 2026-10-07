// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Server as SocketIOServer } from 'socket.io';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: import('better-auth').User | null;
			session: import('better-auth').Session | null;
			settings: import('$lib/types/settings').UserSettings;
			locale: string;
		}
		// interface PageData {}
		/** Mobil keret navigációja a böngészőelőzményben (a vissza gesztus ezen lép vissza) */
		interface PageState {
			/** A teljes képernyőn mutatott app ablakának azonosítója */
			mobileWindowId?: string;
			/** Megnyitott mobil panel (értesítések, megnyitott appok, profil) */
			mobilePanel?: 'notifications' | 'apps' | 'profile';
		}
		// interface Platform {}
	}

	// Global Socket.IO instance for production server
	var io: SocketIOServer | undefined;

	/** A Racona verziója (a gyökér package.json-ból, a vite.config.ts define-olja) */
	const __RACONA_VERSION__: string;
}

export {};
