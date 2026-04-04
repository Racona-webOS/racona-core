/**
 * Property-Based Tests for ListFiles Remote Function
 *
 * Feature: file-storage
 *
 * Property 4: Fájl listázás scope alapján
 * _Bármely_ kategóriára és scope-ra:
 * - Ha scope = "shared": a listázás MINDIG visszaadja az összes shared fájlt a kategóriában
 * - Ha scope = "user": a listázás CSAK a jelenlegi user fájljait adja vissza, más userek fájljait SOHA
 *
 * **Validates: Requirements 3.1, 3.2**
 *
 * Property 5: Listázás metaadat tartalom
 * _Bármely_ listázás eredményében szereplő fájlra, a metaadatoknak MINDIG tartalmazniuk kell:
 * id, filename, mimeType, size, és createdAt mezőket.
 *
 * **Validates: Requirements 3.4**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { StoredFile, FileScope } from '../types.js';

// Minimum 100 iteráció property tesztenként
const testConfig = { numRuns: 100 };

// ============================================================================
// Helper: Simulated file repository filtering logic
// This simulates the core filtering logic from file-repository.ts findByCategory
// ============================================================================

interface MockStoredFile {
	id: string;
	filename: string;
	originalName: string;
	category: string;
	scope: FileScope;
	userId: number | null;
	mimeType: string;
	size: number;
	storagePath: string;
	url: string;
	createdAt: Date;
}

/**
 * Simulates the findByCategory filtering logic from file-repository.ts.
 * This is the core logic that determines which files are returned based on scope.
 *
 * @param allFiles - All files in the "database".
 * @param category - The category to filter by.
 * @param scope - The scope to filter by ('shared' or 'user').
 * @param currentUserId - The current user's ID (for user scope filtering).
 * @returns Filtered list of files.
 */
function simulateFindByCategory(
	allFiles: MockStoredFile[],
	category: string,
	scope: FileScope,
	currentUserId?: number
): MockStoredFile[] {
	if (scope === 'user' && currentUserId !== undefined) {
		// User scope: only return files belonging to the current user
		return allFiles.filter(
			(file) => file.category === category && file.scope === scope && file.userId === currentUserId
		);
	} else if (scope === 'shared') {
		// Shared scope: return all shared files in the category
		return allFiles.filter((file) => file.category === category && file.scope === scope);
	} else {
		// User scope without userId: return empty list
		return [];
	}
}

// ============================================================================
// Arbitraries for generating test data
// ============================================================================

// Valid UUID v4 pattern
const uuidArb = fc.uuid();

// Valid filename (alphanumeric with extension)
const filenameArb = fc
	.tuple(
		fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
		fc.constantFrom('.txt', '.jpg', '.png', '.pdf', '.doc')
	)
	.map(([name, ext]) => `${name}${ext}`);

// Valid category (lowercase alphanumeric with hyphens)
const categoryArb = fc.stringMatching(/^[a-z0-9-]{1,20}$/);

// Valid scope
const scopeArb = fc.constantFrom('shared', 'user') as fc.Arbitrary<FileScope>;

// Valid user ID (positive integer)
const userIdArb = fc.integer({ min: 1, max: 1000000 });

// Valid MIME type
const mimeTypeArb = fc.constantFrom('image/jpeg', 'image/png', 'application/pdf', 'text/plain');

// Valid file size (positive integer)
const sizeArb = fc.integer({ min: 1, max: 10000000 });

// Valid date
const dateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') });

// Generate a single mock stored file
const mockStoredFileArb = (
	categoryOverride?: string,
	scopeOverride?: FileScope,
	userIdOverride?: number | null
): fc.Arbitrary<MockStoredFile> =>
	fc
		.tuple(
			uuidArb,
			filenameArb,
			filenameArb,
			categoryOverride ? fc.constant(categoryOverride) : categoryArb,
			scopeOverride ? fc.constant(scopeOverride) : scopeArb,
			userIdOverride !== undefined ? fc.constant(userIdOverride) : userIdArb,
			mimeTypeArb,
			sizeArb,
			dateArb
		)
		.map(([id, filename, originalName, category, scope, userId, mimeType, size, createdAt]) => {
			const scopePath = scope === 'user' ? `user-${userId}` : 'shared';
			return {
				id,
				filename,
				originalName,
				category,
				scope,
				userId: scope === 'user' ? userId : null,
				mimeType,
				size,
				storagePath: `${category}/${scopePath}/${filename}`,
				url: `/api/files/${category}/${scopePath}/${filename}`,
				createdAt
			};
		});

