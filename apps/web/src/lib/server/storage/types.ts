/**
 * FileStorage szerver oldali konstansok és hibakezelés
 * Requirements: 2.6, 3.4, 4.1, 5.2
 */
import path from 'path';

// ============================================================================
// Típusok (a kliens-elérhető $lib/storage/types.ts-ből, egy helyen definiálva)
// ============================================================================

export type {
	FileScope,
	StoredFile,
	SaveFileOptions,
	SaveFileInput,
	SaveFileResult,
	ListFilesInput,
	ListFilesResult,
	DeleteFileInput,
	DeleteFileResult,
	GetFileMetadataInput,
	GetFileMetadataResult
} from '$lib/storage/types';

// ============================================================================
// Tárolási konfiguráció
// ============================================================================

/** Alapértelmezett tárolási konfiguráció */
export const STORAGE_CONFIG = {
	/**
	 * Uploads mappa neve
	 * A futtatási környezet gyökeréhez relatív (process.cwd())
	 * Deploymentkor ez az alkalmazás mappája mellett lesz
	 */
	uploadsDir: 'uploads',

	/** Maximum fájlnév hossz */
	maxFilenameLength: 255,

	/** Engedélyezett kategóriák (opcionális korlátozás) */
	allowedCategories: ['backgrounds', 'documents', 'avatars', 'images'],

	/** Cache-Control max-age (1 óra). Minden fájl bejelentkezéshez kötött, ezért `private`. */
	cacheMaxAge: 3600
} as const;

/**
 * Uploads mappa abszolút útvonalának meghatározása
 * A process.cwd() a futtatási környezet gyökerét adja vissza
 */
export function getUploadsPath(): string {
	return path.join(process.cwd(), STORAGE_CONFIG.uploadsDir);
}

// ============================================================================
// Hibakódok és hibakezelés
// ============================================================================

/** Hibakódok */
export const STORAGE_ERROR_CODES = {
	FILE_NOT_FOUND: 'FILE_NOT_FOUND',
	PERMISSION_DENIED: 'PERMISSION_DENIED',
	INVALID_PATH: 'INVALID_PATH',
	STORAGE_ERROR: 'STORAGE_ERROR',
	INVALID_CATEGORY: 'INVALID_CATEGORY',
	UNAUTHORIZED: 'UNAUTHORIZED',
	VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const;

/** Hibakód típus */
export type StorageErrorCode = keyof typeof STORAGE_ERROR_CODES;

/** Egyedi hiba osztály a tárolási hibákhoz */
export class StorageError extends Error {
	constructor(
		message: string,
		public code: StorageErrorCode
	) {
		super(message);
		this.name = 'StorageError';
	}
}

/** HTTP státusz kód lekérése hibakód alapján */
export function getHttpStatusForError(code: StorageErrorCode): number {
	const statusMap: Record<StorageErrorCode, number> = {
		FILE_NOT_FOUND: 404,
		PERMISSION_DENIED: 403,
		INVALID_PATH: 400,
		STORAGE_ERROR: 500,
		INVALID_CATEGORY: 400,
		UNAUTHORIZED: 401,
		VALIDATION_ERROR: 400
	};
	return statusMap[code];
}
