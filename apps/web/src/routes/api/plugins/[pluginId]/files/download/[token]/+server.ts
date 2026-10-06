/**
 * Plugin fájl letöltése aláírt linkkel
 *
 * GET /api/plugins/:pluginId/files/download/:token
 *
 * A linket a plugin szerverfüggvénye kéri (`context.files.createDownloadUrl`),
 * miután eldöntötte, hogy a felhasználó láthatja-e a fájlt. A link rövid
 * életű és a felhasználóhoz kötött. A fájl streamelve megy, gyorsítótár nélkül.
 * Lásd: .kiro/specs/plugin-file-storage (6. követelmény).
 */

import { Readable } from 'stream';
import type { RequestHandler } from './$types';
import { checkPluginFileAccess, contentDisposition } from '$lib/server/plugins/files/access';
import { findPluginFile } from '$lib/server/plugins/files/repository';
import { openStoredFile } from '$lib/server/plugins/files/storage';
import { verifyToken } from '$lib/server/plugins/files/tokens';

function fail(status: number, error: string): Response {
	return new Response(JSON.stringify({ error }), {
		status,
		headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	});
}

export const GET: RequestHandler = async ({ params, locals }) => {
	const { pluginId, token } = params;

	const userId = Number(locals.user?.id);
	if (!Number.isInteger(userId) || userId <= 0) {
		return fail(401, 'Unauthorized');
	}

	const payload = verifyToken(token, 'd');
	if (!payload || payload.p !== pluginId || payload.u !== userId) {
		return fail(403, 'Invalid or expired download link');
	}

	const access = await checkPluginFileAccess(pluginId);
	if (access === 'not_found') return fail(404, 'Plugin not found');
	if (access !== 'ok') return fail(403, 'Plugin cannot store files');

	const file = await findPluginFile(pluginId, payload.f);
	if (!file) return fail(404, 'File not found');

	const opened = await openStoredFile(file.storagePath);
	if (!opened) {
		console.error(`[PluginFiles] File missing on disk: ${file.storagePath}`);
		return fail(404, 'File not found');
	}

	return new Response(Readable.toWeb(opened.stream) as ReadableStream<Uint8Array>, {
		status: 200,
		headers: {
			'Content-Type': file.mimeType,
			'Content-Length': String(opened.size),
			'Content-Disposition': contentDisposition(payload.d, file.originalName),
			'Cache-Control': 'private, no-store',
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
