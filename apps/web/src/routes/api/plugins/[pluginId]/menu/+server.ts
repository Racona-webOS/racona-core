/**
 * Plugin Menu API
 *
 * Betölti egy plugin menu.json fájlját és a manifest layout beállításait.
 */

import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile } from 'fs/promises';
import { join } from 'path';
import db from '$lib/server/database';
import { apps } from '@racona/database';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const { pluginId } = params;

	try {
		const pluginDir = join(process.cwd(), 'uploads', 'plugins', pluginId);

		// Menu fájl beolvasása
		let menuData: any[] = [];
		let layout: Record<string, unknown> = {};

		// Manifest layout beolvasása
		try {
			const manifestContent = await readFile(join(pluginDir, 'manifest.json'), 'utf-8');
			const manifest = JSON.parse(manifestContent);
			if (manifest?.layout) layout = { ...layout, ...manifest.layout };
		} catch {
			// nincs manifest.json vagy nincs layout benne
		}

		try {
			const menuContent = await readFile(join(pluginDir, 'menu.json'), 'utf-8');
			const parsed = JSON.parse(menuContent);
			// Támogatja mind a régi tömb formátumot, mind az új { layout, items } formátumot
			if (Array.isArray(parsed)) {
				menuData = parsed;
			} else if (parsed?.items) {
				menuData = parsed.items;
				// menu.json layout felülírja a manifest layout-ot
				layout = { ...layout, ...(parsed.layout ?? {}) };
			}
		} catch {
			// nincs menu.json
		}
		let sidebarComponent: string | null = null;

		try {
			const result = await db
				.select({
					sidebarComponent: apps.sidebarComponent
				})
				.from(apps)
				.where(eq(apps.appId, pluginId))
				.limit(1);

			if (result.length > 0) {
				sidebarComponent = result[0].sidebarComponent;
			}
		} catch (error) {
			console.warn(
				`[PluginMenu] Failed to load sidebarComponent from database for ${pluginId}:`,
				error
			);
		}

		return json({
			success: true,
			menu: menuData,
			layout,
			sidebarComponent
		});
	} catch (error) {
		return json({
			success: true,
			menu: [],
			layout: {},
			sidebarComponent: null
		});
	}
};
