/**
 * File Repository - Adatbázis műveletek a fájl metaadatokhoz
 * Requirements: 7.3, 7.4, 7.5
 */
import db from '$lib/server/database';
import { eq, and } from 'drizzle-orm';
import { files, type FileInsertModel, type FileSelectModel } from '@racona/database/schemas';
import type { StoredFile, FileScope } from './types';

/**
 * Adatbázis rekord konvertálása StoredFile interfészre
 */
function mapToStoredFile(record: FileSelectModel): StoredFile {
	const scopePath = record.scope === 'user' ? `user-${record.userId}` : 'shared';
	const url = `/api/files/${record.category}/${scopePath}/${record.filename}`;
	const thumbnailUrl = record.thumbnailPath ? `/api/files/${record.thumbnailPath}` : undefined;

	return {
		id: record.publicId,
		filename: record.filename,
		originalName: record.originalName,
		category: record.category,
		scope: record.scope as FileScope,
		userId: record.userId,
		mimeType: record.mimeType,
		size: record.size,
		storagePath: record.storagePath,
		url,
		thumbnailUrl,
		createdAt: record.createdAt
	};
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
}

// Singleton instance
export const fileRepository = new FileRepository();
