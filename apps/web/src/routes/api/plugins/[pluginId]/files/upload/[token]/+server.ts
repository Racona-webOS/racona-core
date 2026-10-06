/**
 * Plugin fájl feltöltése aláírt linkkel
 *
 * POST /api/plugins/:pluginId/files/upload/:token
 *
 * A linket a plugin szerverfüggvénye kéri (`context.files.createUploadUrl`),
 * miután eldöntötte, hogy a felhasználó feltölthet-e. A törzs a nyers fájl
 * (nem base64, nem multipart), az eredeti név az `X-File-Name` fejlécben
 * (URI-kódolva). A fájl claim nélkül jön létre: a plugin a válaszban kapott
 * `fileId`-t a saját adataihoz köti (`context.files.claim`).
 * Lásd: .kiro/specs/plugin-file-storage (5. követelmény).
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkPluginFileAccess, decodeFileNameHeader } from '$lib/server/plugins/files/access';
import { PluginFileError, httpStatusForFileError } from '$lib/server/plugins/files/errors';
import { storePluginFile } from '$lib/server/plugins/files/service';
import { verifyToken } from '$lib/server/plugins/files/tokens';

function fail(status: number, error: string, code?: string): Response {
	return json({ error, ...(code ? { code } : {}) }, { status });
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { pluginId, token } = params;

	const userId = Number(locals.user?.id);
	if (!Number.isInteger(userId) || userId <= 0) {
		return fail(401, 'Unauthorized');
	}

	const payload = verifyToken(token, 'u');
	if (!payload || payload.p !== pluginId || payload.u !== userId) {
		return fail(403, 'Invalid or expired upload link', 'INVALID_TOKEN');
	}

	const access = await checkPluginFileAccess(pluginId);
	if (access === 'not_found') return fail(404, 'Plugin not found');
	if (access !== 'ok') return fail(403, 'Plugin cannot store files', 'PERMISSION_DENIED');

	const declaredLength = Number(request.headers.get('content-length'));
	if (Number.isFinite(declaredLength) && declaredLength > payload.s) {
		return fail(413, `File is larger than ${payload.s} bytes`, 'FILE_TOO_LARGE');
	}
	if (!request.body) {
		return fail(400, 'Empty request body', 'INVALID_INPUT');
	}

	try {
		const file = await storePluginFile({
			pluginId,
			source: request.body,
			fileName: decodeFileNameHeader(request.headers.get('x-file-name')),
			allowedMimeTypes: payload.m,
			maxBytes: payload.s,
			ref: payload.r,
			createdBy: userId,
			claimed: false
		});
		return json({
			fileId: file.id,
			originalName: file.originalName,
			mimeType: file.mimeType,
			size: Number(file.size)
		});
	} catch (err) {
		if (err instanceof PluginFileError) {
			return fail(httpStatusForFileError(err.code), err.message, err.code);
		}
		console.error(`[PluginFiles] Upload failed for ${pluginId}:`, err);
		return fail(500, 'Upload failed', 'STORAGE_ERROR');
	}
};
