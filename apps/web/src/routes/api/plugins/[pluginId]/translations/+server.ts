/**
 * I18n Service Endpoint
 *
 * GET /api/plugins/:pluginId/translations?locale=hu
 *
 * Plugin fordítások lekérdezése.
 * Property 19: Kulcsok prefixelve plugin:{plugin_id} névtérrel
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PluginErrorCode } from '@racona/database';
import db from '$lib/server/database';
import { apps } from '@racona/database';
import { eq, and, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, url }) => {
	const { pluginId } = params;
	const locale = url.searchParams.get('locale') || 'en';

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

		// Fordítások lekérdezése
		// Property 19: Kulcsok prefixelve plugin:{plugin_id} névtérrel
		const namespace = `plugin:${pluginId}`;

		const result = await db.execute(
			sql`
			SELECT key, value
			FROM platform.translations
			WHERE namespace = ${namespace}
			  AND locale = ${locale}
		`
		);

		// Fordítások objektummá alakítása
		const translations: Record<string, string> = {};
		const rows = result.rows as Array<{ key: string; value: string }>;

		rows.forEach((row) => {
			// Prefix eltávolítása a kulcsból (plugin:plugin-id. -> '')
			const key = row.key.replace(`${namespace}.`, '');
			translations[key] = row.value;
		});

		return json({
			success: true,
			translations,
			locale
		});
	} catch (err) {
		console.error(`[I18nService] Error loading translations:`, err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : 'Failed to load translations'
			},
			{ status: 500 }
		);
	}
};
