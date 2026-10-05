import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { notificationRepository } from '$lib/server/database/repositories';

/**
 * POST /api/notifications/[id]/read
 * Mark a notification of the current user as read
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!/^\d+$/.test(params.id)) {
		return json({ error: 'Invalid notification id' }, { status: 400 });
	}

	try {
		const notificationId = parseInt(params.id);
		const userId = parseInt(locals.user.id);

		// Csak a saját értesítését jelölheti olvasottnak — idegen id-ra ugyanúgy 404, mint nem létezőre
		const updated = await notificationRepository.markAsReadForUser(notificationId, userId);
		if (!updated) {
			return json({ error: 'Notification not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('[API] Error marking notification as read:', error);
		return json({ error: 'Failed to mark notification as read' }, { status: 500 });
	}
};
