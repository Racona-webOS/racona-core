import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { notificationRepository, permissionRepository } from '$lib/server/database/repositories';
import { sendNotification } from '$lib/server/socket';

/**
 * GET /api/notifications
 * Get all notifications for the current user
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const userId = parseInt(locals.user.id);
		const notifications = await notificationRepository.getByUserId(userId);
		return json({ notifications });
	} catch (error) {
		console.error('[API] Error fetching notifications:', error);
		return json({ error: 'Failed to fetch notifications' }, { status: 500 });
	}
};

/** Más felhasználóknak (vagy mindenkinek) küldéshez szükséges jogosultság */
const NOTIFICATION_SEND_PERMISSION = 'notifications.send';

const ALLOWED_TYPES = ['info', 'success', 'warning', 'error', 'critical'] as const;

/**
 * A kliens által küldött userId feloldása numerikus user ID-ra.
 */
function parseUserId(raw: unknown): number | null {
	if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) return raw;
	if (typeof raw === 'string' && /^\d+$/.test(raw)) return parseInt(raw, 10);
	return null;
}

/**
 * POST /api/notifications
 * Send a notification.
 * Bárki küldhet értesítést saját magának (célzás nélkül is ez az alapértelmezés).
 * Más felhasználó(k), csoport vagy broadcast célzásához notifications.send jogosultság kell.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const callerId = parseInt(locals.user.id);
		const payload = await request.json();

		// Validate payload
		if (!payload.title || !payload.message) {
			return json({ error: 'Title and message are required' }, { status: 400 });
		}

		if (payload.type !== undefined && !ALLOWED_TYPES.includes(payload.type)) {
			return json({ error: `type must be one of: ${ALLOWED_TYPES.join(', ')}` }, { status: 400 });
		}

		// Célpont feloldása — ugyanaz a prioritás, mint a sendNotification-ben
		const broadcast = payload.broadcast === true;
		let userId: number | undefined;
		let userIds: number[] | undefined;
		let groupId: string | undefined;

		if (!broadcast) {
			if (payload.userId !== undefined && payload.userId !== null && payload.userId !== '') {
				const parsed = parseUserId(payload.userId);
				if (parsed === null) {
					return json({ error: 'userId must be a positive integer' }, { status: 400 });
				}
				userId = parsed;
			} else if (payload.userIds !== undefined) {
				const parsed = Array.isArray(payload.userIds) ? payload.userIds.map(parseUserId) : [null];
				if (parsed.length === 0 || parsed.some((id: number | null) => id === null)) {
					return json(
						{ error: 'userIds must be a non-empty array of positive integers' },
						{ status: 400 }
					);
				}
				userIds = parsed as number[];
			} else if (payload.groupId) {
				groupId = String(payload.groupId);
			} else {
				// Célzás nélkül a hívó saját magának küld
				userId = callerId;
			}
		}

		const targetsOnlySelf =
			!broadcast &&
			!groupId &&
			(userId !== undefined ? userId === callerId : userIds!.every((id) => id === callerId));

		if (!targetsOnlySelf) {
			const permissions = await permissionRepository.findPermissionsForUser(callerId);
			if (!permissions.includes(NOTIFICATION_SEND_PERMISSION)) {
				return json(
					{ error: `Forbidden: ${NOTIFICATION_SEND_PERMISSION} permission required` },
					{ status: 403 }
				);
			}
		}

		await sendNotification({
			userId,
			userIds,
			groupId,
			broadcast: broadcast || undefined,
			appName: payload.appName,
			title: payload.title,
			message: payload.message,
			details: payload.details,
			type: payload.type,
			data: payload.data
		});

		return json({ success: true });
	} catch (error) {
		console.error('[API] Error sending notification:', error);
		return json({ error: 'Failed to send notification' }, { status: 500 });
	}
};
