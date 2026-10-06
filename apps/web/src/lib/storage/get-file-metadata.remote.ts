/**
 * GetFileMetadata Remote Function (kliens-elérhető)
 * Requirements: 5.1, 5.2, 5.3, 5.4
 *
 * Fájl metaadatainak lekérdezése jogosultság ellenőrzéssel.
 */

import { command, getRequestEvent } from '$app/server';
import { getFileMetadataInputSchema } from './schemas.js';
import { fileRepository } from '$lib/server/storage/file-repository.js';
import { canReadFileMetadata } from '$lib/server/storage/policy.js';
import { StorageError } from '$lib/server/storage/types.js';
import type { GetFileMetadataResult } from './types.js';

// ============================================================================
// Remote Function
// ============================================================================

/**
 * Fájl metaadatainak lekérdezése jogosultság ellenőrzéssel.
 * Shared fájlok minden bejelentkezett felhasználónak, user scope fájlok csak a tulajdonosnak.
 *
 * @param input - A lekérdezés paraméterei
 * @returns A lekérdezés eredménye
 */
export const getFileMetadata = command(
	getFileMetadataInputSchema,
	async (input): Promise<GetFileMetadataResult> => {
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
			const file = await fileRepository.findByPublicId(fileId);

			if (!file) {
				return {
					success: false,
					error: 'File not found'
				};
			}

			if (!canReadFileMetadata(file, userId)) {
				return {
					success: false,
					error: 'Permission denied: You can only access your own files'
				};
			}

			return {
				success: true,
				file
			};
		} catch (error) {
			console.error('[FileStorage] Get file metadata error:', error);

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