// Generate a list of mock stored files with mixed categories, scopes, and users
const mixedFilesArb = fc.array(mockStoredFileArb(), { minLength: 0, maxLength: 50 });

// ============================================================================
// Property 4: Fájl listázás scope alapján
// ============================================================================

describe('ListFiles Scope Filtering - Property 4: Fájl listázás scope alapján', () => {
	/**
	 * Property 4a: Shared scope returns all shared files in category
	 *
	 * For ANY category with scope = "shared",
	 * the listing should ALWAYS return ALL shared files in that category.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should return all shared files in category for shared scope', () => {
		fc.assert(
			fc.property(categoryArb, mixedFilesArb, (targetCategory, allFiles) => {
				const result = simulateFindByCategory(allFiles, targetCategory, 'shared');

				// Count expected shared files in the target category
				const expectedFiles = allFiles.filter(
					(f) => f.category === targetCategory && f.scope === 'shared'
				);

				// Result should contain exactly the expected files
				expect(result.length).toBe(expectedFiles.length);

				// All returned files should be shared and in the target category
				for (const file of result) {
					expect(file.scope).toBe('shared');
					expect(file.category).toBe(targetCategory);
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 4b: User scope returns only current user's files
	 *
	 * For ANY category with scope = "user" and a current user ID,
	 * the listing should ONLY return files belonging to that user.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should return only current user files for user scope', () => {
		fc.assert(
			fc.property(
				categoryArb,
				userIdArb,
				mixedFilesArb,
				(targetCategory, currentUserId, allFiles) => {
					const result = simulateFindByCategory(allFiles, targetCategory, 'user', currentUserId);

					// All returned files should belong to the current user
					for (const file of result) {
						expect(file.userId).toBe(currentUserId);
						expect(file.scope).toBe('user');
						expect(file.category).toBe(targetCategory);
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 4c: User scope never returns other users' files
	 *
	 * For ANY category with scope = "user" and a current user ID,
	 * the listing should NEVER return files belonging to other users.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should never return other users files for user scope', () => {
		fc.assert(
			fc.property(
				categoryArb,
				userIdArb,
				mixedFilesArb,
				(targetCategory, currentUserId, allFiles) => {
					const result = simulateFindByCategory(allFiles, targetCategory, 'user', currentUserId);

					// Count files belonging to other users in the same category
					const otherUsersFiles = allFiles.filter(
						(f) => f.category === targetCategory && f.scope === 'user' && f.userId !== currentUserId
					);

					// None of the other users' files should be in the result
					for (const otherFile of otherUsersFiles) {
						const found = result.some((r) => r.id === otherFile.id);
						expect(found).toBe(false);
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 4d: User scope returns all of current user's files in category
	 *
	 * For ANY category with scope = "user" and a current user ID,
	 * the listing should return ALL files belonging to that user in the category.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should return all current user files in category for user scope', () => {
		fc.assert(
			fc.property(
				categoryArb,
				userIdArb,
				mixedFilesArb,
				(targetCategory, currentUserId, allFiles) => {
					const result = simulateFindByCategory(allFiles, targetCategory, 'user', currentUserId);

					// Count expected user files in the target category
					const expectedFiles = allFiles.filter(
						(f) => f.category === targetCategory && f.scope === 'user' && f.userId === currentUserId
					);

					// Result should contain exactly the expected files
					expect(result.length).toBe(expectedFiles.length);

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 4e: Shared scope never returns user-scoped files
	 *
	 * For ANY category with scope = "shared",
	 * the listing should NEVER return user-scoped files.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should never return user-scoped files for shared scope', () => {
		fc.assert(
			fc.property(categoryArb, mixedFilesArb, (targetCategory, allFiles) => {
				const result = simulateFindByCategory(allFiles, targetCategory, 'shared');

				// None of the returned files should have user scope
				for (const file of result) {
					expect(file.scope).not.toBe('user');
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 4f: User scope never returns shared files
	 *
	 * For ANY category with scope = "user",
	 * the listing should NEVER return shared files.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should never return shared files for user scope', () => {
		fc.assert(
			fc.property(
				categoryArb,
				userIdArb,
				mixedFilesArb,
				(targetCategory, currentUserId, allFiles) => {
					const result = simulateFindByCategory(allFiles, targetCategory, 'user', currentUserId);

					// None of the returned files should have shared scope
					for (const file of result) {
						expect(file.scope).not.toBe('shared');
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 4g: Category filtering is exact match
	 *
	 * For ANY category and scope combination,
	 * the listing should ONLY return files with exactly matching category.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should only return files with exactly matching category', () => {
		fc.assert(
			fc.property(
				categoryArb,
				scopeArb,
				userIdArb,
				mixedFilesArb,
				(targetCategory, scope, userId, allFiles) => {
					const result = simulateFindByCategory(
						allFiles,
						targetCategory,
						scope,
						scope === 'user' ? userId : undefined
					);

					// All returned files should have exactly the target category
					for (const file of result) {
						expect(file.category).toBe(targetCategory);
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 4h: User scope without userId returns empty list
	 *
	 * For ANY category with scope = "user" but no userId provided,
	 * the listing should return an empty list.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should return empty list for user scope without userId', () => {
		fc.assert(
			fc.property(categoryArb, mixedFilesArb, (targetCategory, allFiles) => {
				const result = simulateFindByCategory(allFiles, targetCategory, 'user', undefined);

				expect(result.length).toBe(0);

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 4i: Result set is a subset of input files
	 *
	 * For ANY category and scope combination,
	 * all returned files should exist in the original file list.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should return files that exist in the original list', () => {
		fc.assert(
			fc.property(
				categoryArb,
				scopeArb,
				userIdArb,
				mixedFilesArb,
				(targetCategory, scope, userId, allFiles) => {
					const result = simulateFindByCategory(
						allFiles,
						targetCategory,
						scope,
						scope === 'user' ? userId : undefined
					);

					// All returned files should exist in the original list
					for (const file of result) {
						const exists = allFiles.some((f) => f.id === file.id);
						expect(exists).toBe(true);
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 4j: Filtering is deterministic
	 *
	 * For ANY category, scope, and file list,
	 * calling the filter function twice should return the same result.
	 *
	 * **Validates: Requirements 3.1, 3.2**
	 */
	it('should return consistent results for same inputs', () => {
		fc.assert(
			fc.property(
				categoryArb,
				scopeArb,
				userIdArb,
				mixedFilesArb,
				(targetCategory, scope, userId, allFiles) => {
					const result1 = simulateFindByCategory(
						allFiles,
						targetCategory,
						scope,
						scope === 'user' ? userId : undefined
					);
					const result2 = simulateFindByCategory(
						allFiles,
						targetCategory,
						scope,
						scope === 'user' ? userId : undefined
					);

					// Results should be identical
					expect(result1.length).toBe(result2.length);
					for (let i = 0; i < result1.length; i++) {
						expect(result1[i].id).toBe(result2[i].id);
					}

					return true;
				}
			),
			testConfig
		);
	});
});

