/**
 * DeleteFile Remote Function (kliens-elérhető)
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 *
 * Fájl törlése a fájlrendszerből és metaadat törlése az adatbázisból.
 * - user scope: csak a tulajdonos törölheti.
 * - shared scope: a `files.shared.manage` jogosultsággal rendelkező felhasználó törölheti.
 */

import { command, getRequestEvent } from '$app/server';
import { deleteFileInputSchema } from './schemas.js';
import { fileRepository } from '$lib/server/storage/file-repository.js';
import { removeStoredFile } from '$lib/server/storage/file-service.js';
import { canDeleteFile } from '$lib/server/storage/policy.js';
import { StorageError } from '$lib/server/storage/types.js';
import { permissionRepository } from '$lib/server/database/repositories';
import type { DeleteFileResult } from './types.js';

// ============================================================================
// Remote Function
// ============================================================================

/**
 * Fájl törlése a fájlrendszerből és metaadat törlése az adatbázisból.
 *
 * @param input - A törlés paraméterei
 * @returns A törlés eredménye
 */
export const deleteFile = command(
	deleteFileInputSchema,
	async (input): Promise<DeleteFileResult> => {
		const event = getRequestEvent();
		const { locals } = event;

		if (!locals.user?.id) {
			return {
				success: false,
				error: 'User not authenticated'
			};
		}

		const { fileId } = input;
		const userId = parseInt(locals.user.id);

		try {
			const file = await fileRepository.findRawByPublicId(fileId);

			if (!file) {
				return {
					success: false,
					error: 'File not found'
				};
			}

			const permissions =
				file.scope === 'shared' ? await permissionRepository.findPermissionsForUser(userId) : [];
			const access = canDeleteFile(file, userId, permissions);

			if (!access.allowed) {
				return {
					success: false,
					error: access.error
				};
			}

			const deleted = await removeStoredFile(file);

			if (!deleted) {
				return {
					success: false,
					error: 'Failed to delete file metadata'
				};
			}

			return {
				success: true
			};
		} catch (error) {
			console.error('[FileStorage] Delete file error:', error);

			if (error instanceof StorageError) {
				return {
					success: false,
					error: error.message
				};
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error occurred'
			};
		}
	}
);
