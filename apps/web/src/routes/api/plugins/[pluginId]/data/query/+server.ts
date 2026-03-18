/**
 * Data Service - Query Endpoint
 *
 * POST /api/plugins/:pluginId/data/query
 *
 * SQL lekérdezés végrehajtása a plugin sémájában.
 * Property 17: Adatok plugin_{plugin_id} sémában tárolva
 * Property 18: Más plugin sémák nem elérhetők
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PluginErrorCode } from '@elyos/database';
import db from '$lib/server/database';
import { apps } from '@elyos/database';
import { eq, sql } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, request }) => {
	const { pluginId } = params;

	try {
		// Request body parsing
		const body = await request.json();
		const { sql: querySQL, params: queryParams } = body;

		if (!querySQL) {
			throw error(400, 'SQL query is required');
		}

		// Plugin ellenőrzés
		const pluginResult = await db
			.select({
				pluginStatus: apps.pluginStatus,
				appType: apps.appType,
				pluginPermissions: apps.pluginPermissions
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

		// Database permission ellenőrzés
		const permissions = pluginResult[0].pluginPermissions ?? [];
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

		// Biztonsági ellenőrzések a query-re
		// Property 18: Más plugin sémák nem elérhetők
		const lowerQuery = querySQL.toLowerCase();

		// Tiltott műveletek
		if (
			lowerQuery.includes('drop ') ||
			lowerQuery.includes('truncate ') ||
			lowerQuery.includes('alter ') ||
			lowerQuery.includes('create ') ||
			lowerQuery.includes('grant ') ||
			lowerQuery.includes('revoke ')
		) {
			throw error(403, 'DDL operations are not allowed');
		}

		// Más sémák elérésének tiltása (Property 18)
		if (lowerQuery.includes('plugin_') && !lowerQuery.includes(`plugin_${pluginId}`)) {
			throw error(
				403,
				`${PluginErrorCode.PERMISSION_DENIED}: Access to other plugin schemas is not allowed`
			);
		}

		if (
			lowerQuery.includes('platform.') ||
			lowerQuery.includes('auth.') ||
			lowerQuery.includes('public.')
		) {
			throw error(
				403,
				`${PluginErrorCode.PERMISSION_DENIED}: Access to system schemas is not allowed`
			);
		}

		// Query végrehajtása a plugin sémájában
		// Automatikusan hozzáadjuk a séma prefixet, ha nincs megadva
		const schemaName = `plugin_${pluginId.replace(/-/g, '_')}`;
		let finalQuery = querySQL;
		const lowerQueryCheck = querySQL.toLowerCase();

		if (!lowerQueryCheck.includes(schemaName.toLowerCase() + '.')) {
			// Egyszerű táblanév helyettesítés
			finalQuery = querySQL.replace(/FROM\s+([a-z_][a-z0-9_]*)/gi, `FROM ${schemaName}.$1`);
			finalQuery = finalQuery.replace(/JOIN\s+([a-z_][a-z0-9_]*)/gi, `JOIN ${schemaName}.$1`);
			finalQuery = finalQuery.replace(/INTO\s+([a-z_][a-z0-9_]*)/gi, `INTO ${schemaName}.$1`);
			finalQuery = finalQuery.replace(/UPDATE\s+([a-z_][a-z0-9_]*)/gi, `UPDATE ${schemaName}.$1`);
		}

		// Query végrehajtása
		const result = await db.execute(sql.raw(finalQuery));

		return json({
			success: true,
			data: { rows: result.rows }
		});
	} catch (err) {
		console.error(`[DataService] Query error:`, err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : 'Query execution failed'
			},
			{ status: 500 }
		);
	}
};
