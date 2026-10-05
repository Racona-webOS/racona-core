import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { notificationRepository } from '$lib/server/database/repositories';

/**
 * DELETE /api/notifications/[id]/delete
 * Delete a specific notification of the current user
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

		// Csak a saját értesítését törölheti — idegen id-ra ugyanúgy 404, mint nem létezőre
		const deleted = await notificationRepository.deleteForUser(notificationId, userId);
		if (!deleted) {
			return json({ error: 'Notification not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('[API] Error deleting notification:', error);
		return json({ error: 'Failed to delete notification' }, { status: 500 });
	}
};
