/**
 * Fájl törlése a lemezről és az adatbázisból egy lépésben.
 * A deleteFile, a deleteBackground és a core.orphan-files-cleanup feladat használja.
 */

import type { FileSelectModel } from '@racona/database/schemas';
import { fileRepository } from './file-repository.js';
import { deleteFromFileSystem } from './filesystem.js';
import { StorageError } from './types.js';

/**
 * Fájl törlése a lemezről; a már nem létező fájl nem hiba.
 * @param storagePath - Relatív útvonal az uploads mappához képest.
 */
async function deleteIfExists(storagePath: string): Promise<void> {
	try {
		await deleteFromFileSystem(storagePath);
	} catch (error) {
		if (error instanceof StorageError && error.code === 'FILE_NOT_FOUND') {
			console.warn(`[FileStorage] File not found in filesystem: ${storagePath}`);
			return;
		}
		throw error;
	}
}

/**
 * A fájl, a bélyegképe és a metaadat-rekordja törlése.
 * A jogosultságot a hívó ellenőrzi.
 *
 * @param record - A platform.files rekord.
 * @returns true ha a rekord törlődött.
 */
export async function removeStoredFile(record: FileSelectModel): Promise<boolean> {
	await deleteIfExists(record.storagePath);

	if (record.thumbnailPath) {
		try {
			await deleteIfExists(record.thumbnailPath);
		} catch (error) {
			console.warn(`[FileStorage] Failed to delete thumbnail: ${record.thumbnailPath}`, error);
		}
	}

	return fileRepository.delete(record.publicId);
}

/**
 * A törölt felhasználókhoz tartozó user scope fájlok törlése.
 * A users törlésekor az FK `set null`, így a rekord userId-ja null lesz, a fájl
 * pedig senki számára nem érhető el; ezeket a lemezről és az adatbázisból is töröljük.
 *
 * @param signal - Megszakítás (a feladat időkorlátja).
 * @param batchSize - Egy körben ennyi rekordot dolgozunk fel.
 * @returns A törölt rekordok és a hibák száma.
 */
export async function cleanupOrphanedUserFiles(
	signal?: AbortSignal,
	batchSize = 200
): Promise<{ deleted: number; failed: number }> {
	let deleted = 0;
	let failed = 0;
	const failedIds = new Set<string>();

	while (!signal?.aborted) {
		const batch = (await fileRepository.findOrphanedUserFiles(batchSize + failedIds.size)).filter(
			(record) => !failedIds.has(record.publicId)
		);
		if (batch.length === 0) break;

		for (const record of batch) {
			if (signal?.aborted) break;
			try {
				if (await removeStoredFile(record)) deleted++;
			} catch (error) {
				failed++;
				failedIds.add(record.publicId);
				console.error(`[FileStorage] Orphaned file cleanup failed: ${record.storagePath}`, error);
			}
		}

		if (batch.length < batchSize) break;
	}

	return { deleted, failed };
}
