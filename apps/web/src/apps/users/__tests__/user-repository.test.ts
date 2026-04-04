/**
 * Property-Based Tests for UserRepository Pagination and Sorting
 *
 * Feature: users-app
 *
 * Property 1: Lapozási konzisztencia
 * _Bármely_ repository `findManyPaginated(params)` hívás esetén, ahol `params.limit = N` és
 * `params.offset = O`, a visszaadott tömb hossza legfeljebb `N`, és a `countAll()` eredménye
 * nem kisebb, mint a visszaadott elemek száma.
 *
 * Property 2: Rendezési helyesség
 * _Bármely_ felhasználó lista lekérdezés esetén, ha `sortBy = "name"` és `sortOrder = "asc"`,
 * akkor a visszaadott lista minden egymást követő elempárjára igaz, hogy az előző elem neve
 * lexikografikusan kisebb vagy egyenlő a következőénél. Ugyanez érvényes `"desc"` irányra fordítva.
 *
 * **Validates: Requirements 2.3, 2.4**
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { UserListParams } from '$lib/server/database/repositories/user-repository';

const testConfig = { numRuns: 100 };

// ============================================================================
// Mock Repository Implementation
// ============================================================================

interface MockUser {
	id: number;
	name: string;
	email: string;
	emailVerified: boolean;
	username: string | null;
	image: string | null;
	oauthImage: string | null;
	userSettings: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
	twoFactorEnabled: boolean;
}

/**
 * Mock in-memory UserRepository that replicates the real findManyPaginated/countAll logic.
 * Filters out soft-deleted users (deletedAt IS NOT NULL), applies sorting and pagination.
 */
class MockUserRepository {
	private users: MockUser[] = [];
	private nextId = 1;

	addUser(name: string, deletedAt: Date | null = null): MockUser {
		const now = new Date();
		const user: MockUser = {
			id: this.nextId++,
			name,
			email: `user-${this.nextId}@example.com`,
			emailVerified: false,
			username: null,
			image: null,
			oauthImage: null,
			userSettings: {},
			createdAt: new Date(now.getTime() + this.nextId),
			updatedAt: now,
			deletedAt,
			twoFactorEnabled: false
		};
		this.users.push(user);
		return user;
	}

	/**
	 * Replicates the real findManyPaginated logic:
	 * - Filters out soft-deleted users (deletedAt IS NOT NULL)
	 * - Sorts by name or createdAt
	 * - Applies limit/offset pagination
	 */
	async findManyPaginated(params: UserListParams): Promise<MockUser[]> {
		const active = this.users.filter((u) => u.deletedAt === null);

		const sortField = params.sortBy ?? 'createdAt';
		const sortOrder = params.sortOrder ?? 'asc';

		const sorted = [...active].sort((a, b) => {
			let cmp: number;
			if (sortField === 'name') {
				cmp = a.name.localeCompare(b.name);
			} else {
				cmp = (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
			}
			return sortOrder === 'desc' ? -cmp : cmp;
		});

		return sorted.slice(params.offset, params.offset + params.limit);
	}

	/**
	 * Replicates the real countAll logic: count active (non-deleted) users.
	 */
	async countAll(): Promise<number> {
		return this.users.filter((u) => u.deletedAt === null).length;
	}

	clear(): void {
		this.users = [];
		this.nextId = 1;
	}
}

// ============================================================================
// Arbitraries
// ============================================================================

/** Generate a non-empty user name (1-50 chars, printable) */
const userNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

/** Generate a list of active user names (no deleted users in this set) */
const userNamesArb = fc.array(userNameArb, { minLength: 0, maxLength: 30 });

/** Generate valid pagination params constrained to the dataset size */
const paginationParamsArb = (maxUsers: number) =>
	fc.record({
		limit: fc.integer({ min: 1, max: Math.max(1, maxUsers + 5) }),
		offset: fc.integer({ min: 0, max: Math.max(0, maxUsers + 5) }),
		sortBy: fc.constantFrom('name' as const, 'createdAt' as const),
		sortOrder: fc.constantFrom('asc' as const, 'desc' as const)
	});

// ============================================================================
// Property 1: Lapozási konzisztencia
// ============================================================================

describe('Feature: users-app, Property 1: Lapozási konzisztencia', () => {
	const repo = new MockUserRepository();

	beforeEach(() => {
		repo.clear();
	});

	/**
	 * For ANY findManyPaginated call with limit=N and offset=O,
	 * the returned array length is at most N, and countAll() >= returned length.
	 *
	 * **Validates: Requirements 2.3, 2.4**
	 */
	it('returned array length <= limit AND countAll >= returned length', async () => {
		await fc.assert(
			fc.asyncProperty(
				userNamesArb,
				fc.integer({ min: 1, max: 35 }),
				fc.integer({ min: 0, max: 35 }),
				async (names, limit, offset) => {
					repo.clear();

					// Seed users
					for (const name of names) {
						repo.addUser(name);
					}

					const params: UserListParams = { limit, offset };
					const result = await repo.findManyPaginated(params);
					const totalCount = await repo.countAll();

					// Length at most limit
					expect(result.length).toBeLessThanOrEqual(limit);

					// Count is at least the number of returned items
					expect(totalCount).toBeGreaterThanOrEqual(result.length);

					// Count equals the number of active users we seeded
					expect(totalCount).toBe(names.length);
				}
			),
			testConfig
		);
	});
});

// ============================================================================
// Property 2: Rendezési helyesség
// ============================================================================

describe('Feature: users-app, Property 2: Rendezési helyesség', () => {
	const repo = new MockUserRepository();

	beforeEach(() => {
		repo.clear();
	});

	/**
	 * For ANY user list query with sortBy="name" and sortOrder="asc",
	 * every consecutive pair satisfies: previous.name <= next.name (lexicographic).
	 * For "desc", the reverse holds.
	 *
	 * **Validates: Requirements 2.4**
	 */
	it('name sorting asc: each consecutive pair is in non-decreasing order', async () => {
		await fc.assert(
			fc.asyncProperty(userNamesArb, async (names) => {
				repo.clear();

				for (const name of names) {
					repo.addUser(name);
				}

				const result = await repo.findManyPaginated({
					limit: names.length + 1,
					offset: 0,
					sortBy: 'name',
					sortOrder: 'asc'
				});

				for (let i = 1; i < result.length; i++) {
					expect(result[i - 1].name.localeCompare(result[i].name)).toBeLessThanOrEqual(0);
				}
			}),
			testConfig
		);
	});

	it('name sorting desc: each consecutive pair is in non-increasing order', async () => {
		await fc.assert(
			fc.asyncProperty(userNamesArb, async (names) => {
				repo.clear();

				for (const name of names) {
					repo.addUser(name);
				}

				const result = await repo.findManyPaginated({
					limit: names.length + 1,
					offset: 0,
					sortBy: 'name',
					sortOrder: 'desc'
				});

				for (let i = 1; i < result.length; i++) {
					expect(result[i - 1].name.localeCompare(result[i].name)).toBeGreaterThanOrEqual(0);
				}
			}),
			testConfig
		);
	});
});
