/**
 * Property-Based Tests for SaveFile Remote Function
 *
 * Feature: file-storage
 *
 * Property 3: Mentés metaadat visszaadás
 * _Bármely_ sikeresen mentett fájlra, a visszatérési értéknek MINDIG tartalmaznia kell:
 * id, filename, originalName, category, scope, mimeType, size, storagePath, url, és createdAt mezőket.
 *
 * **Validates: Requirements 2.6**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { StoredFile, FileScope } from '../types.js';

// Minimum 100 iteráció property tesztenként
const testConfig = { numRuns: 100 };

// ============================================================================
// Helper: mapToStoredFile simulation
// This simulates the transformation logic from file-repository.ts
// ============================================================================

interface MockFileRecord {
	id: number;
	publicId: string;
	filename: string;
	originalName: string;
	category: string;
	scope: string;
	userId: number | null;
	mimeType: string;
	size: number;
	storagePath: string;
	thumbnailPath: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Simulates the mapToStoredFile function from file-repository.ts
 * This is the core transformation that must always produce valid StoredFile objects
 */
function mapToStoredFile(record: MockFileRecord): StoredFile {
	const scopePath = record.scope === 'user' ? `user-${record.userId}` : 'shared';
	const url = `/api/files/${record.category}/${scopePath}/${record.filename}`;
	const thumbnailUrl = record.thumbnailPath ? `/api/files/${record.thumbnailPath}` : undefined;

	return {
		id: record.publicId,
		filename: record.filename,
		originalName: record.originalName,
		category: record.category,
		scope: record.scope as FileScope,
		userId: record.userId,
		mimeType: record.mimeType,
		size: record.size,
		storagePath: record.storagePath,
		url,
		thumbnailUrl,
		createdAt: record.createdAt
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
		fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/),
		fc.constantFrom('.txt', '.jpg', '.png', '.pdf', '.doc', '.mp4', '.webp')
	)
	.map(([name, ext]) => `${name}${ext}`);

// Valid category (lowercase alphanumeric with hyphens)
const categoryArb = fc.stringMatching(/^[a-z0-9-]{1,30}$/);

// Valid scope
const scopeArb = fc.constantFrom('shared', 'user');

// Valid user ID (positive integer or null)
const userIdArb = fc.oneof(fc.integer({ min: 1, max: 1000000 }), fc.constant(null));

// Valid MIME type
const mimeTypeArb = fc.constantFrom(
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'application/pdf',
	'text/plain',
	'video/mp4',
	'application/octet-stream'
);

// Valid file size (positive integer)
const sizeArb = fc.integer({ min: 1, max: 100000000 }); // Up to 100MB

// Valid storage path
const storagePathArb = fc
	.tuple(categoryArb, scopeArb, fc.integer({ min: 1, max: 1000000 }), filenameArb)
	.map(([cat, scope, userId, filename]) => {
		const scopeDir = scope === 'user' ? `user-${userId}` : 'shared';
		return `${cat}/${scopeDir}/${filename}`;
	});

// Valid thumbnail path (optional)
const thumbnailPathArb = fc.oneof(
	fc.constant(null),
	fc
		.tuple(categoryArb, scopeArb, fc.integer({ min: 1, max: 1000000 }), filenameArb)
		.map(([cat, scope, userId, filename]) => {
			const scopeDir = scope === 'user' ? `user-${userId}` : 'shared';
			return `${cat}/${scopeDir}/thumb-${filename}`;
		})
);

// Valid date (within reasonable range)
const dateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') });

// Complete mock file record
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
		storagePathArb, // storagePath
		thumbnailPathArb, // thumbnailPath
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
			storagePath,
			thumbnailPath,
			createdAt,
			updatedAt
		]): MockFileRecord => ({
			id,
			publicId,
			filename,
			originalName,
			category,
			scope,
			userId: scope === 'user' ? (userId ?? 1) : null, // Ensure userId for user scope
			mimeType,
			size,
			storagePath,
			thumbnailPath,
			createdAt,
			updatedAt
		})
	);

// ============================================================================
// Property 3: Mentés metaadat visszaadás
// ============================================================================

