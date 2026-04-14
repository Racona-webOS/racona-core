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
import { client as pool } from '$lib/server/database';
import { apps } from '@racona/database/schemas';
import { eq, and, inArray } from 'drizzle-orm';
import { getPluginDir, removeDir } from '$lib/server/plugins/utils/filesystem';
import { permissionRepository } from '$lib/server/database/repositories';
import { pluginInstaller } from '$lib/server/plugins/installer/PluginInstaller';
import { desktopShortcuts } from '@racona/database/schemas';

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

		// 6. Plugin séma törlése (app__<plugin_id> és benne minden tábla)
		const schemaName = `app__${pluginId.replace(/-/g, '_').replace(/[^a-z0-9_]/g, '')}`;
		try {
			await pool.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
			console.log(`[PluginManager] Plugin séma törölve: ${schemaName}`);
		} catch (schemaError) {
			console.error(`[PluginManager] Hiba a plugin séma törlésekor:`, schemaError);
		}

		// 7. Desktop parancsikonok törlése az adatbázisból (minden felhasználónál)
		try {
			const deleted = await db
				.delete(desktopShortcuts)
				.where(eq(desktopShortcuts.appId, pluginId))
				.returning({ id: desktopShortcuts.id });
			if (deleted.length > 0) {
				console.log(
					`[PluginManager] ${deleted.length} desktop parancsikon törölve a(z) ${pluginId} pluginhoz`
				);
			}
		} catch (shortcutError) {
			console.error(`[PluginManager] Hiba a desktop parancsikonok törlésekor:`, shortcutError);
		}

		// 8. Plugin törlése az adatbázisból
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
