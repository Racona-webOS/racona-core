/**
 * Files List API Route - Fájlok listázása kategória és scope alapján
 *
 * Route: /api/files/list?category=backgrounds&scope=user&type=image
 */

import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/index';
import { readdir } from 'fs/promises';
import path from 'path';
import { getUploadsPath, STORAGE_CONFIG } from '$lib/server/storage/types';
import { THUMBNAIL_PREFIX } from '$lib/server/storage/stored-file';

/** A `type` almappa neve (pl. image, video); útvonal-elem nem lehet. */
const TYPE_PATTERN = /^[a-z0-9-]+$/;

function errorResponse(message: string, status: number): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

export const GET: RequestHandler = async ({ url, request }) => {
	try {
		// Session ellenőrzés
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session) {
			return errorResponse('Unauthorized', 401);
		}

		const userId = session.user.id;
		const category = url.searchParams.get('category');
		const scope = url.searchParams.get('scope');
		const type = url.searchParams.get('type'); // image vagy video (opcionális, shared scope-nál)

		if (!category) {
			return errorResponse('Category is required', 400);
		}

		// Csak a core kategóriái listázhatók (pl. a plugin fájlok és a plugin kód nem)
		if (!(STORAGE_CONFIG.allowedCategories as readonly string[]).includes(category)) {
			return errorResponse('Invalid category', 400);
		}

		if (type !== null && !TYPE_PATTERN.test(type)) {
			return errorResponse('Invalid type', 400);
		}

		if (!scope || (scope !== 'shared' && scope !== 'user')) {
			return errorResponse('Invalid scope', 400);
		}

		// Útvonal összeállítása
		const uploadsPath = getUploadsPath();
		let dirPath: string;

		if (scope === 'shared') {
			// Shared esetén lehet almappa (image/video)
			dirPath = type
				? path.join(uploadsPath, category, 'shared', type)
				: path.join(uploadsPath, category, 'shared');
		} else {
			// User scope esetén nincs almappa
			dirPath = path.join(uploadsPath, category, `user-${userId}`);
		}

		try {
			const entries = await readdir(dirPath, { withFileTypes: true });
			// A bélyegképek (thumb-*) a fő fájlhoz tartoznak, nem önálló fájlok
			const files = entries
				.filter((entry) => entry.isFile() && !entry.name.startsWith(THUMBNAIL_PREFIX))
				.map((entry) => ({
					filename: entry.name
				}));

			return new Response(JSON.stringify({ files }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (error) {
			// Ha a mappa nem létezik, üres listát adunk vissza
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return new Response(JSON.stringify({ files: [] }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			throw error;
		}
	} catch (error) {
		console.error('[Files List API] Error:', error);
		return errorResponse('Internal server error', 500);
	}
};
