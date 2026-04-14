/**
 * Data Service - Set Endpoint
 *
 * POST /api/plugins/:pluginId/data/set
 *
 * Kulcs-érték pár tárolása a plugin kv_store táblájában.
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
		const { key, value } = body;

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
		if (!/^[a-z0-9-]+$/.test(pluginId)) {
			throw error(400, 'Invalid plugin ID format');
		}

		// Kulcs-érték pár tárolása (upsert)
		// Property 17: Adatok app__{plugin_id} sémában tárolva
		const schemaName = pluginId.replace(/-/g, '_');

		// Use sql template with proper JSONB handling
		await db.execute(
			sql`
			INSERT INTO ${sql.raw(`app__${schemaName}.kv_store`)} (key, value, updated_at)
			VALUES (${key}, ${sql`${JSON.stringify(value)}::jsonb`}, NOW())
			ON CONFLICT (key)
			DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
		`
		);

		return json({
			success: true,
			data: null
		});
	} catch (err) {
		console.error(`[DataService] Set error:`, err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : 'Failed to set value'
			},
			{ status: 500 }
		);
	}
};
