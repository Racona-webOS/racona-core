/**
 * Upload Manager
 *
 * Plugin csomagok feltöltésének kezelése validálással.
 * Integráció a meglévő file-uploader rendszerrel.
 */

import type { UploadResult } from '@racona/database';
import { getTempPath, ensureDir, PLUGIN_DIRS, getFileSize } from '../utils/filesystem';
import { PluginErrorCode } from '@racona/database';
import {
	validateExtension,
	validateFileSize,
	getFileExtension
} from '$lib/components/file-uploader/validation';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import { PLUGIN_PACKAGE_EXTENSION, PLUGIN_MAX_SIZE, PLUGIN_ALLOWED_MIME_TYPES } from '../config';

/**
 * Plugin feltöltési konfiguráció
 *
 * Kiterjeszti a meglévő file-uploader konfigurációt plugin-specifikus beállításokkal.
 */
export const PLUGIN_UPLOAD_CONFIG = {
	/** Maximális fájlméret - környezeti változóból */
	MAX_FILE_SIZE: PLUGIN_MAX_SIZE,
	/** Engedélyezett kiterjesztés - környezeti változóból */
	ALLOWED_EXTENSION: PLUGIN_PACKAGE_EXTENSION,
	/** Engedélyezett MIME típusok */
	ALLOWED_MIME_TYPES: PLUGIN_ALLOWED_MIME_TYPES
} as const;

/**
 * Fájl validálási eredmény
 */
export interface FileValidationResult {
	valid: boolean;
	errors: Array<{
		code: string;
		message: string;
	}>;
}

/**
 * Upload Manager osztály
 *
 * Használja a meglévő file-uploader validációs függvényeket,
 * de plugin-specifikus szabályokkal.
 */
export class UploadManager {
	/**
	 * Inicializálás - könyvtárak létrehozása
	 */
	async initialize(): Promise<void> {
		await ensureDir(PLUGIN_DIRS.TEMP);
	}

	/**
	 * Fájl validálása (kiterjesztés és méret)
	 *
	 * Használja a meglévő validációs függvényeket a file-uploader modulból.
	 */
	validateFile(file: File): FileValidationResult {
		const errors: Array<{ code: string; message: string }> = [];

		// Kiterjesztés ellenőrzés - meglévő függvény használata
		if (!validateExtension(file.name, [PLUGIN_UPLOAD_CONFIG.ALLOWED_EXTENSION ?? ''])) {
			errors.push({
				code: PluginErrorCode.INVALID_EXTENSION,
				message: `Invalid file extension. Only .${PLUGIN_UPLOAD_CONFIG.ALLOWED_EXTENSION} files are allowed.`
			});
		}

		// Fájlméret ellenőrzés - meglévő függvény használata
		if (!validateFileSize(file.size, PLUGIN_UPLOAD_CONFIG.MAX_FILE_SIZE ?? 0)) {
			const maxSizeMB = (PLUGIN_UPLOAD_CONFIG.MAX_FILE_SIZE ?? 0) / (1024 * 1024);
			errors.push({
				code: PluginErrorCode.FILE_TOO_LARGE,
				message: `File size exceeds maximum allowed size of ${maxSizeMB} MB.`
			});
		}

		// MIME type ellenőrzés (ha elérhető)
		const allowedMimeTypes: string[] = [...PLUGIN_UPLOAD_CONFIG.ALLOWED_MIME_TYPES];
		if (file.type && !allowedMimeTypes.includes(file.type)) {
			errors.push({
				code: PluginErrorCode.INVALID_EXTENSION,
				message: `Invalid MIME type: ${file.type}. Expected ZIP file.`
			});
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	/**
	 * Plugin csomag feltöltése
	 *
	 * @param file - A plugin csomag fájl (kiterjesztés: környezeti változóból)
	 * @param userId - A feltöltő rendszergazda azonosítója
	 * @returns Upload eredmény vagy hiba
	 */
	async uploadPackage(file: File, _userId: string): Promise<UploadResult> {
		try {
			// Fájl validálás - meglévő validációs logika használata
			const validation = this.validateFile(file);
			if (!validation.valid) {
				return {
					success: false,
					error: validation.errors.map((e) => e.message).join(', ')
				};
			}

			// Egyedi fájlnév generálása
			const uniqueId = randomUUID();
			const tempFileName = `${uniqueId}_${file.name}`;
			const tempPath = getTempPath(tempFileName);

			// Fájl mentése ideiglenes könyvtárba
			const buffer = Buffer.from(await file.arrayBuffer());
			await fs.writeFile(tempPath, buffer);

			// Méret ellenőrzés a mentett fájlon (double-check)
			const actualSize = await getFileSize(tempPath);
			if (actualSize > (PLUGIN_UPLOAD_CONFIG.MAX_FILE_SIZE ?? 0)) {
				// Fájl törlése
				await fs.unlink(tempPath);

				return {
					success: false,
					error: `File size exceeds maximum allowed size.`
				};
			}

			return {
				success: true,
				tempPath
			};
		} catch (error) {
			console.error('[PluginUploadManager] Upload error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown upload error'
			};
		}
	}

	/**
	 * Ideiglenes fájl törlése
	 */
	async cleanupTempFile(tempPath: string): Promise<void> {
		try {
			await fs.unlink(tempPath);
		} catch (error) {
			console.error('[PluginUploadManager] Error cleaning up temp file:', error);
		}
	}
}

/**
 * Singleton instance
 */
export const uploadManager = new UploadManager();
