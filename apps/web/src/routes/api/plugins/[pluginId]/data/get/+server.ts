/**
 * Data Service - Get Endpoint
 *
 * POST /api/plugins/:pluginId/data/get
 *
 * Kulcs-érték pár lekérdezése a plugin kv_store táblájából.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PluginErrorCode } from '@racona/database';
import db from '$lib/server/database';
import { apps } from '@racona/database';
import { eq, sql } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, request }) => {
	const { pluginId } = params;

	try {
		// Request body parsing
		const body = await request.json();
		const { key } = body;

		if (!key) {
			throw error(400, 'Key is required');
		}

		// Plugin ellenőrzés
		const pluginResult = await db
			.select({
				pluginStatus: apps.pluginStatus,
				appType: apps.appType,
				permissions: apps.permissions
			})
			.from(apps)
			.where(eq(apps.appId, pluginId))
			.limit(1);

		if (pluginResult.length === 0) {
			throw error(404, `${PluginErrorCode.PLUGIN_NOT_FOUND}: Plugin not found`);
		}

		if (pluginResult[0].appType !== 'plugin') {
			throw error(400, 'Not a plugin application');
		}

		if (pluginResult[0].pluginStatus !== 'active') {
			throw error(403, `${PluginErrorCode.PLUGIN_INACTIVE}: Plugin is not active`);
		}

		const permissions = (pluginResult[0].permissions as unknown as string[]) ?? [];
		if (!permissions.includes('database')) {
			throw error(
				403,
				`${PluginErrorCode.PERMISSION_DENIED}: Plugin does not have database permission`
			);
		}

		// SQL injection védelem
		if (!/^[a-z0-9-]+$/.test(pluginId)) {
			throw error(400, 'Invalid plugin ID format');
		}

		// Kulcs-érték pár lekérdezése
		// Property 17: Adatok app__{plugin_id} sémában tárolva
		const schemaName = pluginId.replace(/-/g, '_');

		// Use Drizzle sql template with proper escaping
		const result = await db.execute(
			sql`SELECT value FROM ${sql.raw(`app__${schemaName}.kv_store`)} WHERE key = ${key}`
		);

		const rows = result.rows as Array<{ value: unknown }>;

		if (rows.length === 0) {
			return json({
				success: true,
				data: { value: null }
			});
		}

		// Value is already parsed from JSONB type
		const value = rows[0].value;

		return json({
			success: true,
			data: { value }
		});
	} catch (err) {
		console.error(`[DataService] Get error:`, err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : 'Failed to get value'
			},
			{ status: 500 }
		);
	}
};
