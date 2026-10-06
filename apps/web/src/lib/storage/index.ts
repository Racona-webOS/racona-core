/**
 * Storage modul exportok (kliens-elérhető)
 */

// Remote functions
export { saveFile } from './save-file.remote.js';
export { listFiles } from './list-files.remote.js';
export { deleteFile } from './delete-file.remote.js';
export { getFileMetadata } from './get-file-metadata.remote.js';
export { deleteBackground } from './delete-background.remote.js';

// Méretkorlát
export {
	DEFAULT_BODY_SIZE_LIMIT,
	DEFAULT_MAX_UPLOAD_BYTES,
	maxUploadBytesForBodyLimit,
	formatBytes
} from './limits.js';

// Types
export type {
	FileScope,
	StoredFile,
	SaveFileInput,
	SaveFileOptions,
	SaveFileResult,
	ListFilesInput,
	ListFilesResult,
	DeleteFileInput,
	DeleteFileResult,
	GetFileMetadataInput,
	GetFileMetadataResult
} from './types.js';
