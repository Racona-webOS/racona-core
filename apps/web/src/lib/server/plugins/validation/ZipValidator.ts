/**
 * ZIP Validator
 *
 * ZIP fájl struktúra validálása és kicsomagolása.
 */

import AdmZip from 'adm-zip';
import type { ValidationError } from '@racona/database';
import { PluginErrorCode } from '@racona/database';
import path from 'path';

/**
 * ZIP validálási konfiguráció
 */
export const ZIP_CONFIG = {
	/** Maximális kicsomagolt méret (50 MB) */
	MAX_UNCOMPRESSED_SIZE: 50 * 1024 * 1024,
	/** Maximális tömörítési arány (zip bomb védelem) */
	MAX_COMPRESSION_RATIO: 100,
	/** Kötelező fájlok */
	REQUIRED_FILES: ['manifest.json']
} as const;

/**
 * ZIP validálási eredmény
 */
export interface ZipValidationResult {
	valid: boolean;
	errors: ValidationError[];
	zip?: AdmZip;
	files?: Map<string, Buffer>;
}

/**
 * ZIP Validator osztály
 */
export class ZipValidator {
	/**
	 * ZIP fájl validálása
	 *
	 * @param filePath - ZIP fájl útvonala
	 * @returns Validálási eredmény
	 */
	async validate(filePath: string): Promise<ZipValidationResult> {
		const errors: ValidationError[] = [];

		try {
			// ZIP fájl betöltése
			const zip = new AdmZip(filePath);
			const entries = zip.getEntries();

			// Üres ZIP ellenőrzés
			if (entries.length === 0) {
				errors.push({
					code: PluginErrorCode.INVALID_ZIP,
					message: 'ZIP file is empty'
				});
				return { valid: false, errors };
			}

			// Kicsomagolt méret és tömörítési arány ellenőrzés
			let totalUncompressedSize = 0;
			let totalCompressedSize = 0;

			for (const entry of entries) {
				if (!entry.isDirectory) {
					totalUncompressedSize += entry.header.size;
					totalCompressedSize += entry.header.compressedSize;
				}
			}

			// Méret ellenőrzés
			if (totalUncompressedSize > ZIP_CONFIG.MAX_UNCOMPRESSED_SIZE) {
				const maxSizeMB = ZIP_CONFIG.MAX_UNCOMPRESSED_SIZE / (1024 * 1024);
				errors.push({
					code: PluginErrorCode.INVALID_ZIP,
					message: `Uncompressed size exceeds maximum of ${maxSizeMB} MB`
				});
			}

			// Zip bomb védelem
			if (totalCompressedSize > 0) {
				const compressionRatio = totalUncompressedSize / totalCompressedSize;
				if (compressionRatio > ZIP_CONFIG.MAX_COMPRESSION_RATIO) {
					errors.push({
						code: PluginErrorCode.INVALID_ZIP,
						message: 'Suspicious compression ratio detected (possible zip bomb)'
					});
				}
			}

			// Path traversal ellenőrzés
			for (const entry of entries) {
				if (this.hasPathTraversal(entry.entryName)) {
					errors.push({
						code: PluginErrorCode.INVALID_ZIP,
						message: `Path traversal detected in file: ${entry.entryName}`
					});
				}
			}

			// Kötelező fájlok ellenőrzése
			for (const requiredFile of ZIP_CONFIG.REQUIRED_FILES) {
				const found = entries.some(
					(entry) =>
						entry.entryName === requiredFile || entry.entryName.endsWith(`/${requiredFile}`)
				);

				if (!found) {
					errors.push({
						code: PluginErrorCode.MISSING_MANIFEST,
						message: `Required file missing: ${requiredFile}`
					});
				}
			}

			if (errors.length > 0) {
				return { valid: false, errors };
			}

			// Fájlok kicsomagolása memóriába
			const files = new Map<string, Buffer>();

			for (const entry of entries) {
				if (!entry.isDirectory) {
					try {
						const data = entry.getData();
						files.set(entry.entryName, data);
					} catch (error) {
						errors.push({
							code: PluginErrorCode.INVALID_ZIP,
							message: `Failed to extract file: ${entry.entryName}`,
							details: error
						});
					}
				}
			}

			if (errors.length > 0) {
				return { valid: false, errors };
			}

			return {
				valid: true,
				errors: [],
				zip,
				files
			};
		} catch (error) {
			errors.push({
				code: PluginErrorCode.INVALID_ZIP,
				message: 'Invalid ZIP file format',
				details: error instanceof Error ? error.message : String(error)
			});

			return { valid: false, errors };
		}
	}

	/**
	 * Path traversal ellenőrzés
	 *
	 * Ellenőrzi, hogy az útvonal tartalmaz-e ".." vagy abszolút útvonalat.
	 */
	private hasPathTraversal(filePath: string): boolean {
		// Normalizált útvonal
		const normalized = path.normalize(filePath);

		// Ellenőrzések
		return (
			normalized.includes('..') || // Relatív útvonal felfelé
			path.isAbsolute(normalized) || // Abszolút útvonal
			normalized.startsWith('/') || // Unix abszolút
			/^[a-zA-Z]:/.test(normalized) // Windows abszolút
		);
	}

	/**
	 * Fájl keresése a ZIP-ben
	 *
	 * @param files - Kicsomagolt fájlok
	 * @param fileName - Keresett fájlnév
	 * @returns Fájl tartalma vagy null
	 */
	findFile(files: Map<string, Buffer>, fileName: string): Buffer | null {
		// Pontos egyezés
		if (files.has(fileName)) {
			return files.get(fileName)!;
		}

		// Keresés útvonal végén
		for (const [path, content] of files.entries()) {
			if (path.endsWith(`/${fileName}`) || path.endsWith(`\\${fileName}`)) {
				return content;
			}
		}

		return null;
	}

	/**
	 * Könyvtár fájljainak lekérdezése
	 *
	 * @param files - Kicsomagolt fájlok
	 * @param dirPath - Könyvtár útvonala
	 * @returns Fájlok a könyvtárban
	 */
	getFilesInDirectory(files: Map<string, Buffer>, dirPath: string): Map<string, Buffer> {
		const result = new Map<string, Buffer>();
		const normalizedDir = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;

		for (const [path, content] of files.entries()) {
			if (path.startsWith(normalizedDir)) {
				const relativePath = path.substring(normalizedDir.length);
				result.set(relativePath, content);
			}
		}

		return result;
	}
}

/**
 * Singleton instance
 */
export const zipValidator = new ZipValidator();
