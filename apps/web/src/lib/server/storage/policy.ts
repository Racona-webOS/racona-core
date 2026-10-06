/**
 * Jogosultsági szabályok a core fájltároláshoz (tiszta függvények, DB nélkül).
 *
 * - user scope: csak a tulajdonos írhatja és törölheti.
 * - shared scope: minden bejelentkezett felhasználó látja, ezért feltölteni és törölni
 *   csak az a felhasználó tud, akinek van `files.shared.manage` jogosultsága (alapból:
 *   Sysadmin, Admin; a 0010 migráció a `settings.update` jogúaknak is megadja).
 */

import type { FileScope } from '$lib/storage/types';

/** A shared fájlok kezeléséhez szükséges jogosultság. */
export const SHARED_FILES_PERMISSION = 'files.shared.manage';

/** Engedély eredménye: engedélyezett, vagy hibaüzenet. */
export type PolicyResult = { allowed: true } | { allowed: false; error: string };

/**
 * Feltölthet-e a felhasználó az adott scope-ba.
 * @param scope - A cél scope.
 * @param permissions - A felhasználó jogosultságai.
 */
export function canWriteScope(scope: FileScope, permissions: readonly string[]): PolicyResult {
	if (scope === 'user') return { allowed: true };
	if (permissions.includes(SHARED_FILES_PERMISSION)) return { allowed: true };
	return {
		allowed: false,
		error: `Permission denied: shared files require the ${SHARED_FILES_PERMISSION} permission`
	};
}

/**
 * Törölheti-e a felhasználó a fájlt.
 * @param file - A fájl scope-ja és tulajdonosa.
 * @param userId - A kérő felhasználó.
 * @param permissions - A kérő felhasználó jogosultságai.
 */
export function canDeleteFile(
	file: { scope: string; userId: number | null },
	userId: number,
	permissions: readonly string[]
): PolicyResult {
	if (file.scope === 'shared') {
		if (permissions.includes(SHARED_FILES_PERMISSION)) return { allowed: true };
		return {
			allowed: false,
			error: `Permission denied: deleting shared files requires the ${SHARED_FILES_PERMISSION} permission`
		};
	}
	// User scope: a tulajdonos nélküli (törölt felhasználóhoz tartozó) fájlt sem törölheti más
	if (file.userId !== null && file.userId === userId) return { allowed: true };
	return { allowed: false, error: 'Permission denied: You can only delete your own files' };
}

/**
 * Lekérheti-e a felhasználó a fájl metaadatait.
 * @param file - A fájl scope-ja és tulajdonosa.
 * @param userId - A kérő felhasználó.
 */
export function canReadFileMetadata(
	file: { scope: string; userId: number | null },
	userId: number
): boolean {
	return file.scope === 'shared' || (file.userId !== null && file.userId === userId);
}
