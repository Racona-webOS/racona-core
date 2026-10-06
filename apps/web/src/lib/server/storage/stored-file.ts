/**
 * Adatbázis rekord → StoredFile leképezés és URL-képzés (DB nélkül tesztelhető).
 */

import type { FileSelectModel } from '@racona/database/schemas';
import type { StoredFile, FileScope } from '$lib/storage/types';

/** A bélyegképek fájlnév-előtagja. A /api/files/list nem listázza őket. */
export const THUMBNAIL_PREFIX = 'thumb-';

/**
 * A bélyegkép-előtag levágása a fájlnév elejéről, hogy feltöltött fájl ne
 * látszódjon bélyegképnek (a /api/files/list a `thumb-` fájlokat kihagyja).
 * @param fileName - Az eredeti fájlnév.
 */
export function stripThumbnailPrefix(fileName: string): string {
	let name = fileName;
	while (name.toLowerCase().startsWith(THUMBNAIL_PREFIX)) {
		name = name.slice(THUMBNAIL_PREFIX.length);
	}
	return name;
}

/**
 * Tárolási útvonal URL-formában: mindig `/` elválasztóval
 * (a régi, Windows alatt mentett rekordokban `\` is lehet).
 * @param storagePath - Relatív útvonal az uploads mappához képest.
 */
export function toUrlPath(storagePath: string): string {
	return storagePath.replace(/\\/g, '/').replace(/^\/+/, '');
}

/**
 * Adatbázis rekord konvertálása StoredFile interfészre.
 * @param record - A platform.files rekord.
 */
export function mapToStoredFile(record: FileSelectModel): StoredFile {
	const scopePath = record.scope === 'user' ? `user-${record.userId}` : 'shared';
	const url = `/api/files/${record.category}/${scopePath}/${record.filename}`;
	const thumbnailUrl = record.thumbnailPath
		? `/api/files/${toUrlPath(record.thumbnailPath)}`
		: undefined;

	return {
		id: record.publicId,
		filename: record.filename,
		originalName: record.originalName,
		category: record.category,
		scope: record.scope as FileScope,
		userId: record.userId,
		mimeType: record.mimeType,
		size: record.size,
		storagePath: toUrlPath(record.storagePath),
		url,
		thumbnailUrl,
		createdAt: record.createdAt
	};
}
