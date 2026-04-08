/**
 * Plugin API Endpoint.
 *
 * DELETE /api/plugins/[pluginId]
 *
 * Eltávolít egy telepített plugint. Sima fetch hívással érhető el,
 * nem SvelteKit command-ként, hogy ne invalidálja a layout load-ot.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';
import { apps } from '@elyos/database/schemas';
import { eq, and } from 'drizzle-orm';
import { getPluginDir, removeDir } from '$lib/server/plugins/utils/filesystem';
import { permissionRepository } from '$lib/server/database/repositories';
import { pluginInstaller } from '$lib/server/plugins/installer/PluginInstaller';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	// 1. Autentikáció ellenőrzése
	if (!locals.user?.id) {
		throw error(401, 'Unauthorized');
	}

	// 2. Jogosultság ellenőrzése
	const userId = parseInt(locals.user.id);
	const permissions = await permissionRepository.findPermissionsForUser(userId);

	if (!permissions.includes('plugin.manual.install')) {
		throw error(403, 'Insufficient permissions');
	}

	const { pluginId } = params;

	try {
		// 3. Plugin létezésének ellenőrzése
		const plugin = await db.query.apps.findFirst({
			where: and(eq(apps.appId, pluginId), eq(apps.appType, 'plugin'))
		});

		if (!plugin) {
			throw error(404, 'Plugin not found');
		}

		// 4. Plugin fájlok törlése a fájlrendszerből
		try {
			const pluginDir = getPluginDir(pluginId);
			await removeDir(pluginDir);
			console.log(`[PluginManager] Plugin fájlok törölve: ${pluginDir}`);
		} catch (fsError) {
			console.error(`[PluginManager] Hiba a plugin fájlok törlésekor:`, fsError);
			// Folytatjuk az adatbázis törlésével még ha a fájl törlés sikertelen is
		}

		// 5. Email template-ek törlése
		await pluginInstaller.removeEmailTemplates(pluginId);

		// 6. Plugin törlése az adatbázisból
		await db.delete(apps).where(eq(apps.appId, pluginId));

		console.log(`[PluginManager] Plugin ${pluginId} sikeresen eltávolítva`);

		return json({ success: true });
	} catch (err) {
		console.error('[PluginManager] Hiba az eltávolítás során:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : 'Ismeretlen hiba'
			},
			{ status: 500 }
		);
	}
};
