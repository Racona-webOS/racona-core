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
	REQUIRED_FILES: ['manifest.json'],
	/** Az AI asszisztens tudásbázisának mappája a csomagban */
	KNOWLEDGE_BASE_DIR: 'knowledge-base/',
	/** A tudásbázis maximális mérete (2 MB) */
	MAX_KNOWLEDGE_BASE_SIZE: 2 * 1024 * 1024,
	/** A Súgó alkalmazásban megjelenő plugin dokumentáció mappája a csomagban */
	HELP_DIR: 'help/',
	/** A súgóban megengedett fájltípusok: markdown oldalak és képek */
	HELP_FILE_PATTERN: /\.(md|png|jpe?g|gif|webp|svg)$/i,
	/** A súgó maximális mérete (10 MB, a képek miatt nagyobb, mint a tudásbázisé) */
	MAX_HELP_SIZE: 10 * 1024 * 1024
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

			// Tudásbázis: csak markdown fájlok, korlátozott méretben
			errors.push(...this.validateKnowledgeBase(entries));

			// Súgó: csak markdown oldalak és képek, korlátozott méretben
			errors.push(...this.validateHelp(entries));

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
	 * A help/ mappa ellenőrzése: csak .md és képfájlok, összesen legfeljebb 10 MB
	 */
	private validateHelp(entries: AdmZip.IZipEntry[]): ValidationError[] {
		const errors: ValidationError[] = [];
		let totalSize = 0;

		for (const entry of entries) {
			if (entry.isDirectory || !entry.entryName.startsWith(ZIP_CONFIG.HELP_DIR)) continue;

			if (!ZIP_CONFIG.HELP_FILE_PATTERN.test(entry.entryName)) {
				errors.push({
					code: PluginErrorCode.INVALID_PACKAGE,
					message: `Only Markdown and image files are allowed in help/: ${entry.entryName}`
				});
			}
			totalSize += entry.header.size;
		}

		if (totalSize > ZIP_CONFIG.MAX_HELP_SIZE) {
			const maxSizeMB = ZIP_CONFIG.MAX_HELP_SIZE / (1024 * 1024);
			errors.push({
				code: PluginErrorCode.INVALID_PACKAGE,
				message: `help/ exceeds the maximum size of ${maxSizeMB} MB`
			});
		}

		return errors;
	}

	/**
	 * A knowledge-base/ mappa ellenőrzése: csak .md/.mdx fájlok, összesen legfeljebb 2 MB
	 */
	private validateKnowledgeBase(entries: AdmZip.IZipEntry[]): ValidationError[] {
		const errors: ValidationError[] = [];
		let totalSize = 0;

		for (const entry of entries) {
			if (entry.isDirectory || !entry.entryName.startsWith(ZIP_CONFIG.KNOWLEDGE_BASE_DIR)) {
				continue;
			}
			if (!/\.mdx?$/i.test(entry.entryName)) {
				errors.push({
					code: PluginErrorCode.INVALID_PACKAGE,
					message: `Only Markdown files are allowed in knowledge-base/: ${entry.entryName}`
				});
			}
			totalSize += entry.header.size;
		}

		if (totalSize > ZIP_CONFIG.MAX_KNOWLEDGE_BASE_SIZE) {
			const maxSizeMB = ZIP_CONFIG.MAX_KNOWLEDGE_BASE_SIZE / (1024 * 1024);
			errors.push({
				code: PluginErrorCode.INVALID_PACKAGE,
				message: `knowledge-base/ exceeds the maximum size of ${maxSizeMB} MB`
			});
		}

		return errors;
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