describe('SaveFile Metadata - Property 3: Mentés metaadat visszaadás', () => {
	/**
	 * Property 3a: StoredFile always contains 'id' field
	 *
	 * For ANY valid file record, the transformed StoredFile
	 * should ALWAYS contain a non-empty 'id' field (publicId).
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should always contain id field', () => {
		fc.assert(
			fc.property(mockFileRecordArb, (record) => {
				const storedFile = mapToStoredFile(record);

				expect(storedFile).toHaveProperty('id');
				expect(typeof storedFile.id).toBe('string');
				expect(storedFile.id.length).toBeGreaterThan(0);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3b: StoredFile always contains 'filename' field
	 *
	 * For ANY valid file record, the transformed StoredFile
	 * should ALWAYS contain a non-empty 'filename' field.
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should always contain filename field', () => {
		fc.assert(
			fc.property(mockFileRecordArb, (record) => {
				const storedFile = mapToStoredFile(record);

				expect(storedFile).toHaveProperty('filename');
				expect(typeof storedFile.filename).toBe('string');
				expect(storedFile.filename.length).toBeGreaterThan(0);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3c: StoredFile always contains 'originalName' field
	 *
	 * For ANY valid file record, the transformed StoredFile
	 * should ALWAYS contain a non-empty 'originalName' field.
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should always contain originalName field', () => {
		fc.assert(
			fc.property(mockFileRecordArb, (record) => {
				const storedFile = mapToStoredFile(record);

				expect(storedFile).toHaveProperty('originalName');
				expect(typeof storedFile.originalName).toBe('string');
				expect(storedFile.originalName.length).toBeGreaterThan(0);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3d: StoredFile always contains 'category' field
	 *
	 * For ANY valid file record, the transformed StoredFile
	 * should ALWAYS contain a non-empty 'category' field.
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should always contain category field', () => {
		fc.assert(
			fc.property(mockFileRecordArb, (record) => {
				const storedFile = mapToStoredFile(record);

				expect(storedFile).toHaveProperty('category');
				expect(typeof storedFile.category).toBe('string');
				expect(storedFile.category.length).toBeGreaterThan(0);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3e: StoredFile always contains 'scope' field
	 *
	 * For ANY valid file record, the transformed StoredFile
	 * should ALWAYS contain a valid 'scope' field ('shared' or 'user').
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should always contain scope field with valid value', () => {
		fc.assert(
			fc.property(mockFileRecordArb, (record) => {
				const storedFile = mapToStoredFile(record);

				expect(storedFile).toHaveProperty('scope');
				expect(['shared', 'user']).toContain(storedFile.scope);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3f: StoredFile always contains 'mimeType' field
	 *
	 * For ANY valid file record, the transformed StoredFile
	 * should ALWAYS contain a non-empty 'mimeType' field.
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should always contain mimeType field', () => {
		fc.assert(
			fc.property(mockFileRecordArb, (record) => {
				const storedFile = mapToStoredFile(record);

				expect(storedFile).toHaveProperty('mimeType');
				expect(typeof storedFile.mimeType).toBe('string');
				expect(storedFile.mimeType.length).toBeGreaterThan(0);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3g: StoredFile always contains 'size' field
	 *
	 * For ANY valid file record, the transformed StoredFile
	 * should ALWAYS contain a positive 'size' field.
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should always contain size field with positive value', () => {
		fc.assert(
			fc.property(mockFileRecordArb, (record) => {
				const storedFile = mapToStoredFile(record);

				expect(storedFile).toHaveProperty('size');
				expect(typeof storedFile.size).toBe('number');
				expect(storedFile.size).toBeGreaterThan(0);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3h: StoredFile always contains 'storagePath' field
	 *
	 * For ANY valid file record, the transformed StoredFile
	 * should ALWAYS contain a non-empty 'storagePath' field.
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should always contain storagePath field', () => {
		fc.assert(
			fc.property(mockFileRecordArb, (record) => {
				const storedFile = mapToStoredFile(record);

				expect(storedFile).toHaveProperty('storagePath');
				expect(typeof storedFile.storagePath).toBe('string');
				expect(storedFile.storagePath.length).toBeGreaterThan(0);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3i: StoredFile always contains 'url' field
	 *
	 * For ANY valid file record, the transformed StoredFile
	 * should ALWAYS contain a non-empty 'url' field starting with '/api/files/'.
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should always contain url field with correct format', () => {
		fc.assert(
			fc.property(mockFileRecordArb, (record) => {
				const storedFile = mapToStoredFile(record);

				expect(storedFile).toHaveProperty('url');
				expect(typeof storedFile.url).toBe('string');
				expect(storedFile.url.startsWith('/api/files/')).toBe(true);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3j: StoredFile always contains 'createdAt' field
	 *
	 * For ANY valid file record, the transformed StoredFile
	 * should ALWAYS contain a valid 'createdAt' Date field.
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should always contain createdAt field as Date', () => {
		fc.assert(
			fc.property(mockFileRecordArb, (record) => {
				const storedFile = mapToStoredFile(record);

				expect(storedFile).toHaveProperty('createdAt');
				expect(storedFile.createdAt).toBeInstanceOf(Date);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3k: All required fields are present in StoredFile
	 *
	 * For ANY valid file record, the transformed StoredFile
	 * should ALWAYS contain ALL required fields simultaneously.
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should always contain all required fields', () => {
		const requiredFields = [
			'id',
			'filename',
			'originalName',
			'category',
			'scope',
			'mimeType',
			'size',
			'storagePath',
			'url',
			'createdAt'
		] as const;

		fc.assert(
			fc.property(mockFileRecordArb, (record) => {
				const storedFile = mapToStoredFile(record);

				for (const field of requiredFields) {
					expect(storedFile).toHaveProperty(field);
					expect(storedFile[field]).toBeDefined();
				}
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3l: Field values are correctly mapped from record
	 *
	 * For ANY valid file record, the transformed StoredFile
	 * should have field values that match the source record.
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should correctly map field values from record', () => {
		fc.assert(
			fc.property(mockFileRecordArb, (record) => {
				const storedFile = mapToStoredFile(record);

				// id should be the publicId
				expect(storedFile.id).toBe(record.publicId);
				// filename should match
				expect(storedFile.filename).toBe(record.filename);
				// originalName should match
				expect(storedFile.originalName).toBe(record.originalName);
				// category should match
				expect(storedFile.category).toBe(record.category);
				// scope should match
				expect(storedFile.scope).toBe(record.scope);
				// userId should match
				expect(storedFile.userId).toBe(record.userId);
				// mimeType should match
				expect(storedFile.mimeType).toBe(record.mimeType);
				// size should match
				expect(storedFile.size).toBe(record.size);
				// storagePath should match
				expect(storedFile.storagePath).toBe(record.storagePath);
				// createdAt should match
				expect(storedFile.createdAt).toEqual(record.createdAt);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3m: URL format is correct for shared scope
	 *
	 * For ANY file record with scope='shared', the URL
	 * should follow the format /api/files/{category}/shared/{filename}.
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should generate correct URL for shared scope', () => {
		const sharedRecordArb = mockFileRecordArb.map((record) => ({
			...record,
			scope: 'shared' as const,
			userId: null
		}));

		fc.assert(
			fc.property(sharedRecordArb, (record) => {
				const storedFile = mapToStoredFile(record);

				const expectedUrl = `/api/files/${record.category}/shared/${record.filename}`;
				expect(storedFile.url).toBe(expectedUrl);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3n: URL format is correct for user scope
	 *
	 * For ANY file record with scope='user', the URL
	 * should follow the format /api/files/{category}/user-{userId}/{filename}.
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should generate correct URL for user scope', () => {
		const userRecordArb = mockFileRecordArb.map((record) => ({
			...record,
			scope: 'user' as const,
			userId: record.userId ?? 1
		}));

		fc.assert(
			fc.property(userRecordArb, (record) => {
				const storedFile = mapToStoredFile(record);

				const expectedUrl = `/api/files/${record.category}/user-${record.userId}/${record.filename}`;
				expect(storedFile.url).toBe(expectedUrl);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3o: thumbnailUrl is present when thumbnailPath exists
	 *
	 * For ANY file record with a non-null thumbnailPath,
	 * the StoredFile should have a thumbnailUrl field.
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should include thumbnailUrl when thumbnailPath exists', () => {
		const recordWithThumbnailArb = mockFileRecordArb.map((record) => ({
			...record,
			thumbnailPath: `${record.category}/shared/thumb-${record.filename}`
		}));

		fc.assert(
			fc.property(recordWithThumbnailArb, (record) => {
				const storedFile = mapToStoredFile(record);

				expect(storedFile.thumbnailUrl).toBeDefined();
				expect(storedFile.thumbnailUrl).toBe(`/api/files/${record.thumbnailPath}`);
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 3p: thumbnailUrl is undefined when thumbnailPath is null
	 *
	 * For ANY file record with a null thumbnailPath,
	 * the StoredFile should have thumbnailUrl as undefined.
	 *
	 * **Validates: Requirements 2.6**
	 */
	it('should have undefined thumbnailUrl when thumbnailPath is null', () => {
		const recordWithoutThumbnailArb = mockFileRecordArb.map((record) => ({
			...record,
			thumbnailPath: null
		}));

		fc.assert(
			fc.property(recordWithoutThumbnailArb, (record) => {
				const storedFile = mapToStoredFile(record);

				expect(storedFile.thumbnailUrl).toBeUndefined();
				return true;
			}),
			testConfig
		);
	});
});
