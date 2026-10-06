/**
 * Takarítás: a 24 óránál régebbi, claim nélküli feltöltések és a félbemaradt
 * `.part` fájlok törlése. A `core.plugin-files-cleanup` feladat hívja.
 */

import { UNCLAIMED_RETENTION_MS } from './config';
import { deletePluginFileRowById, findUnclaimedBefore } from './repository';
import { deleteStoredFile, removeStalePartFiles } from './storage';

const BATCH_SIZE = 200;

export async function cleanupPluginFiles(
	signal?: AbortSignal,
	now = Date.now()
): Promise<{ unclaimed: number; partFiles: number }> {
	const before = new Date(now - UNCLAIMED_RETENTION_MS);
	let unclaimed = 0;

	while (!signal?.aborted) {
		const rows = await findUnclaimedBefore(before, BATCH_SIZE);
		if (rows.length === 0) break;
		for (const row of rows) {
			const deleted = await deletePluginFileRowById(row.id);
			if (deleted) {
				await deleteStoredFile(deleted.storagePath);
				unclaimed++;
			}
		}
		if (rows.length < BATCH_SIZE) break;
	}

	const partFiles = signal?.aborted ? 0 : await removeStalePartFiles(UNCLAIMED_RETENTION_MS, now);
	return { unclaimed, partFiles };
}
