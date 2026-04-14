/**
 * Notification Service Endpoint
 *
 * POST /api/plugins/:pluginId/notifications
 *
 * Értesítés küldése a notification center-be.
 * Property 21: Jogosultság ellenőrzés működik
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
		const { userId, title, message, type = 'info' } = body;

		if (!userId || !title || !message) {
			throw error(400, 'userId, title, and message are required');
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

		const plugin = pluginResult[0];

		if (plugin.appType !== 'plugin') {
			throw error(400, 'Not a plugin application');
		}

		if (plugin.pluginStatus !== 'active') {
			throw error(403, `${PluginErrorCode.PLUGIN_INACTIVE}: Plugin is not active`);
		}

		// Jogosultság ellenőrzés (Property 21)
		const permissions = (plugin.pluginPermissions as string[]) || [];
		if (!permissions.includes('notifications')) {
			throw error(
				403,
				`${PluginErrorCode.PERMISSION_DENIED}: Plugin does not have 'notifications' permission`
			);
		}

		// Értesítés létrehozása
		// TODO: Integrálni a meglévő notification rendszerrel
		await db.execute(
			sql`
			INSERT INTO platform.notifications (user_id, app_name, title, message, type, created_at)
			VALUES (
				1,
				${pluginId},
				${sql`${JSON.stringify({ en: title, hu: title })}::jsonb`},
				${sql`${JSON.stringify({ en: message, hu: message })}::jsonb`},
				${type},
				NOW()
			)
		`
		);

		return json({
			success: true
		});
	} catch (err) {
		console.error(`[NotificationService] Error sending notification:`, err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : 'Failed to send notification'
			},
			{ status: 500 }
		);
	}
};
