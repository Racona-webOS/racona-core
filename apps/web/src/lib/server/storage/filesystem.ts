/**
 * FileSystem szolgáltatás
 * Fájlrendszer műveletek a tárolási réteghez
 * Requirements: 2.1, 2.4, 2.5, 8.1, 8.2, 8.5
 */
import { mkdir, readFile, writeFile, unlink, access, constants } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { getUploadsPath, StorageError, STORAGE_CONFIG } from './types.js';

// ============================================================================
// Path Validation (Requirements: 8.1, 8.2)
// ============================================================================

/**
 * Elérési út validálása path traversal támadások ellen
 * Property 11: Path traversal védelem
 * @param inputPath - Az ellenőrizendő útvonal
 * @returns true ha az útvonal biztonságos, false egyébként
 */
export function validatePath(inputPath: string): boolean {
	// Üres útvonal nem érvényes
	if (!inputPath || inputPath.trim() === '') {
		return false;
	}

	// Abszolút útvonalak elutasítása
	if (path.isAbsolute(inputPath)) {
		return false;
	}

	// Windows-stílusú abszolút útvonalak elutasítása (pl. C:\)
	if (/^[a-zA-Z]:/.test(inputPath)) {
		return false;
	}

	// Path traversal szekvenciák elutasítása
	// Ellenőrizzük a ".." jelenlétét bármilyen formában
	const normalizedPath = inputPath.replace(/\\/g, '/');
	const segments = normalizedPath.split('/');

	for (const segment of segments) {
		if (segment === '..') {
			return false;
		}
	}

	// Null byte injection elutasítása
	if (inputPath.includes('\0')) {
		return false;
	}

	return true;
}

// ============================================================================
// Filename Sanitization (Requirements: 8.5)
// ============================================================================

/**
 * Fájlnév szanálása biztonsági okokból
 * Property 12: Fájlnév szanálás
 * @param filename - Az eredeti fájlnév
 * @returns A szanált fájlnév
 */
export function sanitizeFilename(filename: string): string {
	if (!filename || filename.trim() === '') {
		return `file-${randomUUID().slice(0, 8)}`;
	}

	// Kiterjesztés és név szétválasztása
	const ext = path.extname(filename);
	let name = path.basename(filename, ext);

	// Path separátorok eltávolítása
	name = name.replace(/[/\\]/g, '');

	// ".." szekvenciák eltávolítása
	name = name.replace(/\.\./g, '');

	// Csak alfanumerikus, kötőjel, aláhúzás és pont megtartása
	name = name.replace(/[^a-zA-Z0-9\-_]/g, '');

	// Vezető pontok eltávolítása (rejtett fájlok elkerülése)
	name = name.replace(/^\.+/, '');

	// Ha üres maradt a név, generálunk egyet
	if (!name) {
		name = `file-${randomUUID().slice(0, 8)}`;
	}

	// Kiterjesztés szanálása
	let sanitizedExt = ext.replace(/[^a-zA-Z0-9.]/g, '');
	// Biztosítjuk, hogy a kiterjesztés ponttal kezdődik
	if (sanitizedExt && !sanitizedExt.startsWith('.')) {
		sanitizedExt = '.' + sanitizedExt;
	}

	// Hossz korlátozása
	const maxNameLength = STORAGE_CONFIG.maxFilenameLength - sanitizedExt.length;
	if (name.length > maxNameLength) {
		name = name.slice(0, maxNameLength);
	}

	return name + sanitizedExt;
}

// ============================================================================
// Unique Filename Generation (Requirements: 2.4)
// ============================================================================

/**
 * Ellenőrzi, hogy egy fájl létezik-e
 * @param filePath - A fájl útvonala
 * @returns true ha létezik, false egyébként
 */
