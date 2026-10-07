/**
 * Plugin súgó fájlok kiszolgálása
 *
 * GET /api/plugins/:pluginId/help/*
 *
 * A plugin csomag help/ mappájából markdown oldalakat és képeket ad vissza,
 * csak olyan felhasználónak, aki a plugint is elérheti.
 */

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
	canAccessPluginHelp,
	PLUGIN_HELP_MIME_TYPES,
	resolvePluginHelpFile
} from '$lib/server/plugins/help/pluginHelp';

export const GET: RequestHandler = async ({ params, locals, request }) => {
	if (!locals.user?.id) throw error(401, 'Unauthorized');

	const { pluginId, path: filePath } = params;
	if (!(await canAccessPluginHelp(parseInt(locals.user.id), pluginId))) {
		throw error(404, 'Help not found');
	}

	const resolved = resolvePluginHelpFile(pluginId, filePath);
	if (!resolved) throw error(404, 'Help not found');

	let info;
	try {
		info = await stat(resolved);
	} catch {
		throw error(404, 'Help not found');
	}
	if (!info.isFile()) throw error(404, 'Help not found');

	// A plugin frissítésekor változhat a tartalom: ETag-gel újraérvényesítünk
	const etag = `W/"${info.size}-${info.mtimeMs}"`;
	const headers = new Headers({
		'Content-Type': PLUGIN_HELP_MIME_TYPES[path.extname(resolved).toLowerCase()],
		'Cache-Control': 'private, no-cache',
		ETag: etag,
		'X-Content-Type-Options': 'nosniff',
		// Az SVG-ben lévő szkript ne fusson, ha valaki közvetlenül megnyitja
		'Content-Security-Policy':
			"default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox"
	});

	if (request.headers.get('if-none-match') === etag) {
		return new Response(null, { status: 304, headers });
	}

	return new Response(await readFile(resolved), { status: 200, headers });
};
