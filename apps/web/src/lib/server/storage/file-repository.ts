/**
 * File Repository - Adatbázis műveletek a fájl metaadatokhoz
 * Requirements: 7.3, 7.4, 7.5
 */
import db from '$lib/server/database';
import { eq, and, or, inArray, isNull } from 'drizzle-orm';
import { files, type FileInsertModel, type FileSelectModel } from '@racona/database/schemas';
import type { StoredFile, FileScope } from './types';
import { mapToStoredFile, toUrlPath } from './stored-file';

/**
 * Egy tárolási útvonal lehetséges alakjai az adatbázisban
 * (`/` elválasztóval, illetve a régi, Windows alatt mentett `\` változat).
 */
function storagePathVariants(storagePath: string): string[] {
	const posix = toUrlPath(storagePath);
	const windows = posix.replace(/\//g, '\\');
	return posix === windows ? [posix] : [posix, windows];
}

export class FileRepository {
	/**
	 * Új fájl metaadat létrehozása az adatbázisban
	 * @param data - A fájl metaadatai
	 * @returns A létrehozott fájl StoredFile formátumban
	 */
	async create(data: FileInsertModel): Promise<StoredFile> {
		const [result] = await db.insert(files).values(data).returning();
		return mapToStoredFile(result);
	}

	/**
	 * Fájl keresése publicId alapján
	 * @param publicId - A fájl publikus azonosítója
	 * @returns A fájl StoredFile formátumban vagy undefined
	 */
	async findByPublicId(publicId: string): Promise<StoredFile | undefined> {
		const result = await db.query.files.findFirst({
			where: eq(files.publicId, publicId)
		});
		return result ? mapToStoredFile(result) : undefined;
	}

	/**
	 * Fájlok keresése kategória és scope alapján
	 * User scope esetén userId szűréssel
	 * @param category - A fájl kategóriája
	 * @param scope - A fájl scope-ja ('shared' vagy 'user')
	 * @param userId - A felhasználó ID-ja (user scope esetén kötelező)
	 * @returns A fájlok listája StoredFile formátumban
	 */
	async findByCategory(category: string, scope: FileScope, userId?: number): Promise<StoredFile[]> {
		let results: FileSelectModel[];

		if (scope === 'user' && userId !== undefined) {
			// User scope: csak a felhasználó fájljai
			results = await db.query.files.findMany({
				where: and(eq(files.category, category), eq(files.scope, scope), eq(files.userId, userId))
			});
		} else if (scope === 'shared') {
			// Shared scope: minden shared fájl a kategóriában
			results = await db.query.files.findMany({
				where: and(eq(files.category, category), eq(files.scope, scope))
			});
		} else {
			// User scope userId nélkül: üres lista
			results = [];
		}

		return results.map(mapToStoredFile);
	}

	/**
	 * Fájl törlése az adatbázisból
	 * @param publicId - A fájl publikus azonosítója
	 * @returns true ha sikeres volt a törlés, false ha nem található
	 */
	async delete(publicId: string): Promise<boolean> {
		const result = await db.delete(files).where(eq(files.publicId, publicId)).returning();
		return result.length > 0;
	}

	/**
	 * Felhasználó összes fájljának lekérdezése
	 * @param userId - A felhasználó ID-ja
	 * @returns A felhasználó fájljainak listája StoredFile formátumban
	 */
	async findByUserId(userId: number): Promise<StoredFile[]> {
		const results = await db.query.files.findMany({
			where: eq(files.userId, userId)
		});
		return results.map(mapToStoredFile);
	}

	/**
	 * Fájl nyers adatainak lekérdezése (belső használatra)
	 * @param publicId - A fájl publikus azonosítója
	 * @returns A fájl adatbázis rekordja vagy undefined
	 */
	async findRawByPublicId(publicId: string): Promise<FileSelectModel | undefined> {
		return db.query.files.findFirst({
			where: eq(files.publicId, publicId)
		});
	}

	/**
	 * Rekord keresése a fájl vagy a bélyegképe tárolási útvonala alapján
	 * @param storagePath - Relatív útvonal az uploads mappához képest
	 * @returns A fájl adatbázis rekordja vagy undefined
	 */
	async findRawByPath(storagePath: string): Promise<FileSelectModel | undefined> {
		const variants = storagePathVariants(storagePath);
		return db.query.files.findFirst({
			where: or(inArray(files.storagePath, variants), inArray(files.thumbnailPath, variants))
		});
	}

	/**
	 * Törölt felhasználóhoz tartozó user scope fájlok (az FK `set null` miatt userId = null)
	 * @param limit - Legfeljebb ennyi rekord
	 * @returns A rekordok listája
	 */
	async findOrphanedUserFiles(limit: number): Promise<FileSelectModel[]> {
		return db.query.files.findMany({
			where: and(eq(files.scope, 'user'), isNull(files.userId)),
			limit
		});
	}
}

// Singleton instance
export const fileRepository = new FileRepository();
