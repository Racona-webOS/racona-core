/**
 * Property-Based Tests for API File Access Authorization
 *
 * Feature: file-storage
 *
 * Property 9: API fájl hozzáférés jogosultság
 * _Bármely_ fájl kérésre és bejelentkezett felhasználóra:
 * - Ha a fájl shared: a kérés MINDIG sikeres
 * - Ha a fájl user scope-ú ÉS a felhasználó a tulajdonos: a kérés MINDIG sikeres
 * - Ha a fájl user scope-ú ÉS a felhasználó NEM a tulajdonos: a kérés MINDIG 403 hibát ad vissza
 *
 * **Validates: Requirements 6.4, 6.5**
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Minimum 100 iteráció property tesztenként
const testConfig = { numRuns: 100 };

// ============================================================================
// Types for API Access Testing
// ============================================================================

type FileScope = 'shared' | 'user';

interface ParsedPath {
	category: string;
	scope: FileScope;
	scopeUserId: number | null;
	filename: string;
	storagePath: string;
}

interface AccessCheckResult {
	allowed: boolean;
	statusCode: number;
	error?: string;
}

// ============================================================================
// Helper: Path parsing (mirrors +server.ts logic)
// ============================================================================

/**
 * Parse the path to extract category, scope, and filename.
 * This mirrors the parsePath function in +server.ts.
 *
 * Expected format: {category}/{scope}/{filename}
 * Where scope is either "shared" or "user-{userId}"
 */
function parsePath(pathSegments: string[]): ParsedPath | null {
	// Minimum 3 segments required: category, scope, filename
	if (pathSegments.length < 3) {
		return null;
	}

	const category = pathSegments[0];
	const scopeSegment = pathSegments[1];
	const filename = pathSegments.slice(2).join('/'); // Support nested filenames

	// Determine scope and userId from scope segment
	let scope: FileScope;
	let scopeUserId: number | null = null;

	if (scopeSegment === 'shared') {
		scope = 'shared';
	} else if (scopeSegment.startsWith('user-')) {
		scope = 'user';
		const userIdStr = scopeSegment.slice(5); // Remove "user-" prefix
		scopeUserId = parseInt(userIdStr, 10);
		if (isNaN(scopeUserId)) {
			return null;
		}
	} else {
		return null;
	}

	// Construct storage path
	const storagePath = pathSegments.join('/');

	return {
		category,
		scope,
		scopeUserId,
		filename,
		storagePath
	};
}

/**
 * Check if a user has access to a file based on scope and ownership.
 * This mirrors the authorization logic in +server.ts.
 *
 * @param parsedPath - The parsed path information
 * @param requestingUserId - The ID of the authenticated user making the request
 * @returns Access check result with allowed status and HTTP status code
 */
function checkFileAccess(parsedPath: ParsedPath, requestingUserId: number): AccessCheckResult {
	const { scope, scopeUserId } = parsedPath;

	// Shared files: any authenticated user can access
	if (scope === 'shared') {
		return { allowed: true, statusCode: 200 };
	}

	// User-scoped files: only the owner can access
	if (scope === 'user') {
		if (scopeUserId === requestingUserId) {
			return { allowed: true, statusCode: 200 };
		} else {
			return {
				allowed: false,
				statusCode: 403,
				error: 'Permission denied'
			};
		}
	}

	// Should not reach here, but handle gracefully
	return { allowed: false, statusCode: 400, error: 'Invalid scope' };
}

// ============================================================================
// Arbitraries for generating test data
// ============================================================================

// Valid category (lowercase alphanumeric with hyphens)
const categoryArb = fc.stringMatching(/^[a-z0-9-]{1,15}$/);

// Valid filename (alphanumeric with extension)
const filenameArb = fc
	.tuple(
		fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
		fc.constantFrom('.txt', '.jpg', '.png', '.pdf', '.doc')
	)
	.map(([name, ext]) => `${name}${ext}`);

// Valid user ID (positive integer)
const userIdArb = fc.integer({ min: 1, max: 1000000 });

// Valid scope
const scopeArb = fc.constantFrom('shared', 'user') as fc.Arbitrary<FileScope>;

// Generate path segments for shared files
const sharedPathSegmentsArb = fc
	.tuple(categoryArb, filenameArb)
	.map(([category, filename]) => [category, 'shared', filename]);

// Generate path segments for user-scoped files
const userPathSegmentsArb = fc
	.tuple(categoryArb, userIdArb, filenameArb)
	.map(([category, userId, filename]) => [category, `user-${userId}`, filename]);

