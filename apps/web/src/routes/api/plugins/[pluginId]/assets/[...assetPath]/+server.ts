/**
 * Asset Service Endpoint
 *
 * GET /api/plugins/:pluginId/assets/*
 *
 * Task 9.10: Plugin asset fájlok kiszolgálása
 * Property 30: URL formátum helyes
 */

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PluginErrorCode } from '@racona/database';
import db from '$lib/server/database';
import { apps } from '@racona/database';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

// Egyszerű MIME type mapping
const MIME_TYPES: Record<string, string> = {
	'.html': 'text/html',
	'.css': 'text/css',
	'.js': 'application/javascript',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.webp': 'image/webp',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.eot': 'application/vnd.ms-fontobject'
};

function getMimeType(filePath: string): string {
	const ext = path.extname(filePath).toLowerCase();
	return MIME_TYPES[ext] || 'application/octet-stream';
}

export const GET: RequestHandler = async ({ params, locals }) => {
	// Authentication is handled by hooks.server.ts for all /api/plugins/* routes
	const { pluginId, assetPath } = params;

	try {
		// Plugin ellenőrzés
		const pluginResult = await db
			.select({ pluginStatus: apps.pluginStatus, appType: apps.appType })
			.from(apps)
			.where(eq(apps.appId, pluginId))
			.limit(1);

		if (pluginResult.length === 0) {
			throw error(404, `${PluginErrorCode.PLUGIN_NOT_FOUND}: Plugin not found`);
		}

		if (pluginResult[0].appType !== 'plugin') {
			throw error(400, 'Not a plugin application');
		}

		// Path traversal védelem
		const sanitizedPath = sanitizeAssetPath(assetPath);

		// Asset fájl útvonala
		const pluginDir = path.join(process.cwd(), 'uploads', 'plugins', pluginId);
		const assetFilePath = path.join(pluginDir, 'assets', sanitizedPath);

		// Ellenőrizzük, hogy a fájl a plugin assets könyvtárában van-e
		const assetsDir = path.join(pluginDir, 'assets');
		const resolvedPath = path.resolve(assetFilePath);
		const resolvedAssetsDir = path.resolve(assetsDir);

		if (!resolvedPath.startsWith(resolvedAssetsDir)) {
			throw error(403, 'Path traversal attempt detected');
		}

		// Fájl létezés ellenőrzés
		try {
			await fs.access(assetFilePath);
		} catch {
			throw error(404, 'Asset not found');
		}

		// Fájl beolvasása
		const fileBuffer = await fs.readFile(assetFilePath);

		// MIME type detektálás
		const mimeType = getMimeType(assetFilePath);

		// Cache headers beállítása (1 év)
		const headers = new Headers({
			'Content-Type': mimeType,
			'Cache-Control': 'public, max-age=31536000, immutable',
			'Content-Length': fileBuffer.length.toString()
		});

		return new Response(fileBuffer, {
			status: 200,
			headers
		});
	} catch (err) {
		console.error(`[AssetService] Error serving asset:`, err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, 'Failed to serve asset');
	}
};

/**
 * Path sanitizálás (path traversal védelem)
 */
function sanitizeAssetPath(assetPath: string): string {
	return assetPath
		.replace(/\.\./g, '') // .. eltávolítása
		.replace(/^\/+/, '') // Kezdő / eltávolítása
		.replace(/\/+/g, '/'); // Többszörös / normalizálása
}
