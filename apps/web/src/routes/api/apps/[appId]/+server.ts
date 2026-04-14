/**
 * App Details API Endpoint
 *
 * GET /api/apps/:appId
 *
 * Visszaadja egy app részletes adatait.
 */

import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';
import { apps } from '@racona/database';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const { appId } = params;

	try {
		const result = await db.select().from(apps).where(eq(apps.appId, appId)).limit(1);

		if (result.length === 0) {
			throw error(404, 'App not found');
		}

		return json(result[0]);
	} catch (err) {
		console.error(`[API] Failed to get app ${appId}:`, err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, `Failed to get app: ${err instanceof Error ? err.message : 'Unknown error'}`);
	}
};
