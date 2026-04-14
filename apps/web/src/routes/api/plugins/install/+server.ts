/**
 * Plugin Installation API Endpoint.
 *
 * POST /api/plugins/install
 *
 * Installs a previously validated plugin package.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PluginInstaller } from '$lib/server/plugins/installer/PluginInstaller';
import type { PluginManifest } from '@racona/database';
import fs from 'fs/promises';
import path from 'path';
import { PLUGIN_TEMP_DIR } from '$lib/server/plugins/config';
import { permissionRepository } from '$lib/server/database/repositories';

const TEMP_DIR = PLUGIN_TEMP_DIR;

export const POST: RequestHandler = async ({ request, locals }) => {
	let tempFilePath: string | null = null;

	try {
		// 1. Authentication check
		if (!locals.user?.id) {
			throw error(401, 'Unauthorized - Authentication required');
		}

		// 2. Permission check
		const userId = parseInt(locals.user.id);
		const permissions = await permissionRepository.findPermissionsForUser(userId);

		if (!permissions.includes('plugin.manual.install')) {
			throw error(
				403,
				'Forbidden - Insufficient permissions. Plugin management requires plugin.manual.install permission.'
			);
		}

		// 3. Parse request body
		const body = await request.json();
		const { tempFile, manifest } = body;

		if (!tempFile || !manifest) {
			throw error(400, 'Missing tempFile or manifest');
		}

		// 4. Verify temp file exists and belongs to this user
		tempFilePath = path.join(TEMP_DIR, tempFile);
		const userIdStr = locals.user.id;

		// Security check: ensure the temp file name contains the user ID
		if (!tempFile.includes(`plugin-${userIdStr}-`)) {
			throw error(403, 'Unauthorized access to temp file');
		}

		try {
			await fs.access(tempFilePath);
		} catch {
			throw error(404, 'Temp file not found or expired');
		}

		// 5. Installation
		const installer = new PluginInstaller();
		const installResult = await installer.install(tempFilePath, manifest as PluginManifest);

		if (!installResult.success) {
			// Clean up temporary file
			await fs.unlink(tempFilePath).catch(() => {});

			return json(
				{
					success: false,
					error: installResult.error
				},
				{ status: 500 }
			);
		}

		// 5. Clean up temporary file
		await fs.unlink(tempFilePath).catch(() => {});

		// 6. Success response
		return json({
			success: true,
			pluginId: installResult.pluginId
		});
	} catch (err) {
		console.error('[PluginInstall] Error:', err);

		// Clean up temporary file on error
		if (tempFilePath) {
			await fs.unlink(tempFilePath).catch(() => {});
		}

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : 'Installation failed'
			},
			{ status: 500 }
		);
	}
};
