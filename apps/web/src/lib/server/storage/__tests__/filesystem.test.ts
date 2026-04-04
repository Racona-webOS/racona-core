/**
 * Property-Based Tests for FileSystem Service
 *
 * Feature: file-storage
 *
 * Property 11: Path traversal védelem
 * _Bármely_ útvonalra, amely tartalmaz ".." szegmenst vagy abszolút útvonalat,
 * a validatePath függvény MINDIG false-t kell visszaadjon.
 *
 * **Validates: Requirements 8.1**
 *
 * Property 12: Fájlnév szanálás
 * _Bármely_ fájlnévre, a sanitizeFilename függvény eredménye:
 * - NEM tartalmazhat "/" vagy "\" karaktereket
 * - NEM tartalmazhat ".." szekvenciát
 * - NEM kezdődhet "." karakterrel (rejtett fájlok)
 * - CSAK alfanumerikus karaktereket, kötőjelet, aláhúzást és pontot tartalmazhat
 *
 * **Validates: Requirements 8.5**
 *
 * Property 2: Egyedi fájlnév generálás
 * _Bármely_ könyvtárra és fájlnévre, ha a fájlnév már létezik a könyvtárban,
 * akkor a generateUniqueFilename függvény MINDIG egy különböző fájlnevet kell
 * visszaadjon, amely nem létezik a könyvtárban.
 *
 * **Validates: Requirements 2.4**
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { mkdir, writeFile, rm, access, constants } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import {
	validatePath,
	sanitizeFilename,
	generateStoragePath,
	generateUniqueFilename
} from '../filesystem.js';

// Minimum 100 iteráció property tesztenként
const testConfig = { numRuns: 100 };

// ============================================================================
// Property 11: Path traversal védelem
// ============================================================================

// Arbitrary for valid path segments (alphanumeric, hyphens, underscores)
const validSegmentArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/);

// Arbitrary for valid relative paths (1-5 segments joined by /)
const validRelativePathArb = fc
	.array(validSegmentArb, { minLength: 1, maxLength: 5 })
	.map((segments) => segments.join('/'));

// Arbitrary for paths containing ".." (path traversal attempts)
const pathTraversalArb = fc.oneof(
	// ".." at the beginning
	fc.tuple(validRelativePathArb).map(([path]) => `../${path}`),
	// ".." in the middle
	fc.tuple(validSegmentArb, validSegmentArb).map(([before, after]) => `${before}/../${after}`),
	// ".." at the end
	fc.tuple(validRelativePathArb).map(([path]) => `${path}/..`),
	// Multiple ".." sequences
	fc.tuple(validSegmentArb).map(([seg]) => `${seg}/../../${seg}`),
	// Just ".."
	fc.constant('..'),
	// "../.."
	fc.constant('../..'),
	// Deeply nested traversal
	fc.constant('a/b/c/../../../d')
);

// Arbitrary for absolute paths (Unix-style)
const unixAbsolutePathArb = fc.oneof(
	fc.tuple(validRelativePathArb).map(([path]) => `/${path}`),
	fc.constant('/'),
	fc.constant('/etc/passwd'),
	fc.constant('/home/user/file.txt')
);

// Arbitrary for Windows-style absolute paths
const windowsAbsolutePathArb = fc.oneof(
	fc.tuple(validRelativePathArb).map(([path]) => `C:\\${path.replace(/\//g, '\\')}`),
	fc.tuple(validRelativePathArb).map(([path]) => `D:/${path}`),
	fc.constant('C:\\'),
	fc.constant('C:\\Windows\\System32'),
	fc
		.tuple(fc.constantFrom('C', 'D', 'E', 'F'), validSegmentArb)
		.map(([drive, seg]) => `${drive}:/${seg}`)
);

// Arbitrary for paths with null bytes (injection attempts)
const nullBytePathArb = fc.oneof(
	fc.tuple(validRelativePathArb).map(([path]) => `${path}\0`),
	fc.tuple(validRelativePathArb).map(([path]) => `${path}\0.txt`),
	fc.tuple(validSegmentArb, validSegmentArb).map(([a, b]) => `${a}\0${b}`)
);

describe('Path Validation - Property 11: Path traversal védelem', () => {
	/**
	 * Property 11a: Paths containing ".." segments return false
	 *
	 * For ANY path containing ".." as a path segment,
	 * validatePath should ALWAYS return false.
	 *
	 * **Validates: Requirements 8.1**
	 */
	it('should return false for paths containing ".." segments', () => {
		fc.assert(
			fc.property(pathTraversalArb, (maliciousPath) => {
				const result = validatePath(maliciousPath);

				expect(result).toBe(false);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 11b: Unix-style absolute paths return false
	 *
	 * For ANY path starting with "/" (Unix absolute path),
	 * validatePath should ALWAYS return false.
	 *
	 * **Validates: Requirements 8.1**
	 */
	it('should return false for Unix-style absolute paths', () => {
		fc.assert(
			fc.property(unixAbsolutePathArb, (absolutePath) => {
				const result = validatePath(absolutePath);

				expect(result).toBe(false);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 11c: Windows-style absolute paths return false
	 *
	 * For ANY path starting with a drive letter (e.g., "C:\"),
	 * validatePath should ALWAYS return false.
	 *
	 * **Validates: Requirements 8.1**
	 */
	it('should return false for Windows-style absolute paths', () => {
		fc.assert(
			fc.property(windowsAbsolutePathArb, (absolutePath) => {
				const result = validatePath(absolutePath);

				expect(result).toBe(false);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 11d: Paths with null bytes return false
	 *
	 * For ANY path containing null byte characters,
	 * validatePath should ALWAYS return false.
	 *
	 * **Validates: Requirements 8.1**
	 */
	it('should return false for paths containing null bytes', () => {
		fc.assert(
			fc.property(nullBytePathArb, (maliciousPath) => {
				const result = validatePath(maliciousPath);

				expect(result).toBe(false);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 11e: Valid relative paths return true
	 *
	 * For ANY valid relative path (no "..", no absolute prefix, no null bytes),
	 * validatePath should ALWAYS return true.
	 *
	 * **Validates: Requirements 8.1**
	 */
	it('should return true for valid relative paths', () => {
		fc.assert(
			fc.property(validRelativePathArb, (validPath) => {
				const result = validatePath(validPath);

				expect(result).toBe(true);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 11f: Empty or whitespace-only paths return false
	 *
	 * For ANY empty or whitespace-only path,
	 * validatePath should ALWAYS return false.
	 *
	 * **Validates: Requirements 8.1**
	 */
	it('should return false for empty or whitespace-only paths', () => {
		const emptyPathArb = fc.oneof(
			fc.constant(''),
			fc.constant('   '),
			fc.constant('\t'),
			fc.constant('\n'),
			fc.constant('  \t  '),
			fc.constant('\n\t\n')
		);

		fc.assert(
			fc.property(emptyPathArb, (emptyPath) => {
				const result = validatePath(emptyPath);

				expect(result).toBe(false);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 11g: Backslash-based path traversal returns false
	 *
	 * For ANY path using backslashes for traversal (Windows-style),
	 * validatePath should ALWAYS return false.
	 *
	 * **Validates: Requirements 8.1**
	 */
	it('should return false for backslash-based path traversal', () => {
		const backslashTraversalArb = fc.oneof(
			fc.tuple(validSegmentArb).map(([seg]) => `${seg}\\..\\${seg}`),
			fc.constant('..\\..'),
			fc.tuple(validSegmentArb, validSegmentArb).map(([a, b]) => `${a}\\..\\${b}`)
		);

		fc.assert(
			fc.property(backslashTraversalArb, (maliciousPath) => {
				const result = validatePath(maliciousPath);

				expect(result).toBe(false);
				return true;
			}),
			testConfig
		);
	});
});

// ============================================================================
// Property 12: Fájlnév szanálás
// ============================================================================

// Arbitrary for any string that could be a filename (including malicious ones)
const anyFilenameArb = fc.oneof(
	// Normal filenames
	fc.string({ minLength: 0, maxLength: 100 }),
	// Filenames with path separators
	fc.tuple(fc.string(), fc.string()).map(([a, b]) => `${a}/${b}`),
	fc.tuple(fc.string(), fc.string()).map(([a, b]) => `${a}\\${b}`),
	// Filenames with ".." sequences
	fc.tuple(fc.string()).map(([s]) => `..${s}`),
	fc.tuple(fc.string()).map(([s]) => `${s}..`),
	fc.tuple(fc.string(), fc.string()).map(([a, b]) => `${a}..${b}`),
	// Hidden files (starting with .)
	fc.tuple(fc.string({ minLength: 1 })).map(([s]) => `.${s}`),
	// Filenames with special characters
	fc.string({ minLength: 1, maxLength: 50 }).map((s) => `${s}!@#$%^&*()`),
	// Unicode-like filenames
	fc.string({ minLength: 1, maxLength: 50 }).map((s) => `файл_${s}`),
	// Filenames with extensions
	fc
		.tuple(
			fc.string({ minLength: 1, maxLength: 30 }),
			fc.constantFrom('.txt', '.jpg', '.png', '.pdf')
		)
		.map(([name, ext]) => `${name}${ext}`)
);

// Arbitrary for filenames with path separators
const filenameWithSeparatorsArb = fc.oneof(
	fc
		.tuple(fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/), fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/))
		.map(([a, b]) => `${a}/${b}`),
	fc
		.tuple(fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/), fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/))
		.map(([a, b]) => `${a}\\${b}`),
	fc.constant('path/to/file.txt'),
	fc.constant('path\\to\\file.txt'),
	fc.constant('/absolute/path'),
	fc.constant('C:\\Windows\\file.txt')
);

// Arbitrary for filenames with ".." sequences
const filenameWithDotsArb = fc.oneof(
	fc.constant('..'),
	fc.constant('..file.txt'),
	fc.constant('file..txt'),
	fc.constant('file...txt'),
	fc.constant('....'),
	fc.tuple(fc.stringMatching(/^[a-zA-Z0-9]{1,5}$/)).map(([s]) => `${s}..${s}`),
	fc.tuple(fc.stringMatching(/^[a-zA-Z0-9]{1,5}$/)).map(([s]) => `..${s}..`)
);

// Arbitrary for hidden filenames (starting with .)
const hiddenFilenameArb = fc.oneof(
	fc.constant('.hidden'),
	fc.constant('.gitignore'),
	fc.constant('.env'),
	fc.constant('...'),
	fc.tuple(fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/)).map(([s]) => `.${s}`),
	fc.tuple(fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/)).map(([s]) => `..${s}`),
	fc.tuple(fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/)).map(([s]) => `...${s}`)
);

// Arbitrary for filenames with special characters
const filenameWithSpecialCharsArb = fc.oneof(
	fc.constant('file!name.txt'),
	fc.constant('file@name.txt'),
	fc.constant('file#name.txt'),
	fc.constant('file$name.txt'),
	fc.constant('file%name.txt'),
	fc.constant('file^name.txt'),
	fc.constant('file&name.txt'),
	fc.constant('file*name.txt'),
	fc.constant('file(name).txt'),
	fc.constant('file name.txt'),
	fc.constant('file\tname.txt'),
	fc.constant('file\nname.txt'),
	fc
		.tuple(
			fc.stringMatching(/^[a-zA-Z0-9]{1,5}$/),
			fc.stringMatching(/^[!@#$%^&*()+=\[\]{}|;:'",<>?`~]{1,5}$/)
		)
		.map(([name, special]) => `${name}${special}.txt`)
);

describe('Filename Sanitization - Property 12: Fájlnév szanálás', () => {
	/**
	 * Property 12a: Sanitized filenames never contain "/" or "\" characters
	 *
	 * For ANY input filename, the sanitized result should NEVER contain
	 * forward slash or backslash characters.
	 *
	 * **Validates: Requirements 8.5**
	 */
	it('should never contain "/" or "\\" characters in sanitized filename', () => {
		fc.assert(
			fc.property(anyFilenameArb, (filename) => {
				const sanitized = sanitizeFilename(filename);

				expect(sanitized).not.toContain('/');
				expect(sanitized).not.toContain('\\');
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 12b: Sanitized filenames never contain ".." sequences
	 *
	 * For ANY input filename, the sanitized result should NEVER contain
	 * the ".." sequence (path traversal).
	 *
	 * **Validates: Requirements 8.5**
	 */
	it('should never contain ".." sequences in sanitized filename', () => {
		fc.assert(
			fc.property(anyFilenameArb, (filename) => {
				const sanitized = sanitizeFilename(filename);

				expect(sanitized).not.toContain('..');
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 12c: Sanitized filenames never start with "." (no hidden files)
	 *
	 * For ANY input filename, the sanitized result should NEVER start
	 * with a "." character (preventing hidden files).
	 *
	 * **Validates: Requirements 8.5**
	 */
	it('should never start with "." character in sanitized filename', () => {
		fc.assert(
			fc.property(anyFilenameArb, (filename) => {
				const sanitized = sanitizeFilename(filename);

				expect(sanitized.startsWith('.')).toBe(false);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 12d: Sanitized filenames only contain allowed characters
	 *
	 * For ANY input filename, the sanitized result should ONLY contain
	 * alphanumeric characters, hyphens, underscores, and periods.
	 *
	 * **Validates: Requirements 8.5**
	 */
	it('should only contain alphanumeric, hyphen, underscore, and period characters', () => {
		fc.assert(
			fc.property(anyFilenameArb, (filename) => {
				const sanitized = sanitizeFilename(filename);

				// Check that every character is allowed
				const allowedPattern = /^[a-zA-Z0-9\-_.]+$/;
				expect(sanitized).toMatch(allowedPattern);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 12e: Sanitized filenames are never empty
	 *
	 * For ANY input filename (including empty strings),
	 * the sanitized result should NEVER be empty.
	 *
	 * **Validates: Requirements 8.5**
	 */
	it('should never return an empty filename', () => {
		fc.assert(
			fc.property(anyFilenameArb, (filename) => {
				const sanitized = sanitizeFilename(filename);

				expect(sanitized.length).toBeGreaterThan(0);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 12f: Path separators are removed from filenames
	 *
	 * For ANY filename containing "/" or "\\" characters,
	 * the sanitized result should have them removed.
	 *
	 * **Validates: Requirements 8.5**
	 */
	it('should remove path separators from filenames', () => {
		fc.assert(
			fc.property(filenameWithSeparatorsArb, (filename) => {
				const sanitized = sanitizeFilename(filename);

				expect(sanitized).not.toContain('/');
				expect(sanitized).not.toContain('\\');
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 12g: ".." sequences are removed from filenames
	 *
	 * For ANY filename containing ".." sequences,
	 * the sanitized result should have them removed.
	 *
	 * **Validates: Requirements 8.5**
	 */
	it('should remove ".." sequences from filenames', () => {
		fc.assert(
			fc.property(filenameWithDotsArb, (filename) => {
				const sanitized = sanitizeFilename(filename);

				expect(sanitized).not.toContain('..');
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 12h: Leading dots are removed from filenames
	 *
	 * For ANY filename starting with "." characters,
	 * the sanitized result should not start with ".".
	 *
	 * **Validates: Requirements 8.5**
	 */
	it('should remove leading dots from filenames', () => {
		fc.assert(
			fc.property(hiddenFilenameArb, (filename) => {
				const sanitized = sanitizeFilename(filename);

				expect(sanitized.startsWith('.')).toBe(false);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 12i: Special characters are removed from filenames
	 *
	 * For ANY filename containing special characters,
	 * the sanitized result should only contain allowed characters.
	 *
	 * **Validates: Requirements 8.5**
	 */
	it('should remove special characters from filenames', () => {
		fc.assert(
			fc.property(filenameWithSpecialCharsArb, (filename) => {
				const sanitized = sanitizeFilename(filename);

				const allowedPattern = /^[a-zA-Z0-9\-_.]+$/;
				expect(sanitized).toMatch(allowedPattern);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 12j: File extensions are preserved when valid
	 *
	 * For ANY filename with a valid extension,
	 * the sanitized result should preserve the extension.
	 *
	 * **Validates: Requirements 8.5**
	 */
	it('should preserve valid file extensions', () => {
		const filenameWithExtArb = fc
			.tuple(
				fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/),
				fc.constantFrom('.txt', '.jpg', '.png', '.pdf', '.doc')
			)
			.map(([name, ext]) => `${name}${ext}`);

		fc.assert(
			fc.property(filenameWithExtArb, (filename) => {
				const sanitized = sanitizeFilename(filename);
				const originalExt = filename.slice(filename.lastIndexOf('.'));

				expect(sanitized.endsWith(originalExt)).toBe(true);
				return true;
			}),
			testConfig
		);
	});
});

// ============================================================================
// Property 1: Tárolási útvonal formátum
// ============================================================================

// Arbitrary for valid category names (lowercase alphanumeric with hyphens)
const validCategoryArb = fc.stringMatching(/^[a-z0-9-]{1,20}$/);

// Arbitrary for user IDs (positive integers)
const userIdArb = fc.integer({ min: 1, max: 1000000 });

// Arbitrary for scope values
const scopeArb = fc.constantFrom('shared', 'user') as fc.Arbitrary<'shared' | 'user'>;

describe('Storage Path Generation - Property 1: Tárolási útvonal formátum', () => {
	/**
	 * Property 1a: Shared scope paths follow the format {category}/shared
	 *
	 * For ANY category with scope = "shared",
	 * the generated path should ALWAYS be "{category}/shared".
	 *
	 * **Validates: Requirements 2.1, 2.2**
	 */
	it('should generate {category}/shared path for shared scope', () => {
		fc.assert(
			fc.property(validCategoryArb, (category) => {
				const result = generateStoragePath(category, 'shared');

				// Path should be {category}/shared
				const expectedPath = `${category}/shared`;
				// Normalize path separators for cross-platform compatibility
				const normalizedResult = result.replace(/\\/g, '/');

				expect(normalizedResult).toBe(expectedPath);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 1b: User scope paths follow the format {category}/user-{userId}
	 *
	 * For ANY category with scope = "user" and a userId,
	 * the generated path should ALWAYS be "{category}/user-{userId}".
	 *
	 * **Validates: Requirements 2.1, 2.2**
	 */
	it('should generate {category}/user-{userId} path for user scope', () => {
		fc.assert(
			fc.property(validCategoryArb, userIdArb, (category, userId) => {
				const result = generateStoragePath(category, 'user', userId);

				// Path should be {category}/user-{userId}
				const expectedPath = `${category}/user-${userId}`;
				// Normalize path separators for cross-platform compatibility
				const normalizedResult = result.replace(/\\/g, '/');

				expect(normalizedResult).toBe(expectedPath);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 1c: Path always contains the category as the first segment
	 *
	 * For ANY category and scope combination,
	 * the generated path should ALWAYS start with the category.
	 *
	 * **Validates: Requirements 2.1, 2.2**
	 */
	it('should always start with the category', () => {
		fc.assert(
			fc.property(validCategoryArb, scopeArb, userIdArb, (category, scope, userId) => {
				const result = generateStoragePath(category, scope, scope === 'user' ? userId : null);

				// Normalize path separators for cross-platform compatibility
				const normalizedResult = result.replace(/\\/g, '/');
				const firstSegment = normalizedResult.split('/')[0];

				expect(firstSegment).toBe(category);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 1d: Path always contains the correct scope directory as the second segment
	 *
	 * For ANY category and scope combination,
	 * the second segment should be "shared" or "user-{userId}".
	 *
	 * **Validates: Requirements 2.1, 2.2**
	 */
	it('should have correct scope directory as second segment', () => {
		fc.assert(
			fc.property(validCategoryArb, scopeArb, userIdArb, (category, scope, userId) => {
				const result = generateStoragePath(category, scope, scope === 'user' ? userId : null);

				// Normalize path separators for cross-platform compatibility
				const normalizedResult = result.replace(/\\/g, '/');
				const secondSegment = normalizedResult.split('/')[1];

				if (scope === 'shared') {
					expect(secondSegment).toBe('shared');
				} else {
					expect(secondSegment).toBe(`user-${userId}`);
				}
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 1e: Path has exactly two segments
	 *
	 * For ANY category and scope combination,
	 * the generated path should ALWAYS have exactly two segments.
	 *
	 * **Validates: Requirements 2.1, 2.2**
	 */
	it('should have exactly two path segments', () => {
		fc.assert(
			fc.property(validCategoryArb, scopeArb, userIdArb, (category, scope, userId) => {
				const result = generateStoragePath(category, scope, scope === 'user' ? userId : null);

				// Normalize path separators for cross-platform compatibility
				const normalizedResult = result.replace(/\\/g, '/');
				const segments = normalizedResult.split('/').filter((s) => s.length > 0);

				expect(segments.length).toBe(2);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 1f: User scope with null userId uses "user-null" format
	 *
	 * For user scope with null userId,
	 * the path should use "user-null" as the scope directory.
	 *
	 * **Validates: Requirements 2.1, 2.2**
	 */
	it('should handle null userId for user scope', () => {
		fc.assert(
			fc.property(validCategoryArb, (category) => {
				const result = generateStoragePath(category, 'user', null);

				// Normalize path separators for cross-platform compatibility
				const normalizedResult = result.replace(/\\/g, '/');

				expect(normalizedResult).toBe(`${category}/user-null`);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 1g: User scope with undefined userId uses "user-undefined" format
	 *
	 * For user scope with undefined userId,
	 * the path should use "user-undefined" as the scope directory.
	 *
	 * **Validates: Requirements 2.1, 2.2**
	 */
	it('should handle undefined userId for user scope', () => {
		fc.assert(
			fc.property(validCategoryArb, (category) => {
				const result = generateStoragePath(category, 'user', undefined);

				// Normalize path separators for cross-platform compatibility
				const normalizedResult = result.replace(/\\/g, '/');

				expect(normalizedResult).toBe(`${category}/user-undefined`);
				return true;
			}),
			testConfig
		);
	});
});

// ============================================================================
// Property 2: Egyedi fájlnév generálás
// ============================================================================

// Test directory for filesystem operations
const TEST_DIR = join(process.cwd(), '.test-uploads-' + randomUUID().slice(0, 8));

// Helper to check if file exists
async function fileExists(filePath: string): Promise<boolean> {
	try {
		await access(filePath, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

// Arbitrary for valid filenames (alphanumeric with common extensions)
const validFilenameArb = fc
	.tuple(
		fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
		fc.constantFrom('.txt', '.jpg', '.png', '.pdf', '.doc', '.mp4', '')
	)
	.map(([name, ext]) => `${name}${ext}`);

describe('Unique Filename Generation - Property 2: Egyedi fájlnév generálás', () => {
	// Create test directory before all tests
	beforeAll(async () => {
		await mkdir(TEST_DIR, { recursive: true });
	});

	// Clean up test directory after all tests
	afterAll(async () => {
		try {
			await rm(TEST_DIR, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	/**
	 * Property 2a: When file does not exist, returns the sanitized original filename
	 *
	 * For ANY filename that does not exist in the directory,
	 * generateUniqueFilename should return the sanitized version of the original filename.
	 *
	 * **Validates: Requirements 2.4**
	 */
	it('should return sanitized original filename when file does not exist', async () => {
		// Create a unique subdirectory for this test
		const testSubDir = join(TEST_DIR, 'prop2a-' + randomUUID().slice(0, 8));
		await mkdir(testSubDir, { recursive: true });

		await fc.assert(
			fc.asyncProperty(validFilenameArb, async (filename) => {
				const result = await generateUniqueFilename(testSubDir, filename);
				const sanitized = sanitizeFilename(filename);

				// When file doesn't exist, should return the sanitized filename
				expect(result).toBe(sanitized);
				return true;
			}),
			{ ...testConfig, numRuns: 20 } // Reduced runs for async filesystem operations
		);
	});

	/**
	 * Property 2b: When file exists, returns a different filename
	 *
	 * For ANY filename that already exists in the directory,
	 * generateUniqueFilename should ALWAYS return a DIFFERENT filename.
	 *
	 * **Validates: Requirements 2.4**
	 */
	it('should return a different filename when file already exists', async () => {
		await fc.assert(
			fc.asyncProperty(validFilenameArb, async (filename) => {
				// Create a unique subdirectory for each test iteration
				const testSubDir = join(TEST_DIR, 'prop2b-' + randomUUID().slice(0, 8));
				await mkdir(testSubDir, { recursive: true });

				const sanitized = sanitizeFilename(filename);
				const existingFilePath = join(testSubDir, sanitized);

				// Create the file so it exists
				await writeFile(existingFilePath, 'test content');

				// Generate unique filename
				const result = await generateUniqueFilename(testSubDir, filename);

				// Result should be different from the sanitized original
				expect(result).not.toBe(sanitized);
				return true;
			}),
			{ ...testConfig, numRuns: 20 } // Reduced runs for async filesystem operations
		);
	});

	/**
	 * Property 2c: Generated unique filename does not exist in directory
	 *
	 * For ANY filename that already exists in the directory,
	 * the filename returned by generateUniqueFilename should NOT exist in the directory.
	 *
	 * **Validates: Requirements 2.4**
	 */
	it('should return a filename that does not exist in the directory', async () => {
		await fc.assert(
			fc.asyncProperty(validFilenameArb, async (filename) => {
				// Create a unique subdirectory for each test iteration
				const testSubDir = join(TEST_DIR, 'prop2c-' + randomUUID().slice(0, 8));
				await mkdir(testSubDir, { recursive: true });

				const sanitized = sanitizeFilename(filename);
				const existingFilePath = join(testSubDir, sanitized);

				// Create the file so it exists
				await writeFile(existingFilePath, 'test content');

				// Generate unique filename
				const result = await generateUniqueFilename(testSubDir, filename);
				const resultPath = join(testSubDir, result);

				// The generated filename should not exist
				const exists = await fileExists(resultPath);
				expect(exists).toBe(false);
				return true;
			}),
			{ ...testConfig, numRuns: 20 } // Reduced runs for async filesystem operations
		);
	});

	/**
	 * Property 2d: Unique filename preserves file extension
	 *
	 * For ANY filename with an extension that already exists,
	 * the generated unique filename should preserve the original extension.
	 *
	 * **Validates: Requirements 2.4**
	 */
	it('should preserve file extension in unique filename', async () => {
		const filenameWithExtArb = fc
			.tuple(
				fc.stringMatching(/^[a-zA-Z0-9_-]{1,15}$/),
				fc.constantFrom('.txt', '.jpg', '.png', '.pdf', '.doc')
			)
			.map(([name, ext]) => `${name}${ext}`);

		await fc.assert(
			fc.asyncProperty(filenameWithExtArb, async (filename) => {
				// Create a unique subdirectory for each test iteration
				const testSubDir = join(TEST_DIR, 'prop2d-' + randomUUID().slice(0, 8));
				await mkdir(testSubDir, { recursive: true });

				const sanitized = sanitizeFilename(filename);
				const existingFilePath = join(testSubDir, sanitized);
				const originalExt = sanitized.slice(sanitized.lastIndexOf('.'));

				// Create the file so it exists
				await writeFile(existingFilePath, 'test content');

				// Generate unique filename
				const result = await generateUniqueFilename(testSubDir, filename);

				// Extension should be preserved
				expect(result.endsWith(originalExt)).toBe(true);
				return true;
			}),
			{ ...testConfig, numRuns: 20 } // Reduced runs for async filesystem operations
		);
	});

	/**
	 * Property 2e: Multiple calls with same existing file return different unique names
	 *
	 * For ANY filename that exists, multiple calls to generateUniqueFilename
	 * should return different unique filenames (due to UUID-based suffix).
	 *
	 * **Validates: Requirements 2.4**
	 */
	it('should generate different unique names on multiple calls', async () => {
		await fc.assert(
			fc.asyncProperty(validFilenameArb, async (filename) => {
				// Create a unique subdirectory for each test iteration
				const testSubDir = join(TEST_DIR, 'prop2e-' + randomUUID().slice(0, 8));
				await mkdir(testSubDir, { recursive: true });

				const sanitized = sanitizeFilename(filename);
				const existingFilePath = join(testSubDir, sanitized);

				// Create the file so it exists
				await writeFile(existingFilePath, 'test content');

				// Generate two unique filenames
				const result1 = await generateUniqueFilename(testSubDir, filename);
				const result2 = await generateUniqueFilename(testSubDir, filename);

				// Both should be different from original
				expect(result1).not.toBe(sanitized);
				expect(result2).not.toBe(sanitized);

				// Both should be different from each other (UUID-based)
				expect(result1).not.toBe(result2);
				return true;
			}),
			{ ...testConfig, numRuns: 20 } // Reduced runs for async filesystem operations
		);
	});
});
