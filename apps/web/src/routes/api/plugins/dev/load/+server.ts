/**
 * Dev Plugin Loading API Endpoint.
 *
 * POST /api/plugins/dev/load
 *
 * Fejlesztői plugin betöltése localhost URL-ről.
 * Csak DEV_MODE=true esetén engedélyezett, hitelesítést és
 * plugin.manual.install jogosultságot igényel.
 * Biztonsági okokból kizárólag localhost URL-ek elfogadottak.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$lib/env';
import { permissionRepository } from '$lib/server/database/repositories';

/**
 * Ellenőrzi, hogy az URL localhost-ra mutat-e.
 * Csak http://localhost: és http://127.0.0.1: prefixek engedélyezettek.
 */
function isLocalhostUrl(url: string): boolean {
	return url.startsWith('http://localhost:') || url.startsWith('http://127.0.0.1:');
}

/**
 * Ellenőrzi, hogy a manifest tartalmazza-e a kötelező mezőket.
 */
function isValidManifest(
	manifest: unknown
): manifest is { id: string; name: unknown; entry: string; version: string } {
	if (!manifest || typeof manifest !== 'object') return false;
	const m = manifest as Record<string, unknown>;
	return (
		typeof m.id === 'string' &&
		m.id.length > 0 &&
		m.name != null &&
		typeof m.entry === 'string' &&
		m.entry.length > 0 &&
		typeof m.version === 'string' &&
		m.version.length > 0
	);
}

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// 1. DEV_MODE ellenőrzés — csak fejlesztői módban engedélyezett
		if (!env.DEV_MODE) {
			return json(
				{
					success: false,
					error: 'Dev plugin loading is disabled in production'
				},
				{ status: 403 }
			);
		}

		// 2. Hitelesítés ellenőrzés
		if (!locals.user?.id) {
			return json(
				{
					success: false,
					error: 'Authentication required'
				},
				{ status: 401 }
			);
		}

		// 3. Jogosultság ellenőrzés — DEV_MODE-ban elég a bejelentkezés,
		// éles módban plugin.manual.install szükséges
		try {
			const userId = parseInt(locals.user.id);
			const permissions = await permissionRepository.findPermissionsForUser(userId);

			if (!permissions.includes('plugin.manual.install')) {
				return json(
					{
						success: false,
						error: 'Insufficient permissions — plugin.manual.install required'
					},
					{ status: 403 }
				);
			}
		} catch (permErr) {
			// Ha a jogosultság-ellenőrzés DB hibával meghiúsul DEV_MODE-ban, folytatjuk
			console.warn('[DevPluginLoad] Permission check failed, proceeding in DEV_MODE:', permErr);
		}

		// 4. Request body feldolgozás
		const body = await request.json();
		const { url } = body as { url?: string };

		if (!url || typeof url !== 'string') {
			return json(
				{
					success: false,
					error: 'Missing or invalid url parameter'
				},
				{ status: 400 }
			);
		}

		// 5. Localhost URL validáció — biztonsági ellenőrzés
		if (!isLocalhostUrl(url)) {
			return json(
				{
					success: false,
					error: 'Only localhost URLs are allowed (http://localhost: or http://127.0.0.1:)'
				},
				{ status: 400 }
			);
		}

		// 6. Manifest lekérése a fejlesztői szerverről
		const manifestUrl = `${url.replace(/\/$/, '')}/manifest.json`;
		const manifestResponse = await fetch(manifestUrl, {
			signal: AbortSignal.timeout(5000)
		});

		if (!manifestResponse.ok) {
			return json(
				{
					success: false,
					error: `Failed to fetch manifest from ${manifestUrl} (HTTP ${manifestResponse.status})`
				},
				{ status: 502 }
			);
		}

		const manifest = await manifestResponse.json();

		// 7. Manifest validáció — kötelező mezők ellenőrzése
		if (!isValidManifest(manifest)) {
			return json(
				{
					success: false,
					error: 'Invalid manifest — required fields: id, name, entry, version'
				},
				{ status: 400 }
			);
		}

		// 8. Dev plugin metaadatok összeállítása
		const baseUrl = url.replace(/\/$/, '');
		const plugin = {
			...manifest,
			entry: `${baseUrl}/${manifest.entry}`,
			devMode: true,
			devUrl: baseUrl,
			appType: 'plugin'
		};

		return json({
			success: true,
			plugin
		});
	} catch (err) {
		console.error('[DevPluginLoad] Error:', err);

		// Hálózati hiba kezelése (pl. a dev szerver nem fut)
		if (err instanceof TypeError && err.message.includes('fetch')) {
			return json(
				{
					success: false,
					error: 'Could not connect to dev server — is it running?'
				},
				{ status: 502 }
			);
		}

		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : 'Failed to load dev plugin'
			},
			{ status: 500 }
		);
	}
};
