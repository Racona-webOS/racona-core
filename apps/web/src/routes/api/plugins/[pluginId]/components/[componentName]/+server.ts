/**
 * Plugin Component Loading API
 *
 * GET /api/plugins/:pluginId/components/:componentName
 *
 * Betölti egy plugin oldal-komponensének IIFE bundle-jét
 * (uploads/plugins/<pluginId>/dist/components/<Name>.iife.js).
 */

import { error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getPluginDir } from '$lib/server/plugins/utils/filesystem';

/** Plugin ID: kebab-case (a manifest validátorral azonos szabály) */
const PLUGIN_ID_PATTERN = /^[a-z0-9-]+$/;

/** Komponensnév: a src/components/<Name>.svelte fájlnév kiterjesztés nélkül */
const COMPONENT_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;

export const GET: RequestHandler = async ({ params }) => {
	const { pluginId, componentName } = params;

	// Útvonal-bejárás elleni védelem: csak biztonságos neveket engedünk a fájlútba
	if (!PLUGIN_ID_PATTERN.test(pluginId)) {
		throw svelteError(400, 'Invalid plugin ID format');
	}
	if (!COMPONENT_NAME_PATTERN.test(componentName)) {
		throw svelteError(400, 'Invalid component name');
	}

	const componentPath = join(
		getPluginDir(pluginId),
		'dist',
		'components',
		`${componentName}.iife.js`
	);

	try {
		const code = await readFile(componentPath, 'utf-8');

		return new Response(code, {
			headers: {
				'Content-Type': 'application/javascript',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch (error) {
		console.error(`Failed to load plugin component ${pluginId}/${componentName}:`, error);
		throw svelteError(404, `Plugin component not found: ${componentName}`);
	}
};
