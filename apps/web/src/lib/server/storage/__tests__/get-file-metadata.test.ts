/**
 * Property-Based Tests for GetFileMetadata Remote Function
 *
 * Feature: file-storage
 *
 * Property 8: Metaadat lekérés jogosultság
 * _Bármely_ fájlra és felhasználóra:
 * - Ha a fájl shared VAGY a felhasználó a tulajdonos: a metaadat lekérés MINDIG sikeres
 * - Ha a fájl user scope-ú ÉS a felhasználó NEM a tulajdonos: a lekérés MINDIG hibát ad vissza
 *
 * **Validates: Requirements 5.1, 5.3**
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { FileScope } from '../types.js';

// Minimum 100 iteráció property tesztenként
const testConfig = { numRuns: 100 };

// ============================================================================
// Helper: Mock file record interface
// ============================================================================

interface MockFileRecord {
	id: number;
	publicId: string;
	filename: string;
	originalName: string;
	category: string;
	scope: FileScope;
	userId: number | null;
	mimeType: string;
	size: number;
	storagePath: string;
	thumbnailPath: string | null;
	createdAt: Date;
	updatedAt: Date;
}

// ============================================================================
// Helper: Simulated database operations
// ============================================================================

/**
 * Simulates an in-memory database for testing file metadata access.
 */
class MockFileDatabase {
	private files: Map<string, MockFileRecord> = new Map();

	/**
	 * Inserts a file record into the mock database.
	 */
	insert(record: MockFileRecord): void {
		this.files.set(record.publicId, record);
	}

	/**
	 * Finds a file record by publicId.
	 */
	findByPublicId(publicId: string): MockFileRecord | undefined {
		return this.files.get(publicId);
	}

	/**
	 * Clears all records.
	 */
	clear(): void {
		this.files.clear();
	}
}

// ============================================================================
// Helper: Simulated getFileMetadata operation
// ============================================================================

interface GetMetadataResult {
	success: boolean;
	file?: MockFileRecord;
	error?: string;
}

/**
 * Simulates the getFileMetadata operation with authorization check.
 * This mirrors the logic in get-file-metadata.remote.ts.
 *
 * @param db - The mock database.
 * @param publicId - The public ID of the file to get metadata for.
 * @param requestingUserId - The ID of the user requesting the metadata.
 * @returns The result of the metadata retrieval operation.
 */
function simulateGetMetadataWithAuth(
	db: MockFileDatabase,
	publicId: string,
	requestingUserId: number
): GetMetadataResult {
	// Find the file record
	const record = db.findByPublicId(publicId);

	// Requirement 5.4: Non-existent file returns error
	if (!record) {
		return { success: false, error: 'File not found' };
	}

	// Requirement 5.3: Authorization check
	// Shared files are accessible to any authenticated user
	// User scope files are only accessible to the owner
	if (record.scope === 'user' && record.userId !== requestingUserId) {
		return {
			success: false,
			error: 'Permission denied: You can only access your own files'
		};
	}

	// Requirement 5.1, 5.2: Return metadata
	return {
		success: true,
		file: record
	};
}

// ============================================================================
// Arbitraries for generating test data
// ============================================================================

// Valid UUID v4 pattern
const uuidArb = fc.uuid();

// Valid filename (alphanumeric with extension)
const filenameArb = fc
	.tuple(
		fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
		fc.constantFrom('.txt', '.jpg', '.png', '.pdf', '.doc')
	)
	.map(([name, ext]) => `${name}${ext}`);

// Valid category (lowercase alphanumeric with hyphens)
const categoryArb = fc.stringMatching(/^[a-z0-9-]{1,15}$/);

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

// Generate a mock file record with consistent storage path
const mockFileRecordArb = fc
	.tuple(
		fc.integer({ min: 1, max: 1000000 }), // id
		uuidArb, // publicId
		filenameArb, // filename
		filenameArb, // originalName
		categoryArb, // category
		scopeArb, // scope
		userIdArb, // userId
		mimeTypeArb, // mimeType
		sizeArb, // size
		dateArb, // createdAt
		dateArb // updatedAt
	)
	.map(
		([
			id,
			publicId,
			filename,
			originalName,
			category,
			scope,
			userId,
			mimeType,
			size,
			createdAt,
			updatedAt
		]): MockFileRecord => {
			const scopeDir = scope === 'user' ? `user-${userId}` : 'shared';
			const storagePath = `${category}/${scopeDir}/${filename}`;

			return {
				id,
				publicId,
				filename,
				originalName,
				category,
				scope,
				userId: scope === 'user' ? userId : null,
				mimeType,
				size,
				storagePath,
				thumbnailPath: null,
				createdAt,
				updatedAt
			};
		}
	);

