/**
 * Files API Route - Fájlok biztonságos kiszolgálása
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 *
 * Route: /api/files/[...path]
 * - Session ellenőrzés
 * - Jogosultság ellenőrzés (shared vs user scope)
 * - Fájl kiszolgálás a tárolt MIME típussal (aktív tartalom soha nem a saját típusával)
 * - Cache-Control: private (minden fájl bejelentkezéshez kötött)
 */

import type { RequestHandler } from './$types';
import { auth } from '$lib/auth/index';
import { readFromFileSystem, validatePath } from '$lib/server/storage/filesystem';
import { StorageError, STORAGE_CONFIG, getHttpStatusForError } from '$lib/server/storage/types';
import { fileRepository } from '$lib/server/storage/file-repository';
import {
	resolveFileResponseType,
	buildContentDisposition
} from '$lib/server/storage/content-type';
import { PLUGIN_FILES_DIR_NAME } from '$lib/server/plugins/files/config';

/**
 * Parse the path to extract category, scope, and filename
 * Expected format: {category}/{scope}/{filename}
 * Where scope is either "shared" or "user-{userId}"
 */
function parsePath(pathSegments: string[]): {
	category: string;
	scope: 'shared' | 'user';
	scopeUserId: number | null;
	filename: string;
	storagePath: string;
} | null {
	// Minimum 3 segments required: category, scope, filename
	if (pathSegments.length < 3) {
		return null;
	}

	const category = pathSegments[0];
	const scopeSegment = pathSegments[1];
	const filename = pathSegments.slice(2).join('/'); // Support nested filenames

	// Determine scope and userId from scope segment
	let scope: 'shared' | 'user';
	let scopeUserId: number | null = null;

	if (scopeSegment === 'shared') {
		scope = 'shared';
	} else if (scopeSegment.startsWith('user-')) {
		scope = 'user';
		const userIdStr = scopeSegment.slice(5); // Remove "user-" prefix
		scopeUserId = parseInt(userIdStr, 10);
		if (isNaN(scopeUserId)) {
			return null;
		}
	} else {
		return null;
	}

	// Construct storage path
	const storagePath = pathSegments.join('/');

	return {
		category,
		scope,
		scopeUserId,
		filename,
		storagePath
	};
}

/**
 * Create an error response with JSON body
 */
function errorResponse(message: string, status: number): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

/**
 * GET /api/files/[...path] - Serve a file
 */
export const GET: RequestHandler = async ({ params, request }) => {
	try {
		// 1. Session ellenőrzés (Requirements: 6.2, 6.3)
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session) {
			return errorResponse('Unauthorized', 401);
		}

		const userId = parseInt(session.user.id, 10);

		// 2. Path parsing és validálás
		const pathSegments = params.path?.split('/') ?? [];

		if (pathSegments.length === 0) {
			return errorResponse('Invalid path', 400);
		}

		// A plugin fájlokat csak a plugin által kiadott, aláírt link szolgálja ki
		// (/api/plugins/:pluginId/files/download/:token)
		if (pathSegments[0] === PLUGIN_FILES_DIR_NAME) {
			return errorResponse('File not found', 404);
		}

		const parsedPath = parsePath(pathSegments);

		if (!parsedPath) {
			return errorResponse('Invalid path format', 400);
		}

		const { scope, scopeUserId, storagePath } = parsedPath;

		// 3. Path traversal védelem (Requirements: 8.1)
		if (!validatePath(storagePath)) {
			return errorResponse('Invalid path', 400);
		}

		// 4. Jogosultság ellenőrzés (Requirements: 6.4, 6.5)
		// - Shared fájlok: bármely bejelentkezett felhasználó elérheti
		// - User fájlok: csak a tulajdonos érheti el
		// - Kivétel: avatars kategória esetén bármely bejelentkezett felhasználó elérheti
		if (scope === 'user' && scopeUserId !== userId) {
			// Avatars esetén engedjük a hozzáférést bármely bejelentkezett felhasználónak
			if (parsedPath.category !== 'avatars') {
				return errorResponse('Permission denied', 403);
			}
		}

		// 5. Fájl olvasása a fájlrendszerből
		let fileBuffer: Buffer;
		try {
			fileBuffer = await readFromFileSystem(storagePath);
		} catch (error) {
			if (error instanceof StorageError) {
				return errorResponse(error.message, getHttpStatusForError(error.code));
			}
			throw error;
		}

		// 6. MIME típus: a feltöltéskor detektált, tárolt típus (platform.files);
		// rekord nélküli fájlnál (pl. bemásolt közös hátterek) a kiterjesztés alapján
		let storedMimeType: string | null = null;
		try {
			const record = await fileRepository.findRawByPath(storagePath);
			storedMimeType = record?.mimeType ?? null;
		} catch (error) {
			console.warn('[Files API] MIME lookup failed, falling back to extension:', error);
		}

		const { contentType, disposition } = resolveFileResponseType(storedMimeType, storagePath);

		// 7. Response összeállítása (Requirements: 6.6, 6.7)
		// Convert Buffer to Uint8Array for Response compatibility
		const responseBody = new Uint8Array(fileBuffer);

		return new Response(responseBody, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Content-Length': fileBuffer.length.toString(),
				'Content-Disposition': buildContentDisposition(
					disposition,
					pathSegments[pathSegments.length - 1]
				),
				// Bejelentkezéshez kötött tartalom: megosztott (proxy/CDN) cache nem tárolhatja
				'Cache-Control': `private, max-age=${STORAGE_CONFIG.cacheMaxAge}`,
				Vary: 'Cookie',
				'X-Content-Type-Options': 'nosniff'
			}
		});
	} catch (error) {
		console.error('[Files API] Unexpected error:', error);

		if (error instanceof StorageError) {
			return errorResponse(error.message, getHttpStatusForError(error.code));
		}

		return errorResponse('Internal server error', 500);
	}
};