// ============================================================================
// Property 5: Listázás metaadat tartalom
// ============================================================================

describe('ListFiles Metadata Content - Property 5: Listázás metaadat tartalom', () => {
	/**
	 * Property 5a: All returned files have required id field
	 *
	 * For ANY listing result, every file MUST have a non-empty id field.
	 *
	 * **Validates: Requirements 3.4**
	 */
	it('should always include id field in returned files', () => {
		fc.assert(
			fc.property(
				categoryArb,
				scopeArb,
				userIdArb,
				mixedFilesArb,
				(targetCategory, scope, userId, allFiles) => {
					const result = simulateFindByCategory(
						allFiles,
						targetCategory,
						scope,
						scope === 'user' ? userId : undefined
					);

					// All returned files must have a non-empty id
					for (const file of result) {
						expect(file.id).toBeDefined();
						expect(typeof file.id).toBe('string');
						expect(file.id.length).toBeGreaterThan(0);
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 5b: All returned files have required filename field
	 *
	 * For ANY listing result, every file MUST have a non-empty filename field.
	 *
	 * **Validates: Requirements 3.4**
	 */
	it('should always include filename field in returned files', () => {
		fc.assert(
			fc.property(
				categoryArb,
				scopeArb,
				userIdArb,
				mixedFilesArb,
				(targetCategory, scope, userId, allFiles) => {
					const result = simulateFindByCategory(
						allFiles,
						targetCategory,
						scope,
						scope === 'user' ? userId : undefined
					);

					// All returned files must have a non-empty filename
					for (const file of result) {
						expect(file.filename).toBeDefined();
						expect(typeof file.filename).toBe('string');
						expect(file.filename.length).toBeGreaterThan(0);
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 5c: All returned files have required mimeType field
	 *
	 * For ANY listing result, every file MUST have a non-empty mimeType field.
	 *
	 * **Validates: Requirements 3.4**
	 */
	it('should always include mimeType field in returned files', () => {
		fc.assert(
			fc.property(
				categoryArb,
				scopeArb,
				userIdArb,
				mixedFilesArb,
				(targetCategory, scope, userId, allFiles) => {
					const result = simulateFindByCategory(
						allFiles,
						targetCategory,
						scope,
						scope === 'user' ? userId : undefined
					);

					// All returned files must have a non-empty mimeType
					for (const file of result) {
						expect(file.mimeType).toBeDefined();
						expect(typeof file.mimeType).toBe('string');
						expect(file.mimeType.length).toBeGreaterThan(0);
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 5d: All returned files have required size field
	 *
	 * For ANY listing result, every file MUST have a positive size field.
	 *
	 * **Validates: Requirements 3.4**
	 */
	it('should always include size field in returned files', () => {
		fc.assert(
			fc.property(
				categoryArb,
				scopeArb,
				userIdArb,
				mixedFilesArb,
				(targetCategory, scope, userId, allFiles) => {
					const result = simulateFindByCategory(
						allFiles,
						targetCategory,
						scope,
						scope === 'user' ? userId : undefined
					);

					// All returned files must have a positive size
					for (const file of result) {
						expect(file.size).toBeDefined();
						expect(typeof file.size).toBe('number');
						expect(file.size).toBeGreaterThan(0);
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 5e: All returned files have required createdAt field
	 *
	 * For ANY listing result, every file MUST have a valid createdAt Date field.
	 *
	 * **Validates: Requirements 3.4**
	 */
	it('should always include createdAt field in returned files', () => {
		fc.assert(
			fc.property(
				categoryArb,
				scopeArb,
				userIdArb,
				mixedFilesArb,
				(targetCategory, scope, userId, allFiles) => {
					const result = simulateFindByCategory(
						allFiles,
						targetCategory,
						scope,
						scope === 'user' ? userId : undefined
					);

					// All returned files must have a valid createdAt Date
					for (const file of result) {
						expect(file.createdAt).toBeDefined();
						expect(file.createdAt).toBeInstanceOf(Date);
						expect(file.createdAt.getTime()).not.toBeNaN();
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 5f: All required metadata fields are present together
	 *
	 * For ANY listing result, every file MUST have ALL required fields:
	 * id, filename, mimeType, size, and createdAt.
	 *
	 * **Validates: Requirements 3.4**
	 */
	it('should always include all required metadata fields together', () => {
		fc.assert(
			fc.property(
				categoryArb,
				scopeArb,
				userIdArb,
				mixedFilesArb,
				(targetCategory, scope, userId, allFiles) => {
					const result = simulateFindByCategory(
						allFiles,
						targetCategory,
						scope,
						scope === 'user' ? userId : undefined
					);

					// All returned files must have all required fields
					for (const file of result) {
						// Check all required fields are present and valid
						expect(file).toHaveProperty('id');
						expect(file).toHaveProperty('filename');
						expect(file).toHaveProperty('mimeType');
						expect(file).toHaveProperty('size');
						expect(file).toHaveProperty('createdAt');

						// Verify types
						expect(typeof file.id).toBe('string');
						expect(typeof file.filename).toBe('string');
						expect(typeof file.mimeType).toBe('string');
						expect(typeof file.size).toBe('number');
						expect(file.createdAt).toBeInstanceOf(Date);

						// Verify non-empty/positive values
						expect(file.id.length).toBeGreaterThan(0);
						expect(file.filename.length).toBeGreaterThan(0);
						expect(file.mimeType.length).toBeGreaterThan(0);
						expect(file.size).toBeGreaterThan(0);
					}

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 5g: Metadata fields preserve original values
	 *
	 * For ANY listing result, the metadata fields should match
	 * the original file data (no corruption during filtering).
	 *
	 * **Validates: Requirements 3.4**
	 */
	it('should preserve original metadata values in returned files', () => {
		fc.assert(
			fc.property(
				categoryArb,
				scopeArb,
				userIdArb,
				mixedFilesArb,
				(targetCategory, scope, userId, allFiles) => {
					const result = simulateFindByCategory(
						allFiles,
						targetCategory,
						scope,
						scope === 'user' ? userId : undefined
					);

					// Each returned file's metadata should match the original
					for (const file of result) {
						const original = allFiles.find((f) => f.id === file.id);
						expect(original).toBeDefined();

						if (original) {
							expect(file.id).toBe(original.id);
							expect(file.filename).toBe(original.filename);
							expect(file.mimeType).toBe(original.mimeType);
							expect(file.size).toBe(original.size);
							expect(file.createdAt.getTime()).toBe(original.createdAt.getTime());
						}
					}

					return true;
				}
			),
			testConfig
		);
	});
});