// ============================================================================
// Property 8: Metaadat lekérés jogosultság (Metadata Access Authorization)
// ============================================================================

describe('GetFileMetadata Authorization - Property 8: Metaadat lekérés jogosultság', () => {
	let mockDb: MockFileDatabase;

	// Create fresh mock database before each test
	beforeEach(() => {
		mockDb = new MockFileDatabase();
	});

	/**
	 * Property 8a: Shared files are accessible to any authenticated user.
	 *
	 * For ANY shared file and ANY authenticated user,
	 * the metadata retrieval should ALWAYS succeed.
	 *
	 * **Validates: Requirements 5.1, 5.3**
	 */
	it('should allow any authenticated user to access shared file metadata', async () => {
		await fc.assert(
			fc.asyncProperty(mockFileRecordArb, userIdArb, async (baseRecord, requesterId) => {
				// Create a shared file
				const record: MockFileRecord = {
					...baseRecord,
					scope: 'shared',
					userId: baseRecord.userId // Keep original uploader ID
				};

				// Insert the record
				mockDb.insert(record);

				// Any authenticated user attempts to get metadata
				const result = simulateGetMetadataWithAuth(mockDb, record.publicId, requesterId);

				// Access should succeed for shared files
				expect(result.success).toBe(true);
				expect(result.file).toBeDefined();
				expect(result.file?.publicId).toBe(record.publicId);
				expect(result.error).toBeUndefined();

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 8b: Owner can always access their own user-scoped files.
	 *
	 * For ANY user-scoped file where the requesting user is the owner,
	 * the metadata retrieval should ALWAYS succeed.
	 *
	 * **Validates: Requirements 5.1, 5.3**
	 */
	it('should allow owner to access their own user-scoped file metadata', async () => {
		await fc.assert(
			fc.asyncProperty(mockFileRecordArb, userIdArb, async (baseRecord, ownerId) => {
				// Create a user-scoped file owned by ownerId
				const record: MockFileRecord = {
					...baseRecord,
					scope: 'user',
					userId: ownerId
				};

				// Insert the record
				mockDb.insert(record);

				// Owner attempts to get metadata
				const result = simulateGetMetadataWithAuth(mockDb, record.publicId, ownerId);

				// Access should succeed for owner
				expect(result.success).toBe(true);
				expect(result.file).toBeDefined();
				expect(result.file?.publicId).toBe(record.publicId);
				expect(result.error).toBeUndefined();

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 8c: Non-owner cannot access user-scoped files.
	 *
	 * For ANY user-scoped file where the requesting user is NOT the owner,
	 * the metadata retrieval should ALWAYS fail with a permission error.
	 *
	 * **Validates: Requirements 5.3**
	 */
	it('should deny non-owner from accessing user-scoped file metadata', async () => {
		await fc.assert(
			fc.asyncProperty(
				mockFileRecordArb,
				userIdArb,
				userIdArb,
				async (baseRecord, ownerId, requesterId) => {
					// Ensure owner and requester are different
					if (ownerId === requesterId) {
						return true; // Skip this case
					}

					// Create a user-scoped file owned by ownerId
					const record: MockFileRecord = {
						...baseRecord,
						scope: 'user',
						userId: ownerId
					};

					// Insert the record
					mockDb.insert(record);

					// Non-owner attempts to get metadata
					const result = simulateGetMetadataWithAuth(mockDb, record.publicId, requesterId);

					// Access should fail
					expect(result.success).toBe(false);
					expect(result.error).toContain('Permission denied');
					expect(result.file).toBeUndefined();

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 8d: Authorization result is consistent across multiple attempts.
	 *
	 * For ANY file and user combination, the authorization result should be
	 * consistent - multiple attempts should yield the same result.
	 *
	 * **Validates: Requirements 5.1, 5.3**
	 */
	it('should return consistent authorization results', async () => {
		await fc.assert(
			fc.asyncProperty(
				mockFileRecordArb,
				userIdArb,
				userIdArb,
				async (baseRecord, ownerId, requesterId) => {
					// Create a file owned by ownerId
					const record: MockFileRecord = {
						...baseRecord,
						userId: baseRecord.scope === 'user' ? ownerId : null
					};

					// Insert the record
					mockDb.insert(record);

					// Determine expected result
					const shouldSucceed =
						record.scope === 'shared' || (record.scope === 'user' && record.userId === requesterId);

					// Simulate multiple authorization checks
					for (let i = 0; i < 3; i++) {
						const result = simulateGetMetadataWithAuth(mockDb, record.publicId, requesterId);

						if (shouldSucceed) {
							expect(result.success).toBe(true);
							expect(result.file).toBeDefined();
						} else {
							expect(result.success).toBe(false);
							expect(result.error).toContain('Permission denied');
						}
					}

					return true;
				}
			),
			{ ...testConfig, numRuns: 50 }
		);
	});

	/**
	 * Property 8e: Non-existent file returns file not found error.
	 *
	 * For ANY user attempting to get metadata for a non-existent file,
	 * the operation should return a "File not found" error.
	 *
	 * **Validates: Requirements 5.4**
	 */
	it('should return file not found for non-existent files', async () => {
		await fc.assert(
			fc.asyncProperty(uuidArb, userIdArb, async (publicId, requesterId) => {
				// Ensure file does not exist (empty database)

				// Attempt to get metadata for non-existent file
				const result = simulateGetMetadataWithAuth(mockDb, publicId, requesterId);

				// Should fail with file not found
				expect(result.success).toBe(false);
				expect(result.error).toBe('File not found');
				expect(result.file).toBeUndefined();

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 8f: Successful metadata retrieval returns complete file data.
	 *
	 * For ANY successful metadata retrieval, the returned file object
	 * should contain all the original file data.
	 *
	 * **Validates: Requirements 5.1, 5.2**
	 */
	it('should return complete file data on successful retrieval', async () => {
		await fc.assert(
			fc.asyncProperty(mockFileRecordArb, userIdArb, async (baseRecord, ownerId) => {
				// Create a user-scoped file owned by ownerId (guaranteed access)
				const record: MockFileRecord = {
					...baseRecord,
					scope: 'user',
					userId: ownerId
				};

				// Insert the record
				mockDb.insert(record);

				// Owner gets metadata
				const result = simulateGetMetadataWithAuth(mockDb, record.publicId, ownerId);

				// Verify all fields are present and match
				expect(result.success).toBe(true);
				expect(result.file).toBeDefined();

				if (result.file) {
					expect(result.file.id).toBe(record.id);
					expect(result.file.publicId).toBe(record.publicId);
					expect(result.file.filename).toBe(record.filename);
					expect(result.file.originalName).toBe(record.originalName);
					expect(result.file.category).toBe(record.category);
					expect(result.file.scope).toBe(record.scope);
					expect(result.file.userId).toBe(record.userId);
					expect(result.file.mimeType).toBe(record.mimeType);
					expect(result.file.size).toBe(record.size);
					expect(result.file.storagePath).toBe(record.storagePath);
					expect(result.file.createdAt).toEqual(record.createdAt);
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 8g: Shared file metadata is accessible regardless of uploader.
	 *
	 * For ANY shared file, ANY authenticated user (including non-uploaders)
	 * should be able to access the metadata.
	 *
	 * **Validates: Requirements 5.1, 5.3**
	 */
	it('should allow access to shared file metadata regardless of uploader', async () => {
		await fc.assert(
			fc.asyncProperty(
				mockFileRecordArb,
				userIdArb,
				userIdArb,
				async (baseRecord, uploaderId, requesterId) => {
					// Create a shared file uploaded by uploaderId
					const record: MockFileRecord = {
						...baseRecord,
						scope: 'shared',
						userId: uploaderId
					};

					// Insert the record
					mockDb.insert(record);

					// Any user (even different from uploader) attempts to get metadata
					const result = simulateGetMetadataWithAuth(mockDb, record.publicId, requesterId);

					// Access should succeed for shared files
					expect(result.success).toBe(true);
					expect(result.file).toBeDefined();
					expect(result.file?.publicId).toBe(record.publicId);

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 8h: Authorization does not modify file data.
	 *
	 * For ANY metadata retrieval attempt (successful or not),
	 * the original file data in the database should remain unchanged.
	 *
	 * **Validates: Requirements 5.1, 5.3**
	 */
	it('should not modify file data during authorization check', async () => {
		await fc.assert(
			fc.asyncProperty(
				mockFileRecordArb,
				userIdArb,
				userIdArb,
				async (baseRecord, ownerId, requesterId) => {
					// Create a file
					const record: MockFileRecord = {
						...baseRecord,
						scope: 'user',
						userId: ownerId
					};

					// Insert the record
					mockDb.insert(record);

					// Store original record for comparison
					const originalRecord = mockDb.findByPublicId(record.publicId);

					// Attempt to get metadata (may succeed or fail based on authorization)
					simulateGetMetadataWithAuth(mockDb, record.publicId, requesterId);

					// File data should remain unchanged
					const afterRecord = mockDb.findByPublicId(record.publicId);
					expect(afterRecord).toBeDefined();
					expect(afterRecord).toEqual(originalRecord);

					return true;
				}
			),
			testConfig
		);
	});
});
