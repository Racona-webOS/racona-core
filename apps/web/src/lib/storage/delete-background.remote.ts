/**
 * DeleteBackground Remote Function
 * Saját háttérkép, bélyegkép és metaadat (platform.files) törlése
 */

import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { deleteFromFileSystem } from '$lib/server/storage/filesystem.js';
import { fileRepository } from '$lib/server/storage/file-repository.js';
import { removeStoredFile } from '$lib/server/storage/file-service.js';
import { THUMBNAIL_PREFIX, toUrlPath } from '$lib/server/storage/stored-file.js';
import { StorageError } from '$lib/server/storage/types.js';

const deleteBackgroundSchema = v.object({
	filename: v.pipe(
		v.string(),
		v.minLength(1),
		v.maxLength(255),
		// Csak fájlnév, útvonal-elem nélkül
		v.regex(/^[^/\\]+$/, 'Invalid filename'),
		v.check((value) => value !== '.' && value !== '..', 'Invalid filename')
	)
});

export const deleteBackground = command(deleteBackgroundSchema, async (input) => {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return { success: false, error: 'User not authenticated' };
	}

	const userId = parseInt(locals.user.id);
	const { filename } = input;

	try {
		const imagePath = `backgrounds/user-${userId}/${filename}`;
		const record = await fileRepository.findRawByPath(imagePath);

		// A feltöltött háttérnek van rekordja: fájl, bélyegkép és rekord együtt törlődik
		if (
			record &&
			record.scope === 'user' &&
			record.userId === userId &&
			toUrlPath(record.storagePath) === imagePath
		) {
			await removeStoredFile(record);
			return { success: true };
		}

		// Rekord nélküli (régi) háttér: csak a lemezről töröljük
		await deleteFromFileSystem(imagePath);

		// Thumbnail törlése (ha létezik)
		try {
			await deleteFromFileSystem(`backgrounds/user-${userId}/${THUMBNAIL_PREFIX}${filename}`);
		} catch {
			// Thumbnail nem létezik, nem hiba
		}

		return { success: true };
	} catch (error) {
		console.error('[DeleteBackground] Error:', error);

		if (error instanceof StorageError) {
			return { success: false, error: error.message };
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
});