async function fileExists(filePath: string): Promise<boolean> {
	try {
		await access(filePath, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

/**
 * Egyedi fájlnév generálása ha a fájl már létezik
 * Property 2: Egyedi fájlnév generálás
 * @param directory - A könyvtár útvonala
 * @param filename - Az eredeti fájlnév
 * @returns Egyedi fájlnév
 */
export async function generateUniqueFilename(directory: string, filename: string): Promise<string> {
	const sanitized = sanitizeFilename(filename);
	const fullPath = path.join(directory, sanitized);

	// Ha nem létezik, visszaadjuk az eredeti nevet
	if (!(await fileExists(fullPath))) {
		return sanitized;
	}

	// Kiterjesztés és név szétválasztása
	const ext = path.extname(sanitized);
	const name = path.basename(sanitized, ext);

	// Egyedi suffix generálása UUID-vel
	let counter = 1;
	let uniqueFilename: string;

	do {
		// UUID-alapú suffix a garantált egyediségért
		const suffix = randomUUID().slice(0, 8);
		uniqueFilename = `${name}-${suffix}${ext}`;
		counter++;

		// Biztonsági limit - ne fussunk végtelen ciklusba
		if (counter > 100) {
			uniqueFilename = `${name}-${randomUUID()}${ext}`;
			break;
		}
	} while (await fileExists(path.join(directory, uniqueFilename)));

	return uniqueFilename;
}

// ============================================================================
// Storage Path Generation (Requirements: 2.1, 2.2)
// ============================================================================

/**
 * Tárolási útvonal generálása kategória, scope és userId alapján
 * Property 1: Tárolási útvonal formátum
 * @param category - A fájl kategóriája
 * @param scope - A fájl scope-ja ('shared' vagy 'user')
 * @param userId - A felhasználó ID-ja (user scope esetén kötelező)
 * @returns A relatív tárolási útvonal
 */
export function generateStoragePath(
	category: string,
	scope: 'shared' | 'user',
	userId?: number | null
): string {
	const scopeDir = scope === 'shared' ? 'shared' : `user-${userId}`;
	// Mindig `/` elválasztó: az útvonal adatbázisba és URL-be is kerül
	return path.posix.join(category, scopeDir);
}

// ============================================================================
// File System Operations (Requirements: 2.1, 2.5)
// ============================================================================

/**
 * Fájl mentése a fájlrendszerbe
 * @param buffer - A fájl tartalma
 * @param category - A fájl kategóriája
 * @param scope - A fájl scope-ja
 * @param filename - A fájlnév
 * @param userId - A felhasználó ID-ja (user scope esetén)
 * @returns A mentett fájl útvonala és neve
 */
export async function saveToFileSystem(
	buffer: Buffer,
	category: string,
	scope: 'shared' | 'user',
	filename: string,
	userId?: number | null
): Promise<{ path: string; filename: string }> {
	// Útvonal validálása
	if (!validatePath(category)) {
		throw new StorageError('Invalid category path', 'INVALID_PATH');
	}

	// Relatív útvonal generálása
	const relativePath = generateStoragePath(category, scope, userId);
	const uploadsPath = getUploadsPath();
	const fullDirPath = path.join(uploadsPath, relativePath);

	// Könyvtár létrehozása ha nem létezik
	await mkdir(fullDirPath, { recursive: true });

	// Egyedi fájlnév generálása
	const uniqueFilename = await generateUniqueFilename(fullDirPath, filename);
	const fullFilePath = path.join(fullDirPath, uniqueFilename);

	// Fájl írása
	try {
		await writeFile(fullFilePath, buffer);
	} catch (error) {
		throw new StorageError(
			`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
			'STORAGE_ERROR'
		);
	}

	// Relatív útvonal visszaadása (az uploads mappához képest, `/` elválasztóval)
	return {
		path: path.posix.join(relativePath, uniqueFilename),
		filename: uniqueFilename
	};
}

/**
 * Fájl törlése a fájlrendszerből
 * @param storagePath - A fájl relatív útvonala (az uploads mappához képest)
 */
export async function deleteFromFileSystem(storagePath: string): Promise<void> {
	// Útvonal validálása
	if (!validatePath(storagePath)) {
		throw new StorageError('Invalid storage path', 'INVALID_PATH');
	}

	const uploadsPath = getUploadsPath();
	const fullPath = path.join(uploadsPath, storagePath);

	// Ellenőrizzük, hogy a fájl az uploads mappán belül van
	const normalizedFullPath = path.normalize(fullPath);
	const normalizedUploadsPath = path.normalize(uploadsPath);

	if (!normalizedFullPath.startsWith(normalizedUploadsPath)) {
		throw new StorageError('Path traversal attempt detected', 'INVALID_PATH');
	}

	try {
		await unlink(fullPath);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			throw new StorageError('File not found', 'FILE_NOT_FOUND');
		}
		throw new StorageError(
			`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
			'STORAGE_ERROR'
		);
	}
}

/**
 * Fájl olvasása a fájlrendszerből
 * @param storagePath - A fájl relatív útvonala (az uploads mappához képest)
 * @returns A fájl tartalma
 */
export async function readFromFileSystem(storagePath: string): Promise<Buffer> {
	// Útvonal validálása
	if (!validatePath(storagePath)) {
		throw new StorageError('Invalid storage path', 'INVALID_PATH');
	}

	const uploadsPath = getUploadsPath();
	const fullPath = path.join(uploadsPath, storagePath);

	// Ellenőrizzük, hogy a fájl az uploads mappán belül van
	const normalizedFullPath = path.normalize(fullPath);
	const normalizedUploadsPath = path.normalize(uploadsPath);

	if (!normalizedFullPath.startsWith(normalizedUploadsPath)) {
		throw new StorageError('Path traversal attempt detected', 'INVALID_PATH');
	}

	try {
		return await readFile(fullPath);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			throw new StorageError('File not found', 'FILE_NOT_FOUND');
		}
		throw new StorageError(
			`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
			'STORAGE_ERROR'
		);
	}
}
