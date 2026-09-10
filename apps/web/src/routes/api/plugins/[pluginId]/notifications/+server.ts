/**
 * Notification Service Endpoint
 *
 * POST /api/plugins/:pluginId/notifications
 *
 * Értesítés küldése a notification center-be a megadott felhasználónak.
 * Property 21: Jogosultság ellenőrzés működik
 *
 * A plugin kliens oldali kódja a bejelentkezett felhasználó nevében fut, ezért
 * a hívó bármikor küldhet saját magának, de más felhasználó célzásához a hívónak
 * notifications.send core jogosultság kell (mint a POST /api/notifications-nél).
 * Más felhasználók értesítésére a plugin szerver oldali contextje való.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PluginErrorCode } from '@racona/database';
import db from '$lib/server/database';
import { apps, users } from '@racona/database';
import { eq } from 'drizzle-orm';
import { permissionRepository } from '$lib/server/database/repositories';
import { sendNotification } from '$lib/server/socket';

/** Más felhasználóknak küldéshez szükséges core jogosultság */
const NOTIFICATION_SEND_PERMISSION = 'notifications.send';

/** Engedélyezett értesítés típusok (a notifications.type oszlop értékei) */
const ALLOWED_TYPES = ['info', 'success', 'warning', 'error', 'critical'] as const;
type NotificationType = (typeof ALLOWED_TYPES)[number];

/**
 * A kliens által küldött userId feloldása numerikus user ID-ra.
 * A plugin SDK stringként küldi, a szerver függvények számként adják vissza.
 */
function parseUserId(raw: unknown): number | null {
	if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) return raw;
	if (typeof raw === 'string' && /^\d+$/.test(raw)) return parseInt(raw, 10);
	return null;
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { pluginId } = params;

	try {
		// Autentikáció (a hooks is védi az /api/plugins/ útvonalakat, itt explicit)
		if (!locals.user?.id) {
			throw error(401, 'Unauthorized');
		}
		const callerId = parseInt(locals.user.id);

		// Request body parsing
		const body = await request.json();
		const { userId: rawUserId, title, message, type = 'info' } = body;

		if (!rawUserId || !title || !message) {
			throw error(400, 'userId, title, and message are required');
		}

		const userId = parseUserId(rawUserId);
		if (userId === null) {
			throw error(400, 'userId must be a positive integer');
		}

		if (typeof title !== 'string' || typeof message !== 'string') {
			throw error(400, 'title and message must be strings');
		}

		if (!ALLOWED_TYPES.includes(type)) {
			throw error(400, `type must be one of: ${ALLOWED_TYPES.join(', ')}`);
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

		// Hívó jogosultság — más felhasználó célzása csak notifications.send joggal.
		// A célfelhasználó létezését csak ezután ellenőrizzük, hogy a 404 ne szivárogtasson.
		if (userId !== callerId) {
			const callerPermissions = await permissionRepository.findPermissionsForUser(callerId);
			if (!callerPermissions.includes(NOTIFICATION_SEND_PERMISSION)) {
				throw error(
					403,
					`${PluginErrorCode.PERMISSION_DENIED}: ${NOTIFICATION_SEND_PERMISSION} permission required to notify other users`
				);
			}
		}

		// Célfelhasználó ellenőrzés — ne keletkezzen árva értesítés
		const targetUser = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (targetUser.length === 0) {
			throw error(404, `Target user ${userId} not found`);
		}

		// Értesítés küldése a core notification rendszeren keresztül (adatbázis + valós idejű Socket.IO push)
		const [notification] = await sendNotification({
			userId,
			appName: pluginId,
			title,
			message,
			type: type as NotificationType
		});

		return json({
			success: true,
			notificationId: notification?.id
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
