/**
 * Plugin API Endpoint.
 *
 * DELETE /api/plugins/[pluginId]
 * Eltávolít egy telepített plugint. Sima fetch hívással érhető el,
 * nem SvelteKit command-ként, hogy ne invalidálja a layout load-ot.
 *
 * PUT /api/plugins/[pluginId]
 * Frissít egy telepített plugint multipart/form-data kéréssel (file mező).
 * Requirements: 8.1–8.11
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';
import { client as pool } from '$lib/server/database';
import { apps } from '@racona/database/schemas';
import { eq, and } from 'drizzle-orm';
import { getPluginDir, removeDir } from '$lib/server/plugins/utils/filesystem';
import { permissionRepository } from '$lib/server/database/repositories';
import { pluginInstaller } from '$lib/server/plugins/installer/PluginInstaller';
import { desktopShortcuts, translations } from '@racona/database/schemas';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import {
	PLUGIN_PACKAGE_EXTENSION_WITH_DOT,
	PLUGIN_MAX_SIZE,
	PLUGIN_TEMP_DIR
} from '$lib/server/plugins/config';
import { PluginErrorCode } from '@racona/database';
import { pluginUpdateValidator, pluginUpdater } from '$lib/server/plugins/installer/PluginUpdater';
import { activityLogService } from '$lib/server/activity-log/service';

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

		// 7. Plugin fordítások törlése (plugin:<id> namespace)
		try {
			await db.delete(translations).where(eq(translations.namespace, `plugin:${pluginId}`));
			console.log(`[PluginManager] Plugin fordítások törölve: plugin:${pluginId}`);
		} catch (translationError) {
			console.error(`[PluginManager] Hiba a plugin fordítások törlésekor:`, translationError);
		}

		// 8. Desktop parancsikonok törlése az adatbázisból (minden felhasználónál)
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

		// 9. Plugin törlése az adatbázisból
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

// ============================================================================
// PUT /api/plugins/[pluginId] — Plugin frissítés
// ============================================================================

/**
 * Plugin frissítése feltöltött .raconapkg csomaggal.
 *
 * Requirements: 8.1–8.11
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	// Req 8.2: Autentikáció ellenőrzése
	if (!locals.user?.id) {
		throw error(401, 'Unauthorized');
	}

	const userId = locals.user.id;

	// Req 8.3: Jogosultság ellenőrzése
	const permissions = await permissionRepository.findPermissionsForUser(parseInt(userId));
	if (!permissions.includes('plugin.manual.install')) {
		throw error(403, 'Insufficient permissions');
	}

	const { pluginId } = params;

	// Req 8.4: Plugin létezésének ellenőrzése
	const plugin = await db.query.apps.findFirst({
		where: and(eq(apps.appId, pluginId), eq(apps.appType, 'plugin'))
	});

	if (!plugin) {
		throw error(404, 'Plugin not found');
	}

	// Formdata beolvasása
	const formData = await request.formData();
	const file = formData.get('file') as File | null;

	// Req 8.7: Nincs fájl
	if (!file) {
		return json({ success: false, error: 'MISSING_FILE' }, { status: 400 });
	}

	// Req 8.5: Kiterjesztés előellenőrzés
	if (!file.name.endsWith(PLUGIN_PACKAGE_EXTENSION_WITH_DOT)) {
		return json({ success: false, error: PluginErrorCode.INVALID_EXTENSION }, { status: 400 });
	}

	// Req 8.6: Méretellenőrzés
	if (PLUGIN_MAX_SIZE && file.size > PLUGIN_MAX_SIZE) {
		return json({ success: false, error: PluginErrorCode.FILE_TOO_LARGE }, { status: 400 });
	}

	// Req 8.11: Ideiglenes fájlnév előállítása (safeFilename-ből kiszűrjük az
	// /, \, .. karaktersorozatokat és a vezérlőkaraktereket)
	const safeFilename = file.name
		// eslint-disable-next-line no-control-regex
		.replace(/[/\\]/g, '')
		.replace(/\.\./g, '')
		// eslint-disable-next-line no-control-regex
		.replace(/[\x00-\x1f\x7f]/g, '');

	const timestamp = Date.now();
	const tempFileName = `plugin-update-${userId}-${timestamp}-${safeFilename}`;

	// Temp könyvtár létrehozása ha szükséges
	await mkdir(PLUGIN_TEMP_DIR, { recursive: true });

	const tempFilePath = path.join(PLUGIN_TEMP_DIR, tempFileName);

	try {
		// Req 8.10 (try-finally): Fájl ideiglenes mentése
		const arrayBuffer = await file.arrayBuffer();
		await writeFile(tempFilePath, Buffer.from(arrayBuffer));

		// Req 8.8: Frissítési validáció
		const report = await pluginUpdateValidator.validateForUpdate(tempFilePath, pluginId);

		if (!report.valid || !report.manifest) {
			return json({ success: false, errors: report.errors }, { status: 400 });
		}

		// Req 8.1: Frissítés végrehajtása
		const result = await pluginUpdater.update(tempFilePath, report.manifest, pluginId);

		if (result.success) {
			// Req 10.4: Activity log bejegyzés
			activityLogService.log({
				actionKey: 'plugin.updated',
				userId,
				resourceType: 'plugin',
				resourceId: pluginId,
				context: { oldVersion: result.oldVersion, newVersion: result.newVersion }
			});

			return json(
				{ success: true, oldVersion: result.oldVersion, newVersion: result.newVersion },
				{ status: 200 }
			);
		} else {
			// Req 8.9: Frissítési hiba (rollback után)
			return json({ success: false, error: result.error }, { status: 500 });
		}
	} finally {
		// Req 8.10: Ideiglenes fájl törlése minden esetben (sikeres és hibás esetben is)
		await unlink(tempFilePath).catch(() => {});
	}
};
