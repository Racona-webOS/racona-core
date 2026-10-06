/**
 * File Uploader típus definíciók
 * Requirements: 1.1-1.7
 */

import { DEFAULT_MAX_UPLOAD_BYTES } from '$lib/storage/limits.js';

// ============================================================================
// Fájl típus konstansok
// ============================================================================

/**
 * Fájl típus kategóriák és engedélyezett kiterjesztéseik.
 * SVG és BMP nincs köztük: az SVG-t a tartalom alapú típusfelismerés nem ismeri fel
 * (és a böngészőben szkriptet futtathatna), a BMP-t a sharp nem tudja beolvasni.
 */
export const FILE_TYPE_EXTENSIONS: Record<string, string[]> = {
	image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
	document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'odt'],
	mixed: [] // Minden típus engedélyezett
};

/** MIME típusok kategóriánként */
export const MIME_TYPE_MAP: Record<string, string[]> = {
	image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
	document: [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.ms-excel',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'text/plain',
		'text/csv',
		'application/vnd.oasis.opendocument.text'
	]
};

// ============================================================================
// Alapértelmezett konfiguráció
// ============================================================================

/** Alapértelmezett komponens konfiguráció. */
export const DEFAULT_CONFIG = {
	// 7 MB: a base64 kódolt kérés így még belefér az alapértelmezett 10 MB-os BODY_SIZE_LIMIT-be
	maxFileSize: DEFAULT_MAX_UPLOAD_BYTES,
	maxFiles: 1,
	fileType: 'mixed' as const,
	allowedExtensions: [] as string[],
	generateThumbnail: false,
	maxImageWidth: undefined as number | undefined,
	maxImageHeight: undefined as number | undefined,
	showInstructions: true
};

/** Bélyegkép generálás konfiguráció. */
export const THUMBNAIL_CONFIG = {
	maxWidth: 200,
	maxHeight: 200,
	quality: 80
};

// ============================================================================
// Típus definíciók
// ============================================================================

/** Fájl típus kategória */
export type FileType = 'image' | 'document' | 'mixed';

/** Fájl feltöltési státusz */
export type FileStatus = 'pending' | 'uploading' | 'completed' | 'error';

/** Feldolgozott fájl adatai */
export interface ProcessedFile {
	/** Egyedi azonosító */
	id: string;
	/** Eredeti fájlnév */
	originalName: string;
	/** MIME típus */
	mimeType: string;
	/** Fájlméret bájtban */
	size: number;
	/** Fájl URL */
	url: string;
	/** Tárolt fájlnév (a szanálás és az egyedivé tétel után; eltérhet az eredetitől) */
	filename?: string;
	/** Bélyegkép URL (opcionális) */
	thumbnailUrl?: string;
	/** Kép dimenziók (opcionális) */
	dimensions?: {
		width: number;
		height: number;
	};
}

/** Feltöltés eredménye */
export interface UploadResult {
	/** Sikeres volt-e a feltöltés */
	success: boolean;
	/** Feldolgozott fájl adatai */
	file?: ProcessedFile;
	/** Hibaüzenet */
	error?: string;
}

/** Feltöltési hiba */
export interface UploadError {
	/** Hibakód */
	code: string;
	/** Hibaüzenet */
	message: string;
	/** Érintett mező (opcionális) */
	field?: string;
}

/** Fájl elem a feltöltési listában */
export interface FileItem {
	/** Egyedi azonosító */
	id: string;
	/** Fájl objektum */
	file: File;
	/** Feltöltési státusz */
	status: FileStatus;
	/** Feltöltési folyamat (0-100) */
	progress: number;
	/** Hibaüzenet (opcionális) */
	error?: string;
	/** Feldolgozott fájl eredménye (opcionális) */
	result?: ProcessedFile;
}

/** Feltöltési állapot */
export interface UploadState {
	/** Fájlok listája */
	files: FileItem[];
	/** Drag-and-drop aktív */
	isDragging: boolean;
	/** Feltöltés folyamatban */
	isUploading: boolean;
}

/** Fájl hozzáférési köre */
export type FileScope = 'shared' | 'user';

/** Feltöltő mód típusa */
export type UploaderMode = 'standard' | 'instant';

/** FileUploader komponens props */
export interface FileUploaderProps {
	/** A fájl funkcionális kategóriája (pl. "backgrounds", "documents", "avatars") */
	category: string;
	/** A fájl hozzáférési köre */
	scope: FileScope;
	/** Feltöltő mód (alapértelmezett: 'standard') */
	mode?: UploaderMode;
	/**
	 * Maximum fájlméret bájtban (alapértelmezett: 7 MB). A szerver a BODY_SIZE_LIMIT
	 * kb. háromnegyedénél nagyobb fájlt nem fogad (base64 kódolás).
	 */
	maxFileSize?: number;
	/** Maximum feltölthető fájlok száma (alapértelmezett: 1) */
	maxFiles?: number;
	/** Fájl típus kategória (alapértelmezett: 'mixed') */
	fileType?: FileType;
	/** Engedélyezett kiterjesztések listája */
	allowedExtensions?: string[];
	/** Bélyegkép generálás engedélyezése (alapértelmezett: false) */
	generateThumbnail?: boolean;
	/** Maximum képszélesség pixelben */
	maxImageWidth?: number;
	/** Maximum képmagasság pixelben */
	maxImageHeight?: number;
	/** Látszódjanak-e a feltöltési kritériumok */
	showInstructions?: boolean;
	/** Feltöltés befejezésekor hívott callback */
	onUploadComplete?: (result: UploadResult) => void;
	/** Hiba esetén hívott callback */
	onError?: (error: UploadError) => void;
	/** Feltöltés megkezdésekor hívott callback (csak instant módban) */
	onUploadStart?: () => void;
}

// ============================================================================
// Validációs típusok
// ============================================================================

/** Validációs hiba */
export interface ValidationError {
	/** Hibakód */
	code: string;
	/** Hibaüzenet */
	message: string;
	/** Érintett mező (opcionális) */
	field?: string;
}

/** Validációs eredmény */
export interface ValidationResult {
	/** Érvényes-e */
	valid: boolean;
	/** Hibák listája */
	errors: ValidationError[];
}

/** Kliens oldali validációs konfiguráció */
export interface ClientValidationConfig {
	/** Maximum fájlméret */
	maxFileSize: number;
	/** Maximum fájlszám */
	maxFiles: number;
	/** Engedélyezett kiterjesztések */
	allowedExtensions: string[];
	/** Fájl típus kategória */
	fileType: FileType;
}

// ============================================================================
// Remote function típusok
// ============================================================================

/** Upload input opciók */
export interface UploadOptions {
	/** Bélyegkép generálás */
	generateThumbnail: boolean;
	/** Maximum képszélesség */
	maxImageWidth?: number;
	/** Maximum képmagasság */
	maxImageHeight?: number;
}

/** Upload input a remote function-höz */
export interface UploadInput {
	/** Base64 kódolt fájl adat */
	fileData: string;
	/** Fájlnév */
	fileName: string;
	/** MIME típus */
	mimeType: string;
	/** Feldolgozási opciók */
	options: UploadOptions;
}
