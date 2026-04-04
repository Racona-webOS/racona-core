/**
 * Property-Based Tests for File Uploader Validation
 *
 * Feature: file-uploader
 *
 * Property 1: Kiterjesztés validáció
 * _Bármely_ fájlnévre és allowedExtensions listára, ha a lista nem üres és a fájl
 * kiterjesztése nem szerepel benne, akkor a validateExtension függvény MINDIG false-t
 * kell visszaadjon. Ha a kiterjesztés szerepel a listában, MINDIG true-t kell visszaadjon.
 * **Validates: Requirements 2.1**
 *
 * Property 2: Méretkorlát validáció
 * _Bármely_ fájlméretre és maxFileSize értékre, ha a fájlméret nagyobb mint maxFileSize,
 * akkor a validateFileSize függvény MINDIG false-t kell visszaadjon. Ha a fájlméret
 * kisebb vagy egyenlő, MINDIG true-t kell visszaadjon.
 * **Validates: Requirements 2.2**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	validateExtension,
	getFileExtension,
	validateFileSize,
	validateFileCount
} from '../validation.js';

// Minimum 100 iteráció property tesztenként
const testConfig = { numRuns: 100 };

// Arbitrary for valid file extensions (lowercase, 1-5 characters).
const extensionArb = fc.stringMatching(/^[a-z]{1,5}$/);

// Arbitrary for file name base (alphanumeric, 1-20 characters).
const fileNameBaseArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/);

// Arbitrary for generating a list of unique extensions.
const extensionListArb = fc.uniqueArray(extensionArb, { minLength: 1, maxLength: 10 });

describe('Extension Validation - Property 1: Kiterjesztés validáció', () => {
	/**
	 * Property 1a: Extension in allowed list returns true
	 *
	 * When a file has an extension that IS in the allowedExtensions list,
	 * validateExtension should ALWAYS return true.
	 *
	 * **Validates: Requirements 2.1**
	 */
	it('should return true when file extension is in allowed list', () => {
		fc.assert(
			fc.property(extensionListArb, fileNameBaseArb, (allowedExtensions, fileNameBase) => {
				// Pick a random extension from the allowed list
				const randomIndex = Math.floor(Math.random() * allowedExtensions.length);
				const chosenExtension = allowedExtensions[randomIndex];
				const fileName = `${fileNameBase}.${chosenExtension}`;

				const result = validateExtension(fileName, allowedExtensions);

				expect(result).toBe(true);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 1b: Extension NOT in allowed list returns false
	 *
	 * When a file has an extension that is NOT in the allowedExtensions list,
	 * validateExtension should ALWAYS return false.
	 *
	 * **Validates: Requirements 2.1**
	 */
	it('should return false when file extension is not in allowed list', () => {
		fc.assert(
			fc.property(
				extensionListArb,
				extensionArb,
				fileNameBaseArb,
				(allowedExtensions, fileExtension, fileNameBase) => {
					// Ensure the file extension is NOT in the allowed list
					if (allowedExtensions.includes(fileExtension)) {
						return true; // Skip this case
					}

					const fileName = `${fileNameBase}.${fileExtension}`;
					const result = validateExtension(fileName, allowedExtensions);

					expect(result).toBe(false);
					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 1c: Empty allowed list returns true for any file
	 *
	 * When allowedExtensions is empty, validateExtension should ALWAYS return true
	 * (all extensions are allowed).
	 *
	 * **Validates: Requirements 2.1**
	 */
	it('should return true when allowed extensions list is empty', () => {
		fc.assert(
			fc.property(extensionArb, fileNameBaseArb, (extension, fileNameBase) => {
				const fileName = `${fileNameBase}.${extension}`;
				const emptyAllowedList: string[] = [];

				const result = validateExtension(fileName, emptyAllowedList);

				expect(result).toBe(true);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 1d: Case insensitivity
	 *
	 * Extension validation should be case-insensitive. A file with extension "JPG"
	 * should match "jpg" in the allowed list.
	 *
	 * **Validates: Requirements 2.1**
	 */
	it('should be case-insensitive when matching extensions', () => {
		fc.assert(
			fc.property(extensionListArb, fileNameBaseArb, (allowedExtensions, fileNameBase) => {
				// Pick a random extension and convert to uppercase
				const randomIndex = Math.floor(Math.random() * allowedExtensions.length);
				const chosenExtension = allowedExtensions[randomIndex];
				const upperCaseExtension = chosenExtension.toUpperCase();
				const fileName = `${fileNameBase}.${upperCaseExtension}`;

				const result = validateExtension(fileName, allowedExtensions);

				expect(result).toBe(true);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 1e: File without extension returns false when list is non-empty
	 *
	 * When a file has no extension and the allowed list is non-empty,
	 * validateExtension should return false.
	 *
	 * **Validates: Requirements 2.1**
	 */
	it('should return false for files without extension when allowed list is non-empty', () => {
		fc.assert(
			fc.property(extensionListArb, fileNameBaseArb, (allowedExtensions, fileNameBase) => {
				// File without extension
				const fileName = fileNameBase;

				const result = validateExtension(fileName, allowedExtensions);

				expect(result).toBe(false);
				return true;
			}),
			testConfig
		);
	});
});

describe('getFileExtension Helper', () => {
	/**
	 * Extracts extension correctly from valid file names
	 */
	it('should extract extension correctly from file names', () => {
		fc.assert(
			fc.property(fileNameBaseArb, extensionArb, (base, ext) => {
				const fileName = `${base}.${ext}`;
				const result = getFileExtension(fileName);

				expect(result).toBe(ext.toLowerCase());
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Returns empty string for files without extension
	 */
	it('should return empty string for files without extension', () => {
		fc.assert(
			fc.property(fileNameBaseArb, (base) => {
				const result = getFileExtension(base);

				expect(result).toBe('');
				return true;
			}),
			testConfig
		);
	});
});

// ============================================================================
// Property 2: Méretkorlát validáció
// ============================================================================

// Arbitrary for positive file sizes (1 byte to 1GB)
const fileSizeArb = fc.integer({ min: 0, max: 1024 * 1024 * 1024 });

// Arbitrary for positive max file size limits (1 byte to 1GB)
const maxFileSizeArb = fc.integer({ min: 1, max: 1024 * 1024 * 1024 });

describe('File Size Validation - Property 2: Méretkorlát validáció', () => {
	/**
	 * Property 2a: File size within limit returns true
	 *
	 * When a file size is less than or equal to maxFileSize,
	 * validateFileSize should ALWAYS return true.
	 *
	 * **Validates: Requirements 2.2**
	 */
	it('should return true when file size is less than or equal to maxFileSize', () => {
		fc.assert(
			fc.property(maxFileSizeArb, (maxFileSize) => {
				// Generate a file size that is <= maxFileSize
				const fileSize = fc.sample(fc.integer({ min: 0, max: maxFileSize }), 1)[0];

				const result = validateFileSize(fileSize, maxFileSize);

				expect(result).toBe(true);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 2b: File size exceeding limit returns false
	 *
	 * When a file size is greater than maxFileSize,
	 * validateFileSize should ALWAYS return false.
	 *
	 * **Validates: Requirements 2.2**
	 */
	it('should return false when file size exceeds maxFileSize', () => {
		fc.assert(
			fc.property(
				maxFileSizeArb,
				fc.integer({ min: 1, max: 1024 * 1024 * 1024 }),
				(maxFileSize, extraSize) => {
					// File size is maxFileSize + extraSize (always greater)
					const fileSize = maxFileSize + extraSize;

					const result = validateFileSize(fileSize, maxFileSize);

					expect(result).toBe(false);
					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 2c: Exact boundary - file size equals maxFileSize returns true
	 *
	 * When a file size is exactly equal to maxFileSize,
	 * validateFileSize should return true (boundary is inclusive).
	 *
	 * **Validates: Requirements 2.2**
	 */
	it('should return true when file size exactly equals maxFileSize', () => {
		fc.assert(
			fc.property(maxFileSizeArb, (maxFileSize) => {
				const result = validateFileSize(maxFileSize, maxFileSize);

				expect(result).toBe(true);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 2d: Zero file size is always valid
	 *
	 * A file with size 0 should always be valid regardless of maxFileSize.
	 *
	 * **Validates: Requirements 2.2**
	 */
	it('should return true for zero file size', () => {
		fc.assert(
			fc.property(maxFileSizeArb, (maxFileSize) => {
				const result = validateFileSize(0, maxFileSize);

				expect(result).toBe(true);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 2e: Comparison is strictly mathematical
	 *
	 * For any fileSize and maxFileSize, the result should be equivalent to
	 * the mathematical comparison fileSize <= maxFileSize.
	 *
	 * **Validates: Requirements 2.2**
	 */
	it('should be equivalent to mathematical comparison fileSize <= maxFileSize', () => {
		fc.assert(
			fc.property(fileSizeArb, maxFileSizeArb, (fileSize, maxFileSize) => {
				const result = validateFileSize(fileSize, maxFileSize);
				const expected = fileSize <= maxFileSize;

				expect(result).toBe(expected);
				return true;
			}),
			testConfig
		);
	});
});

// ============================================================================
// Property 3: Fájlszám validáció
// ============================================================================

// Arbitrary for file count (0 to 100 files).
const fileCountArb = fc.integer({ min: 0, max: 100 });

// Arbitrary for max files limit (1 to 100).
const maxFilesArb = fc.integer({ min: 1, max: 100 });

describe('File Count Validation - Property 3: Fájlszám validáció', () => {
	/**
	 * Property 3a: File count within limit returns true.
	 *
	 * When the number of files is less than or equal to maxFiles,
	 * validateFileCount should ALWAYS return true.
	 *
	 * **Validates: Requirements 2.3**
	 */
	it('should return true when file count is less than or equal to maxFiles', () => {
		fc.assert(
			fc.property(maxFilesArb, (maxFiles) => {
				// Generate a file count that is <= maxFiles.
				const fileCount = fc.sample(fc.integer({ min: 0, max: maxFiles }), 1)[0];

				const result = validateFileCount(fileCount, maxFiles);

				expect(result).toBe(true);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3b: File count exceeding limit returns false.
	 *
	 * When the number of files is greater than maxFiles,
	 * validateFileCount should ALWAYS return false.
	 *
	 * **Validates: Requirements 2.3**
	 */
	it('should return false when file count exceeds maxFiles', () => {
		fc.assert(
			fc.property(maxFilesArb, fc.integer({ min: 1, max: 100 }), (maxFiles, extraCount) => {
				// File count is maxFiles + extraCount (always greater).
				const fileCount = maxFiles + extraCount;

				const result = validateFileCount(fileCount, maxFiles);

				expect(result).toBe(false);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3c: Exact boundary - file count equals maxFiles returns true.
	 *
	 * When the file count is exactly equal to maxFiles,
	 * validateFileCount should return true (boundary is inclusive).
	 *
	 * **Validates: Requirements 2.3**
	 */
	it('should return true when file count exactly equals maxFiles', () => {
		fc.assert(
			fc.property(maxFilesArb, (maxFiles) => {
				const result = validateFileCount(maxFiles, maxFiles);

				expect(result).toBe(true);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3d: Zero file count is always valid.
	 *
	 * A file list with 0 files should always be valid regardless of maxFiles.
	 *
	 * **Validates: Requirements 2.3**
	 */
	it('should return true for zero file count', () => {
		fc.assert(
			fc.property(maxFilesArb, (maxFiles) => {
				const result = validateFileCount(0, maxFiles);

				expect(result).toBe(true);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3e: Comparison is strictly mathematical.
	 *
	 * For any fileCount and maxFiles, the result should be equivalent to
	 * the mathematical comparison fileCount <= maxFiles.
	 *
	 * **Validates: Requirements 2.3**
	 */
	it('should be equivalent to mathematical comparison fileCount <= maxFiles', () => {
		fc.assert(
			fc.property(fileCountArb, maxFilesArb, (fileCount, maxFiles) => {
				const result = validateFileCount(fileCount, maxFiles);
				const expected = fileCount <= maxFiles;

				expect(result).toBe(expected);
				return true;
			}),
			testConfig
		);
	});
});

// ============================================================================
// Property 4: MIME típus validáció konzisztencia
// ============================================================================

import { validateMimeType, getAllowedMimeTypes } from '../mime-validator.js';
import type { FileType } from '../types.js';

/**
 * Minimal valid file buffers for different MIME types.
 * These are complete minimal files that file-type can detect.
 * The file-type library needs more than just magic bytes for some formats.
 */

// Minimal 1x1 JPEG (valid JFIF format)
const MINIMAL_JPEG = new Uint8Array([
	0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
	0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
	0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
	0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
	0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
	0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
	0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
	0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
	0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
	0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00,
	0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
	0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
	0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35,
	0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55,
	0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
	0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94,
	0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2,
	0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
	0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6,
	0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda,
	0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xfb, 0xd5, 0xdb, 0x20, 0xa8, 0xf1, 0x5e, 0x5a,
	0xd1, 0x40, 0x1f, 0xff, 0xd9
]);

// Minimal 1x1 PNG (valid PNG with IHDR, IDAT, IEND)
const MINIMAL_PNG = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
	0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
	0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
	0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59, 0xe7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
	0x44, 0xae, 0x42, 0x60, 0x82
]);

// Minimal GIF (valid GIF89a 1x1)
const MINIMAL_GIF = new Uint8Array([
	0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
	0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
	0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
]);

// Minimal WebP (valid RIFF/WEBP VP8L 1x1)
const MINIMAL_WEBP = new Uint8Array([
	0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4c,
	0x0d, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00
]);

// Minimal PDF (valid PDF 1.4)
const MINIMAL_PDF = new Uint8Array([
	0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a,
	0x0a, 0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67,
	0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a, 0x65,
	0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x32, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c,
	0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x2f, 0x4b, 0x69, 0x64, 0x73,
	0x5b, 0x33, 0x20, 0x30, 0x20, 0x52, 0x5d, 0x2f, 0x43, 0x6f, 0x75, 0x6e, 0x74, 0x20, 0x31, 0x3e,
	0x3e, 0x0a, 0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x33, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a,
	0x0a, 0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x2f, 0x50, 0x61,
	0x72, 0x65, 0x6e, 0x74, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x2f, 0x4d, 0x65, 0x64, 0x69, 0x61,
	0x42, 0x6f, 0x78, 0x5b, 0x30, 0x20, 0x30, 0x20, 0x36, 0x31, 0x32, 0x20, 0x37, 0x39, 0x32, 0x5d,
	0x3e, 0x3e, 0x0a, 0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x78, 0x72, 0x65, 0x66, 0x0a, 0x30,
	0x20, 0x34, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35,
	0x35, 0x33, 0x35, 0x20, 0x66, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x39,
	0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30,
	0x30, 0x35, 0x38, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a, 0x30, 0x30, 0x30, 0x30,
	0x30, 0x30, 0x30, 0x31, 0x31, 0x35, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a, 0x74,
	0x72, 0x61, 0x69, 0x6c, 0x65, 0x72, 0x0a, 0x3c, 0x3c, 0x2f, 0x53, 0x69, 0x7a, 0x65, 0x20, 0x34,
	0x2f, 0x52, 0x6f, 0x6f, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a, 0x73, 0x74,
	0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0a, 0x32, 0x30, 0x34, 0x0a, 0x25, 0x25, 0x45, 0x4f,
	0x46
]);

const FILE_SIGNATURES: Record<string, Uint8Array> = {
	'image/jpeg': MINIMAL_JPEG,
	'image/png': MINIMAL_PNG,
	'image/gif': MINIMAL_GIF,
	'image/webp': MINIMAL_WEBP,
	'application/pdf': MINIMAL_PDF
};

// File types that can be detected by file-type library.
const DETECTABLE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
const DETECTABLE_DOCUMENT_TYPES = ['application/pdf'] as const;

// Arbitrary for file type category
const fileTypeArb = fc.constantFrom<FileType>('image', 'document', 'mixed');

// Arbitrary for detectable image MIME types
const detectableImageMimeArb = fc.constantFrom(...DETECTABLE_IMAGE_TYPES);

// Arbitrary for detectable document MIME types
const detectableDocumentMimeArb = fc.constantFrom(...DETECTABLE_DOCUMENT_TYPES);

describe('MIME Type Validation - Property 4: MIME típus validáció konzisztencia', () => {
	/**
	 * Property 4a: Valid MIME type for category returns valid=true
	 *
	 * When a file's binary content matches an allowed MIME type for the category,
	 * validateMimeType should ALWAYS return valid=true.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should return valid=true when detected MIME type is allowed for category', async () => {
		await fc.assert(
			fc.asyncProperty(detectableImageMimeArb, async (mimeType) => {
				const buffer = FILE_SIGNATURES[mimeType];
				if (!buffer) return true; // Skip if no signature available

				const result = await validateMimeType(buffer, 'image');

				// The detected MIME type should be in the allowed list for 'image'
				const allowedTypes = getAllowedMimeTypes('image');
				if (allowedTypes.includes(mimeType)) {
					expect(result.valid).toBe(true);
					expect(result.detectedMimeType).toBe(mimeType);
				}
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 4b: Invalid MIME type for category returns valid=false
	 *
	 * When a file's binary content is detected as a MIME type NOT in the allowed
	 * list for the category, validateMimeType should ALWAYS return valid=false.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should return valid=false when detected MIME type is not allowed for category', async () => {
		await fc.assert(
			fc.asyncProperty(detectableImageMimeArb, async (imageMimeType) => {
				const buffer = FILE_SIGNATURES[imageMimeType];
				if (!buffer) return true; // Skip if no signature available

				// Use 'document' category which should NOT allow image types
				const result = await validateMimeType(buffer, 'document');

				// Image MIME types should not be valid for 'document' category
				expect(result.valid).toBe(false);
				expect(result.detectedMimeType).toBe(imageMimeType);
				expect(result.error).toBeDefined();
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 4c: Document MIME type rejected for image category
	 *
	 * When a document file (e.g., PDF) is validated against 'image' category,
	 * it should ALWAYS be rejected.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should return valid=false when document MIME type is validated against image category', async () => {
		await fc.assert(
			fc.asyncProperty(detectableDocumentMimeArb, async (docMimeType) => {
				const buffer = FILE_SIGNATURES[docMimeType];
				if (!buffer) return true; // Skip if no signature available

				// Use 'image' category which should NOT allow document types
				const result = await validateMimeType(buffer, 'image');

				// Document MIME types should not be valid for 'image' category
				expect(result.valid).toBe(false);
				expect(result.detectedMimeType).toBe(docMimeType);
				expect(result.error).toBeDefined();
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 4d: Mixed category accepts all detectable types
	 *
	 * When using 'mixed' category, both image and document MIME types
	 * should ALWAYS be accepted.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should return valid=true for any detectable MIME type when category is mixed', async () => {
		const allDetectableMimes = [...DETECTABLE_IMAGE_TYPES, ...DETECTABLE_DOCUMENT_TYPES];
		const allDetectableMimeArb = fc.constantFrom(...allDetectableMimes);

		await fc.assert(
			fc.asyncProperty(allDetectableMimeArb, async (mimeType) => {
				const buffer = FILE_SIGNATURES[mimeType];
				if (!buffer) return true; // Skip if no signature available

				const result = await validateMimeType(buffer, 'mixed');

				// All types should be valid for 'mixed' category
				expect(result.valid).toBe(true);
				expect(result.detectedMimeType).toBe(mimeType);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 4e: Consistency between getAllowedMimeTypes and validateMimeType
	 *
	 * For any file type category and detectable MIME type, if the MIME type
	 * is in getAllowedMimeTypes(category), then validateMimeType should return valid=true.
	 * If not, it should return valid=false.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should be consistent with getAllowedMimeTypes', async () => {
		const allDetectableMimes = [...DETECTABLE_IMAGE_TYPES, ...DETECTABLE_DOCUMENT_TYPES];
		const allDetectableMimeArb = fc.constantFrom(...allDetectableMimes);

		await fc.assert(
			fc.asyncProperty(fileTypeArb, allDetectableMimeArb, async (fileType, mimeType) => {
				const buffer = FILE_SIGNATURES[mimeType];
				if (!buffer) return true; // Skip if no signature available

				const allowedTypes = getAllowedMimeTypes(fileType);
				const result = await validateMimeType(buffer, fileType);

				// The validation result should match whether the MIME type is in allowed list
				const shouldBeValid = allowedTypes.includes(mimeType);
				expect(result.valid).toBe(shouldBeValid);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 4f: Undetectable content returns valid=false
	 *
	 * When file-type cannot detect the MIME type (random bytes),
	 * validateMimeType should return valid=false (unless it's a text type with declared MIME).
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should return valid=false for undetectable content without valid declared MIME', async () => {
		// Generate random bytes that don't match any known file signature
		const randomBytesArb = fc.uint8Array({ minLength: 100, maxLength: 200 });

		await fc.assert(
			fc.asyncProperty(randomBytesArb, fileTypeArb, async (randomBytes, fileType) => {
				const result = await validateMimeType(randomBytes, fileType);

				// Ha a file-type felismerte a formátumot, skip (nem tudjuk garantálni)
				if (result.detectedMimeType !== null) {
					return true;
				}

				// Ha nem detektálható, valid=false kell (nincs declaredMimeType)
				expect(result.valid).toBe(false);
				expect(result.detectedMimeType).toBeNull();

				return true;
			}),
			testConfig
		);
	});
});

// ============================================================================
// Property 8: Progress értékek tartománya
// ============================================================================

import { validateProgress, normalizeProgress } from '../validation.js';

describe('Progress Validation - Property 8: Progress értékek tartománya', () => {
	/**
	 * Property 8a: Valid progress values return true
	 *
	 * For any progress value between 0 and 100 (inclusive),
	 * validateProgress should ALWAYS return true.
	 *
	 * **Validates: Requirements 5.2**
	 */
	it('should return true for progress values between 0 and 100', () => {
		fc.assert(
			fc.property(fc.integer({ min: 0, max: 100 }), (progress) => {
				const result = validateProgress(progress);

				expect(result).toBe(true);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 8b: Progress values below 0 return false
	 *
	 * For any progress value less than 0,
	 * validateProgress should ALWAYS return false.
	 *
	 * **Validates: Requirements 5.2**
	 */
	it('should return false for progress values below 0', () => {
		fc.assert(
			fc.property(fc.integer({ min: -1000, max: -1 }), (progress) => {
				const result = validateProgress(progress);

				expect(result).toBe(false);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 8c: Progress values above 100 return false
	 *
	 * For any progress value greater than 100,
	 * validateProgress should ALWAYS return false.
	 *
	 * **Validates: Requirements 5.2**
	 */
	it('should return false for progress values above 100', () => {
		fc.assert(
			fc.property(fc.integer({ min: 101, max: 1000 }), (progress) => {
				const result = validateProgress(progress);

				expect(result).toBe(false);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 8d: Boundary values are valid
	 *
	 * Progress values of exactly 0 and 100 should be valid.
	 *
	 * **Validates: Requirements 5.2**
	 */
	it('should return true for boundary values 0 and 100', () => {
		expect(validateProgress(0)).toBe(true);
		expect(validateProgress(100)).toBe(true);
	});

	/**
	 * Property 8e: Floating point progress values within range are valid
	 *
	 * For any floating point progress value between 0 and 100,
	 * validateProgress should return true.
	 *
	 * **Validates: Requirements 5.2**
	 */
	it('should return true for floating point progress values between 0 and 100', () => {
		fc.assert(
			fc.property(fc.double({ min: 0, max: 100, noNaN: true }), (progress) => {
				const result = validateProgress(progress);

				expect(result).toBe(true);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 8f: normalizeProgress clamps values to 0-100 range
	 *
	 * For any progress value, normalizeProgress should return a value
	 * that is ALWAYS between 0 and 100 (inclusive).
	 *
	 * **Validates: Requirements 5.2**
	 */
	it('should normalize any progress value to 0-100 range', () => {
		fc.assert(
			fc.property(fc.integer({ min: -10000, max: 10000 }), (progress) => {
				const normalized = normalizeProgress(progress);

				expect(normalized).toBeGreaterThanOrEqual(0);
				expect(normalized).toBeLessThanOrEqual(100);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 8g: normalizeProgress preserves valid values
	 *
	 * For any progress value already in the 0-100 range,
	 * normalizeProgress should return the same value.
	 *
	 * **Validates: Requirements 5.2**
	 */
	it('should preserve progress values already in valid range', () => {
		fc.assert(
			fc.property(fc.integer({ min: 0, max: 100 }), (progress) => {
				const normalized = normalizeProgress(progress);

				expect(normalized).toBe(progress);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 8h: normalizeProgress clamps negative values to 0
	 *
	 * For any negative progress value, normalizeProgress should return 0.
	 *
	 * **Validates: Requirements 5.2**
	 */
	it('should clamp negative progress values to 0', () => {
		fc.assert(
			fc.property(fc.integer({ min: -10000, max: -1 }), (progress) => {
				const normalized = normalizeProgress(progress);

				expect(normalized).toBe(0);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 8i: normalizeProgress clamps values above 100 to 100
	 *
	 * For any progress value above 100, normalizeProgress should return 100.
	 *
	 * **Validates: Requirements 5.2**
	 */
	it('should clamp progress values above 100 to 100', () => {
		fc.assert(
			fc.property(fc.integer({ min: 101, max: 10000 }), (progress) => {
				const normalized = normalizeProgress(progress);

				expect(normalized).toBe(100);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 8j: Consistency between validateProgress and normalizeProgress
	 *
	 * For any progress value, if validateProgress returns true,
	 * then normalizeProgress should return the same value.
	 * If validateProgress returns false, normalizeProgress should return
	 * a different (clamped) value.
	 *
	 * **Validates: Requirements 5.2**
	 */
	it('should be consistent between validateProgress and normalizeProgress', () => {
		fc.assert(
			fc.property(fc.integer({ min: -1000, max: 1000 }), (progress) => {
				const isValid = validateProgress(progress);
				const normalized = normalizeProgress(progress);

				if (isValid) {
					// Valid values should be preserved
					expect(normalized).toBe(progress);
				} else {
					// Invalid values should be clamped
					expect(normalized).not.toBe(progress);
					expect(validateProgress(normalized)).toBe(true);
				}
				return true;
			}),
			testConfig
		);
	});
});
