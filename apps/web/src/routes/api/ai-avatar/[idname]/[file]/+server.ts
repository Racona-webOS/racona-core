/**
 * AI Avatar fájl kiszolgáló API végpont
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 *
 * Route: /api/ai-avatar/[idname]/[file]
 * - Session ellenőrzés (csak bejelentkezett felhasználók)
 * - Path traversal védelem
 * - Fájl kiszolgálás helyes Content-Type header-rel
 */

import type { RequestHandler } from './$types';
import { readFile } from 'fs/promises';
import path from 'path';
import { auth } from '$lib/auth/index';
import { readFromFileSystem, validatePath } from '$lib/server/storage/filesystem';
import { StorageError, getHttpStatusForError } from '$lib/server/storage/types';

// ============================================================================
// Content-Type meghatározás
// ============================================================================

/**
 * MIME típus meghatározása fájlkiterjesztés alapján
 * Csak az avatar rendszer által használt típusokat kezeli
 */
function getAvatarMimeType(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase() ?? '';

	switch (ext) {
		case 'glb':
			return 'model/gltf-binary';
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg';
		default:
			return 'application/octet-stream';
	}
}

/**
 * Az image-be épített avatarok (a seedben szereplő „default”) mappája. Dockerben az
 * uploads egy külső kötet, amibe ezek a fájlok nem kerülnek be, ezért innen is keressük.
 */
const BUNDLED_AVATARS_DIR = path.join(process.cwd(), 'defaults', 'ai-avatar');

async function readBundledAvatarFile(idname: string, file: string): Promise<Buffer | null> {
	try {
		return await readFile(path.join(BUNDLED_AVATARS_DIR, idname, file));
	} catch {
		return null;
	}
}

// ============================================================================
// GET handler
// ============================================================================

/**
 * GET /api/ai-avatar/[idname]/[file]
 * Avatar fájl kiszolgálása hitelesített felhasználóknak
 */
export const GET: RequestHandler = async ({ params, request }) => {
	// 1. Session ellenőrzés (Requirements: 8.3, 8.4)
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const { idname, file } = params;

	// 2. Paraméter validálás
	if (!idname || !file) {
		return new Response(JSON.stringify({ error: 'Hiányzó paraméter' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// 3. Path traversal védelem (Requirements: 8.5)
	// Az idname és file paramétereket külön-külön is ellenőrizzük
	if (!validatePath(idname) || !validatePath(file)) {
		return new Response(JSON.stringify({ error: 'Érvénytelen útvonal' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Összetett útvonal ellenőrzése
	const relativePath = `ai-avatar/${idname}/${file}`;
	if (!validatePath(relativePath)) {
		return new Response(JSON.stringify({ error: 'Érvénytelen útvonal' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// 4. Fájl beolvasása (Requirements: 8.5)
	let fileBuffer: Buffer;
	try {
		fileBuffer = await readFromFileSystem(relativePath);
	} catch (error) {
		// Ha az uploads-ban nincs, az image-be épített avatar fájlja
		const bundled =
			error instanceof StorageError && error.code === 'FILE_NOT_FOUND'
				? await readBundledAvatarFile(idname, file)
				: null;
		if (bundled) {
			fileBuffer = bundled;
		} else if (error instanceof StorageError) {
			return new Response(JSON.stringify({ error: error.message }), {
				status: getHttpStatusForError(error.code),
				headers: { 'Content-Type': 'application/json' }
			});
		} else {
			console.error('[AI Avatar API] Váratlan hiba:', error);
			return new Response(JSON.stringify({ error: 'Belső szerverhiba' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	// 5. Content-Type meghatározása és válasz küldése (Requirements: 8.5, 8.6)
	const contentType = getAvatarMimeType(file);

	return new Response(new Uint8Array(fileBuffer), {
		status: 200,
		headers: {
			'Content-Type': contentType,
			'Content-Length': fileBuffer.length.toString(),
			'Cache-Control': 'private, max-age=3600',
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
