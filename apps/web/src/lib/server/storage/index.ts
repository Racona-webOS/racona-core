/**
 * FileStorage modul index (szerver oldal)
 * Requirements: 9.2
 *
 * A remote function-ök a kliens-elérhető $lib/storage mappában vannak
 * (saveFile, listFiles, deleteFile, getFileMetadata, deleteBackground);
 * ez a modul a szerver oldali szolgáltatásokat, típusokat és sémákat exportálja.
 */

// ============================================================================
// Types
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
	GetFileMetadataResult,
	StorageErrorCode
} from './types.js';

export {
	STORAGE_CONFIG,
	getUploadsPath,
	STORAGE_ERROR_CODES,
	StorageError,
	getHttpStatusForError
} from './types.js';

// ============================================================================
// Services
// ============================================================================

export { fileRepository } from './file-repository.js';
export { removeStoredFile, cleanupOrphanedUserFiles } from './file-service.js';
export { getMaxUploadBytes } from './limits.js';
export {
	SHARED_FILES_PERMISSION,
	canWriteScope,
	canDeleteFile,
	canReadFileMetadata
} from './policy.js';
export { resolveFileResponseType, getMimeTypeFromExtension } from './content-type.js';
export { THUMBNAIL_PREFIX, mapToStoredFile } from './stored-file.js';

// ============================================================================
// Schemas
// ============================================================================

export {
	scopeSchema,
	categorySchema,
	fileIdSchema,
	saveFileOptionsSchema,
	saveFileInputSchema,
	listFilesInputSchema,
	deleteFileInputSchema,
	getFileMetadataInputSchema
} from '$lib/storage/schemas.js';

export type {
	SaveFileInputSchema,
	ListFilesInputSchema,
	DeleteFileInputSchema,
	GetFileMetadataInputSchema
} from '$lib/storage/schemas.js';
