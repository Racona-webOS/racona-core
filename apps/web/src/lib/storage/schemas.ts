/**
 * FileStorage Valibot sémák (kliens-elérhető)
 * Requirements: 9.1
 */
import * as v from 'valibot';

// ============================================================================
// Közös sémák
// ============================================================================

/** Scope validáció */
export const scopeSchema = v.picklist(['shared', 'user']);

/**
 * Az uploads mappa rendszer-almappái: a telepített pluginok és a plugin fájlok.
 * Kategóriaként nem használhatók, különben a core fájlkezelése beléjük írhatna.
 */
export const RESERVED_CATEGORIES: readonly string[] = ['plugins', 'plugin-files'];

/** Kategória validáció */
export const categorySchema = v.pipe(
	v.string(),
	v.minLength(1, 'Category is required'),
	v.maxLength(100, 'Category too long'),
	v.regex(/^[a-z0-9-]+$/, 'Category must be lowercase alphanumeric with hyphens'),
	v.check((value) => !RESERVED_CATEGORIES.includes(value), 'Reserved category')
);

/** Fájl azonosító validáció */
export const fileIdSchema = v.pipe(v.string(), v.minLength(1, 'File ID is required'));

// ============================================================================
// SaveFile séma
// ============================================================================

/** SaveFile opciók séma */
export const saveFileOptionsSchema = v.object({
	generateThumbnail: v.boolean(),
	maxImageWidth: v.optional(v.pipe(v.number(), v.minValue(1))),
	maxImageHeight: v.optional(v.pipe(v.number(), v.minValue(1)))
});

/** SaveFile input séma */
export const saveFileInputSchema = v.object({
	fileData: v.pipe(v.string(), v.minLength(1, 'File data is required')),
	fileName: v.pipe(
		v.string(),
		v.minLength(1, 'File name is required'),
		v.maxLength(255, 'File name too long')
	),
	mimeType: v.pipe(v.string(), v.minLength(1, 'MIME type is required')),
	category: categorySchema,
	scope: scopeSchema,
	options: saveFileOptionsSchema
});

/** SaveFile input típus a sémából */
export type SaveFileInputSchema = v.InferOutput<typeof saveFileInputSchema>;

// ============================================================================
// ListFiles séma
// ============================================================================

/** ListFiles input séma */
export const listFilesInputSchema = v.object({
	category: v.pipe(
		v.string(),
		v.minLength(1, 'Category is required'),
		v.maxLength(100, 'Category too long')
	),
	scope: scopeSchema
});

/** ListFiles input típus a sémából */
export type ListFilesInputSchema = v.InferOutput<typeof listFilesInputSchema>;

// ============================================================================
// DeleteFile séma
// ============================================================================

/** DeleteFile input séma */
export const deleteFileInputSchema = v.object({
	fileId: fileIdSchema
});

/** DeleteFile input típus a sémából */
export type DeleteFileInputSchema = v.InferOutput<typeof deleteFileInputSchema>;

// ============================================================================
// GetFileMetadata séma
// ============================================================================

/** GetFileMetadata input séma */
export const getFileMetadataInputSchema = v.object({
	fileId: fileIdSchema
});

/** GetFileMetadata input típus a sémából */
export type GetFileMetadataInputSchema = v.InferOutput<typeof getFileMetadataInputSchema>;
