/**
 * Plugin Menu API
 *
 * Betölti egy plugin menu.json fájlját és a manifest layout beállításait.
 */

import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const GET: RequestHandler = async ({ params }) => {
	const { pluginId } = params;

	try {
		const pluginDir = join(process.cwd(), 'uploads', 'plugins', pluginId);

		// Menu fájl beolvasása
		let menuData: any[] = [];
		try {
			const menuContent = await readFile(join(pluginDir, 'menu.json'), 'utf-8');
			menuData = JSON.parse(menuContent);
		} catch {
			// nincs menu.json
		}

		// Manifest layout beállítások beolvasása
		let layout: Record<string, string> = {};
		try {
			const manifestContent = await readFile(join(pluginDir, 'manifest.json'), 'utf-8');
			const manifest = JSON.parse(manifestContent);
			layout = manifest.layout ?? {};
		} catch {
			// nincs manifest vagy layout mező
		}

		return json({
			success: true,
			menu: menuData,
			layout
		});
	} catch (error) {
		return json({
			success: true,
			menu: [],
			layout: {}
		});
	}
};