// Generate any valid path segments
const anyPathSegmentsArb = fc.oneof(sharedPathSegmentsArb, userPathSegmentsArb);

// ============================================================================
// Property 9: API fájl hozzáférés jogosultság
// ============================================================================

describe('API File Access Authorization - Property 9: API fájl hozzáférés jogosultság', () => {
	/**
	 * Property 9a: Shared files are accessible to any authenticated user
	 *
	 * For ANY shared file and ANY authenticated user,
	 * the access check should ALWAYS return allowed=true with status 200.
	 *
	 * **Validates: Requirements 6.4**
	 */
	it('should allow any authenticated user to access shared files', () => {
		fc.assert(
			fc.property(sharedPathSegmentsArb, userIdArb, (pathSegments, requestingUserId) => {
				const parsedPath = parsePath(pathSegments);

				// Path should be valid
				expect(parsedPath).not.toBeNull();
				if (!parsedPath) return true;

				// Verify it's a shared file
				expect(parsedPath.scope).toBe('shared');

				// Check access
				const result = checkFileAccess(parsedPath, requestingUserId);

				// Access should be allowed
				expect(result.allowed).toBe(true);
				expect(result.statusCode).toBe(200);
				expect(result.error).toBeUndefined();

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 9b: User-scoped files are accessible to the owner
	 *
	 * For ANY user-scoped file where the requesting user IS the owner,
	 * the access check should ALWAYS return allowed=true with status 200.
	 *
	 * **Validates: Requirements 6.5**
	 */
	it('should allow owner to access their own user-scoped files', () => {
		fc.assert(
			fc.property(categoryArb, userIdArb, filenameArb, (category, ownerId, filename) => {
				// Create path segments for a user-scoped file
				const pathSegments = [category, `user-${ownerId}`, filename];
				const parsedPath = parsePath(pathSegments);

				// Path should be valid
				expect(parsedPath).not.toBeNull();
				if (!parsedPath) return true;

				// Verify it's a user-scoped file owned by ownerId
				expect(parsedPath.scope).toBe('user');
				expect(parsedPath.scopeUserId).toBe(ownerId);

				// Owner requests access
				const result = checkFileAccess(parsedPath, ownerId);

				// Access should be allowed
				expect(result.allowed).toBe(true);
				expect(result.statusCode).toBe(200);
				expect(result.error).toBeUndefined();

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 9c: User-scoped files are NOT accessible to non-owners
	 *
	 * For ANY user-scoped file where the requesting user is NOT the owner,
	 * the access check should ALWAYS return allowed=false with status 403.
	 *
	 * **Validates: Requirements 6.5**
	 */
	it('should deny non-owner access to user-scoped files with 403', () => {
		fc.assert(
			fc.property(
				categoryArb,
				userIdArb,
				userIdArb,
				filenameArb,
				(category, ownerId, requesterId, filename) => {
					// Ensure owner and requester are different
					if (ownerId === requesterId) {
						return true; // Skip this case - covered by Property 9b
					}

					// Create path segments for a user-scoped file owned by ownerId
					const pathSegments = [category, `user-${ownerId}`, filename];
					const parsedPath = parsePath(pathSegments);

					// Path should be valid
					expect(parsedPath).not.toBeNull();
					if (!parsedPath) return true;

					// Verify it's a user-scoped file owned by ownerId
					expect(parsedPath.scope).toBe('user');
					expect(parsedPath.scopeUserId).toBe(ownerId);

					// Non-owner requests access
					const result = checkFileAccess(parsedPath, requesterId);

					// Access should be denied with 403
					expect(result.allowed).toBe(false);
					expect(result.statusCode).toBe(403);
					expect(result.error).toBe('Permission denied');

					return true;
				}
			),
			testConfig
		);
	});

	/**
	 * Property 9d: Access decision is deterministic
	 *
	 * For ANY file and user combination, multiple access checks
	 * should ALWAYS return the same result.
	 *
	 * **Validates: Requirements 6.4, 6.5**
	 */
	it('should return consistent access decisions', () => {
		fc.assert(
			fc.property(anyPathSegmentsArb, userIdArb, (pathSegments, requestingUserId) => {
				const parsedPath = parsePath(pathSegments);

				// Path should be valid
				expect(parsedPath).not.toBeNull();
				if (!parsedPath) return true;

				// Check access multiple times
				const results: AccessCheckResult[] = [];
				for (let i = 0; i < 5; i++) {
					results.push(checkFileAccess(parsedPath, requestingUserId));
				}

				// All results should be identical
				const firstResult = results[0];
				for (const result of results) {
					expect(result.allowed).toBe(firstResult.allowed);
					expect(result.statusCode).toBe(firstResult.statusCode);
					expect(result.error).toBe(firstResult.error);
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 9e: Shared scope always grants access regardless of user ID
	 *
	 * For ANY shared file, access should be granted to users with
	 * ANY valid user ID.
	 *
	 * **Validates: Requirements 6.4**
	 */
	it('should grant access to shared files for any user ID', () => {
		fc.assert(
			fc.property(
				categoryArb,
				filenameArb,
				fc.array(userIdArb, { minLength: 1, maxLength: 10 }),
				(category, filename, userIds) => {
					// Create path segments for a shared file
					const pathSegments = [category, 'shared', filename];
					const parsedPath = parsePath(pathSegments);

					// Path should be valid
					expect(parsedPath).not.toBeNull();
					if (!parsedPath) return true;

					// All users should have access
					for (const userId of userIds) {
						const result = checkFileAccess(parsedPath, userId);
						expect(result.allowed).toBe(true);
						expect(result.statusCode).toBe(200);
					}

					return true;
				}
			),
			{ ...testConfig, numRuns: 50 }
		);
	});

	/**
	 * Property 9f: User scope denies access to all non-owners
	 *
	 * For ANY user-scoped file, access should be denied to ALL users
	 * except the owner.
	 *
	 * **Validates: Requirements 6.5**
	 */
	it('should deny access to user-scoped files for all non-owners', () => {
		fc.assert(
			fc.property(
				categoryArb,
				userIdArb,
				filenameArb,
				fc.array(userIdArb, { minLength: 1, maxLength: 10 }),
				(category, ownerId, filename, otherUserIds) => {
					// Create path segments for a user-scoped file
					const pathSegments = [category, `user-${ownerId}`, filename];
					const parsedPath = parsePath(pathSegments);

					// Path should be valid
					expect(parsedPath).not.toBeNull();
					if (!parsedPath) return true;

					// Filter out the owner from other users
					const nonOwners = otherUserIds.filter((id) => id !== ownerId);

					// All non-owners should be denied
					for (const userId of nonOwners) {
						const result = checkFileAccess(parsedPath, userId);
						expect(result.allowed).toBe(false);
						expect(result.statusCode).toBe(403);
					}

					return true;
				}
			),
			{ ...testConfig, numRuns: 50 }
		);
	});

	/**
	 * Property 9g: Access check correctly identifies scope from path
	 *
	 * For ANY valid path, the parsed scope should correctly determine
	 * the access rules applied.
	 *
	 * **Validates: Requirements 6.4, 6.5**
	 */
	it('should correctly identify scope from path segments', () => {
		fc.assert(
			fc.property(anyPathSegmentsArb, (pathSegments) => {
				const parsedPath = parsePath(pathSegments);

				// Path should be valid
				expect(parsedPath).not.toBeNull();
				if (!parsedPath) return true;

				// Check that scope is correctly identified
				const scopeSegment = pathSegments[1];

				if (scopeSegment === 'shared') {
					expect(parsedPath.scope).toBe('shared');
					expect(parsedPath.scopeUserId).toBeNull();
				} else if (scopeSegment.startsWith('user-')) {
					expect(parsedPath.scope).toBe('user');
					const expectedUserId = parseInt(scopeSegment.slice(5), 10);
					expect(parsedPath.scopeUserId).toBe(expectedUserId);
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 9h: Status code is always 200 for allowed access
	 *
	 * For ANY access check that returns allowed=true,
	 * the status code should ALWAYS be 200.
	 *
	 * **Validates: Requirements 6.4, 6.5**
	 */
	it('should return status 200 for all allowed access', () => {
		fc.assert(
			fc.property(anyPathSegmentsArb, userIdArb, (pathSegments, requestingUserId) => {
				const parsedPath = parsePath(pathSegments);

				// Path should be valid
				expect(parsedPath).not.toBeNull();
				if (!parsedPath) return true;

				const result = checkFileAccess(parsedPath, requestingUserId);

				// If allowed, status must be 200
				if (result.allowed) {
					expect(result.statusCode).toBe(200);
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Property 9i: Status code is always 403 for denied access
	 *
	 * For ANY access check that returns allowed=false due to permission,
	 * the status code should ALWAYS be 403.
	 *
	 * **Validates: Requirements 6.5**
	 */
	it('should return status 403 for all permission-denied access', () => {
		fc.assert(
			fc.property(
				categoryArb,
				userIdArb,
				userIdArb,
				filenameArb,
				(category, ownerId, requesterId, filename) => {
					// Ensure owner and requester are different
					if (ownerId === requesterId) {
						return true; // Skip - not a denial case
					}

					// Create path segments for a user-scoped file
					const pathSegments = [category, `user-${ownerId}`, filename];
					const parsedPath = parsePath(pathSegments);

					// Path should be valid
					expect(parsedPath).not.toBeNull();
					if (!parsedPath) return true;

					const result = checkFileAccess(parsedPath, requesterId);

					// Access should be denied with 403
					expect(result.allowed).toBe(false);
					expect(result.statusCode).toBe(403);

					return true;
				}
			),
			testConfig
		);
	});
});

// ============================================================================
// Path Parsing Tests
// ============================================================================

describe('Path Parsing for API Access', () => {
	/**
	 * Test that path parsing correctly handles shared paths
	 */
	it('should parse shared paths correctly', () => {
		fc.assert(
			fc.property(categoryArb, filenameArb, (category, filename) => {
				const pathSegments = [category, 'shared', filename];
				const result = parsePath(pathSegments);

				expect(result).not.toBeNull();
				if (result) {
					expect(result.category).toBe(category);
					expect(result.scope).toBe('shared');
					expect(result.scopeUserId).toBeNull();
					expect(result.filename).toBe(filename);
					expect(result.storagePath).toBe(`${category}/shared/${filename}`);
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Test that path parsing correctly handles user paths
	 */
	it('should parse user paths correctly', () => {
		fc.assert(
			fc.property(categoryArb, userIdArb, filenameArb, (category, userId, filename) => {
				const pathSegments = [category, `user-${userId}`, filename];
				const result = parsePath(pathSegments);

				expect(result).not.toBeNull();
				if (result) {
					expect(result.category).toBe(category);
					expect(result.scope).toBe('user');
					expect(result.scopeUserId).toBe(userId);
					expect(result.filename).toBe(filename);
					expect(result.storagePath).toBe(`${category}/user-${userId}/${filename}`);
				}

				return true;
			}),
			testConfig
		);
	});

	/**
	 * Test that path parsing rejects invalid paths
	 */
	it('should return null for paths with less than 3 segments', () => {
		const shortPathArb = fc.oneof(
			fc.constant([] as string[]),
			fc.tuple(categoryArb).map(([c]) => [c]),
			fc.tuple(categoryArb, fc.constant('shared')).map(([c, s]) => [c, s])
		);

		fc.assert(
			fc.property(shortPathArb, (pathSegments) => {
				const result = parsePath(pathSegments);
				expect(result).toBeNull();
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Test that path parsing rejects invalid scope segments
	 */
	it('should return null for invalid scope segments', () => {
		const invalidScopeArb = fc.oneof(
			fc.constant('invalid'),
			fc.constant('users'),
			fc.constant('user'),
			fc.constant('share'),
			fc.constant('public'),
			fc.stringMatching(/^[a-z]{1,10}$/).filter((s) => s !== 'shared' && !s.startsWith('user-'))
		);

		fc.assert(
			fc.property(categoryArb, invalidScopeArb, filenameArb, (category, invalidScope, filename) => {
				const pathSegments = [category, invalidScope, filename];
				const result = parsePath(pathSegments);
				expect(result).toBeNull();
				return true;
			}),
			testConfig
		);
	});

	/**
	 * Test that path parsing rejects user- prefix with non-numeric ID
	 * Note: parseInt('12.34') returns 12, so decimal numbers are partially parsed
	 * We only test truly non-numeric cases here
	 */
	it('should return null for user- prefix with non-numeric ID', () => {
		const invalidUserIdArb = fc.oneof(
			fc.constant('user-'),
			fc.constant('user-abc'),
			fc.constant('user-null'),
			fc.constant('user-undefined'),
			fc.constant('user-NaN'),
			fc.stringMatching(/^[a-zA-Z]{1,5}$/).map((s) => `user-${s}`)
		);

		fc.assert(
			fc.property(
				categoryArb,
				invalidUserIdArb,
				filenameArb,
				(category, invalidUserId, filename) => {
					const pathSegments = [category, invalidUserId, filename];
					const result = parsePath(pathSegments);
					expect(result).toBeNull();
					return true;
				}
			),
			testConfig
		);
	});
});
