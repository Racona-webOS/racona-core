/**
 * Plugin Upload API Endpoint.
 *
 * POST /api/plugins/upload
 *
 * Task 9.1: Plugin feltöltés endpoint.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PluginValidator } from '$lib/server/plugins/validation/PluginValidator';
import { PluginInstaller } from '$lib/server/plugins/installer/PluginInstaller';
import { PluginErrorCode } from '@elyos/database';
import fs from 'fs/promises';
import path from 'path';
import { writeFile } from 'fs/promises';
import {
	PLUGIN_PACKAGE_EXTENSION_WITH_DOT,
	PLUGIN_MAX_SIZE,
	PLUGIN_MAX_SIZE_MB,
	PLUGIN_TEMP_DIR
} from '$lib/server/plugins/config';
import { activityLogService } from '$lib/server/activity-log/service';

const TEMP_DIR = PLUGIN_TEMP_DIR;
const MAX_FILE_SIZE = PLUGIN_MAX_SIZE;

export const POST: RequestHandler = async ({ request, locals }) => {
	let tempFilePath: string | null = null;

	try {
		// 1. Authentication check
		if (!locals.user?.id) {
			throw error(401, 'Unauthorized - Authentication required');
		}

		// TODO: Check if user has admin permission
		// For now, we allow any authenticated user

		// 2. Multipart form-data parsing
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			throw error(400, 'No file uploaded');
		}

		// 3. File extension validation (Property 1)
		if (!file.name.endsWith(PLUGIN_PACKAGE_EXTENSION_WITH_DOT)) {
			throw error(
				400,
				`${PluginErrorCode.INVALID_EXTENSION}: Only ${PLUGIN_PACKAGE_EXTENSION_WITH_DOT} files are allowed`
			);
		}

		// 4. File size validation (Property 2)
		if (file.size > (MAX_FILE_SIZE ?? 0)) {
			throw error(
				400,
				`${PluginErrorCode.FILE_TOO_LARGE}: File size exceeds ${PLUGIN_MAX_SIZE_MB} MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB)`
			);
		}

		// 5. Create temporary directory
		await fs.mkdir(TEMP_DIR, { recursive: true });

		// 6. Save file to temporary location
		const timestamp = Date.now();
		const tempFileName = `plugin-${timestamp}-${file.name}`;
		tempFilePath = path.join(TEMP_DIR, tempFileName);

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		await writeFile(tempFilePath, buffer);

		console.log(`[PluginUpload] File saved to: ${tempFilePath}`);

		// 7. Validation
		const validator = new PluginValidator();
		const validationReport = await validator.validate(tempFilePath);

		if (!validationReport.valid) {
			// Clean up temporary file
			await fs.unlink(tempFilePath).catch(() => {});

			return json(
				{
					success: false,
					errors: validationReport.errors,
					warnings: validationReport.warnings
				},
				{ status: 400 }
			);
		}

		// 8. Installation
		if (!validationReport.manifest) {
			throw new Error('Manifest not found in validation report');
		}

		const installer = new PluginInstaller();
		const installResult = await installer.install(tempFilePath, validationReport.manifest);

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

		// 9. Clean up temporary file
		await fs.unlink(tempFilePath).catch(() => {});

		// 10. Success response
		activityLogService.log({
			actionKey: 'plugin.installed',
			userId: locals.user.id,
			resourceType: 'plugin',
			resourceId: installResult.pluginId,
			context: { filename: file.name }
		});

		return json({
			success: true,
			pluginId: installResult.pluginId,
			warnings: validationReport.warnings
		});
	} catch (err) {
		console.error('[PluginUpload] Error:', err);

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
				error: err instanceof Error ? err.message : 'Upload failed'
			},
			{ status: 500 }
		);
	}
};
