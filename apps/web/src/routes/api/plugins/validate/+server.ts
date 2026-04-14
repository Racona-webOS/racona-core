/**
 * Plugin Validation API Endpoint.
 *
 * POST /api/plugins/validate
 *
 * Validates a plugin package and returns metadata without installing.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PluginValidator } from '$lib/server/plugins/validation/PluginValidator';
import { PluginErrorCode } from '@racona/database';
import fs from 'fs/promises';
import path from 'path';
import { writeFile } from 'fs/promises';
import {
	PLUGIN_PACKAGE_EXTENSION_WITH_DOT,
	PLUGIN_MAX_SIZE,
	PLUGIN_MAX_SIZE_MB,
	PLUGIN_TEMP_DIR
} from '$lib/server/plugins/config';
import { translationRepository, permissionRepository } from '$lib/server/database/repositories';

const TEMP_DIR = PLUGIN_TEMP_DIR;
const MAX_FILE_SIZE = PLUGIN_MAX_SIZE;

/**
 * Translate validation error message.
 */
async function translateError(
	code: string,
	message: string,
	locale: string,
	details?: any
): Promise<string> {
	// Try to get translation from database
	const translation = await translationRepository.getByKey(
		locale,
		'plugin-manager',
		`validation.errors.${code}`
	);

	if (translation?.value) {
		// Replace placeholders if details provided
		let result = translation.value;
		if (details) {
			Object.keys(details).forEach((key) => {
				result = result.replace(`{${key}}`, String(details[key]));
			});
		}
		return result;
	}

	// Fallback to original message
	return message;
}

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

		// 3. Multipart form-data parsing
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			throw error(400, 'No file uploaded');
		}

		// 4. File extension validation
		if (!file.name.endsWith(PLUGIN_PACKAGE_EXTENSION_WITH_DOT)) {
			throw error(
				400,
				`${PluginErrorCode.INVALID_EXTENSION}: Only ${PLUGIN_PACKAGE_EXTENSION_WITH_DOT} files are allowed`
			);
		}

		// 5. File size validation
		if (file.size > (MAX_FILE_SIZE ?? 0)) {
			throw error(
				400,
				`${PluginErrorCode.FILE_TOO_LARGE}: File size exceeds ${PLUGIN_MAX_SIZE_MB} MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB)`
			);
		}

		// 6. Create temporary directory
		await fs.mkdir(TEMP_DIR, { recursive: true });

		// 7. Save file to temporary location with user-specific name
		const timestamp = Date.now();
		const tempFileName = `plugin-${userId}-${timestamp}-${file.name}`;
		tempFilePath = path.join(TEMP_DIR, tempFileName);

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		await writeFile(tempFilePath, buffer);

		console.log(`[PluginValidate] File saved to: ${tempFilePath}`);

		// 8. Validation
		const validator = new PluginValidator();
		const validationReport = await validator.validate(tempFilePath);

		if (!validationReport.valid) {
			// Clean up temporary file
			await fs.unlink(tempFilePath).catch(() => {});

			// Translate error messages
			const locale = locals.locale || 'hu';
			const translatedErrors = await Promise.all(
				validationReport.errors.map(async (err) => ({
					code: err.code,
					message: await translateError(err.code, err.message, locale, err.details),
					field: err.field,
					details: err.details
				}))
			);

			return json(
				{
					success: false,
					errors: translatedErrors,
					warnings: validationReport.warnings
				},
				{ status: 400 }
			);
		}

		// 8. Return validation success with manifest data
		// Keep the temp file for later installation
		return json({
			success: true,
			tempFile: tempFileName,
			manifest: validationReport.manifest,
			warnings: validationReport.warnings
		});
	} catch (err) {
		console.error('[PluginValidate] Error:', err);

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
				error: err instanceof Error ? err.message : 'Validation failed'
			},
			{ status: 500 }
		);
	}
};
