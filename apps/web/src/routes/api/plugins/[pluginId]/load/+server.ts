/**
 * Plugin Load API Endpoint
 *
 * GET /api/plugins/:pluginId/load
 *
 * Betölti a plugin komponenst és visszaadja a JavaScript kódot.
 */

import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pluginLoader } from '$lib/server/plugins/loader/PluginLoader';
import { getPluginDir } from '$lib/server/plugins/utils/filesystem';
import path from 'path';
import fs from 'fs/promises';

export const GET: RequestHandler = async ({ params, locals }) => {
	// Authentication is handled by hooks.server.ts for all /api/plugins/* routes
	const { pluginId } = params;

	try {
		console.log(`[API] Loading plugin: ${pluginId}`);

		// 1. Plugin ellenőrzés az adatbázisban
		const { apps } = await import('@racona/database');
		const { eq } = await import('drizzle-orm');
		const db = (await import('$lib/server/database')).default;

		const result = await db
			.select({
				appType: apps.appType,
				pluginStatus: apps.pluginStatus
			})
			.from(apps)
			.where(eq(apps.appId, pluginId))
			.limit(1);

		if (result.length === 0) {
			throw error(404, 'Plugin not found');
		}

		if (result[0].appType !== 'plugin') {
			throw error(400, 'Not a plugin');
		}

		if (result[0].pluginStatus !== 'active') {
			throw error(400, 'Plugin is not active');
		}

		// 2. Plugin fájlok elérési útja
		const pluginDir = getPluginDir(pluginId);
		const manifestPath = path.join(pluginDir, 'manifest.json');

		// 3. Manifest beolvasása
		const manifestContent = await fs.readFile(manifestPath, 'utf-8');
		const manifest = JSON.parse(manifestContent);

		// 4. Entry point fájl beolvasása
		const entryPath = path.join(pluginDir, manifest.entry);

		console.log(`[API] Reading plugin entry point: ${entryPath}`);

		const componentCode = await fs.readFile(entryPath, 'utf-8');

		console.log(
			`[API] Successfully loaded plugin ${pluginId}, code length: ${componentCode.length}`
		);

		// 5. JavaScript kód visszaadása
		return new Response(componentCode, {
			headers: {
				'Content-Type': 'application/javascript; charset=utf-8',
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Access-Control-Allow-Origin': '*'
			}
		});
	} catch (err) {
		console.error(`[API] Failed to load plugin ${pluginId}:`, err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(
			500,
			`Failed to load plugin: ${err instanceof Error ? err.message : 'Unknown error'}`
		);
	}
};
