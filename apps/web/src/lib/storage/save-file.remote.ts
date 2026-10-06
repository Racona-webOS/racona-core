/**
 * SaveFile Remote Function (kliens-elérhető)
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 *
 * Fájl mentése a fájlrendszerbe és metaadat tárolása az adatbázisban.
 */

import { command, getRequestEvent } from '$app/server';
import { randomUUID } from 'crypto';
import { saveFileInputSchema } from './schemas.js';
import { saveToFileSystem, deleteFromFileSystem } from '$lib/server/storage/filesystem.js';
import { fileRepository } from '$lib/server/storage/file-repository.js';
import { StorageError } from '$lib/server/storage/types.js';
import { canWriteScope } from '$lib/server/storage/policy.js';
import { getMaxUploadBytes, estimateDecodedSize } from '$lib/server/storage/limits.js';
import { THUMBNAIL_PREFIX, stripThumbnailPrefix } from '$lib/server/storage/stored-file.js';
import { permissionRepository } from '$lib/server/database/repositories';
import type { SaveFileResult } from './types.js';
import { formatBytes } from './limits.js';
import { validateMimeType, isImageMimeType } from '$lib/components/file-uploader/mime-validator.js';
import { processImage } from '$lib/components/file-uploader/image-processor.js';

// ============================================================================
// Segédfüggvények
// ============================================================================

/**
 * Base64 string dekódolása Buffer-ré.
 * @param base64 - Base64 kódolt string.
 * @returns Buffer.
 */
function decodeBase64(base64: string): Buffer {
	const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
	return Buffer.from(base64Data, 'base64');
}

/** Hibaüzenet a mérethatárt meghaladó fájlhoz. */
function fileTooLargeError(maxBytes: number): SaveFileResult {
	return {
		success: false,
		error: `File is too large (max ${formatBytes(maxBytes)})`
	};
}

/** Már kiírt fájlok eltávolítása sikertelen mentés után (a hiba nem fontos). */
async function removeWrittenFiles(paths: string[]): Promise<void> {
	for (const storagePath of paths) {
		try {
			await deleteFromFileSystem(storagePath);
		} catch {
			// A fájl már nem létezik, nem hiba
		}
	}
}

// ============================================================================
// Remote Function
// ============================================================================

/**
 * Fájl mentése a fájlrendszerbe és metaadat tárolása az adatbázisban.
 *
 * @param input - A mentendő fájl adatai.
 * @returns A mentés eredménye.
 */
export const saveFile = command(saveFileInputSchema, async (input): Promise<SaveFileResult> => {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return {
			success: false,
			error: 'User not authenticated'
		};
	}

	const { fileData, fileName, mimeType, category, scope, options } = input;
	const userId = parseInt(locals.user.id);

	// Shared fájlt mindenki lát, ezért külön jogosultság kell hozzá
	if (scope !== 'user') {
		const permissions = await permissionRepository.findPermissionsForUser(userId);
		const access = canWriteScope(scope, permissions);
		if (!access.allowed) {
			return { success: false, error: access.error };
		}
	}

	const maxBytes = getMaxUploadBytes();
	if (estimateDecodedSize(fileData) > maxBytes) {
		return fileTooLargeError(maxBytes);
	}

	const writtenPaths: string[] = [];

	try {
		const buffer = decodeBase64(fileData);
		if (buffer.length > maxBytes) {
			return fileTooLargeError(maxBytes);
		}

		const mimeValidation = await validateMimeType(buffer, 'mixed', mimeType);
		if (!mimeValidation.valid) {
			return {
				success: false,
				error: mimeValidation.error || 'Invalid file type'
			};
		}

		const detectedMimeType = mimeValidation.detectedMimeType || mimeType;
		const ownerId = scope === 'user' ? userId : null;
		const storedName = stripThumbnailPrefix(fileName);

		let processedBuffer = buffer;
		let processedMimeType = detectedMimeType;
		let thumbnailBuffer: Buffer | undefined;

		if (isImageMimeType(detectedMimeType)) {
			const processedResult = await processImage(buffer, {
				maxWidth: options.maxImageWidth,
				maxHeight: options.maxImageHeight,
				generateThumbnail: options.generateThumbnail
			});

			processedBuffer = processedResult.processed.buffer;
			processedMimeType = processedResult.processed.mimeType;

			if (processedResult.thumbnail && options.generateThumbnail) {
				thumbnailBuffer = processedResult.thumbnail.buffer;
			}
		}

		const fileResult = await saveToFileSystem(
			processedBuffer,
			category,
			scope,
			storedName,
			ownerId
		);
		writtenPaths.push(fileResult.path);

		// A bélyegkép neve a tárolt (egyedivé tett) fájlnévből jön: thumb-{filename}
		let thumbnailPath: string | null = null;
		if (thumbnailBuffer) {
			const thumbResult = await saveToFileSystem(
				thumbnailBuffer,
				category,
				scope,
				`${THUMBNAIL_PREFIX}${fileResult.filename}`,
				ownerId
			);
			writtenPaths.push(thumbResult.path);
			thumbnailPath = thumbResult.path;
		}

		const publicId = randomUUID();

		const storedFile = await fileRepository.create({
			publicId,
			filename: fileResult.filename,
			originalName: fileName,
			category,
			scope,
			userId: ownerId,
			mimeType: processedMimeType,
			size: processedBuffer.length,
			storagePath: fileResult.path,
			thumbnailPath
		});

		return {
			success: true,
			file: storedFile
		};
	} catch (error) {
		console.error('[FileStorage] Save file error:', error);
		await removeWrittenFiles(writtenPaths);

		if (error instanceof StorageError) {
			return {
				success: false,
				error: error.message
			};
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
});
