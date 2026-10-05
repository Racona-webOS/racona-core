/**
 * Unit tesztek a notificationRepository felhasználóhoz kötött műveleteihez.
 *
 * Az olvasottnak jelölés és a törlés WHERE feltétele mindig tartalmazza a
 * notification id-t ÉS a tulajdonos userId-t, így más felhasználó értesítése
 * nem módosítható (IDOR védelem).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mockok ---

// Mock db — chain-style: update().set().where().returning() és delete().where().returning()
const mockUpdateReturning = vi.fn();
const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
const mockDeleteReturning = vi.fn();
const mockDeleteWhere = vi.fn().mockReturnValue({ returning: mockDeleteReturning });
const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

vi.mock('$lib/server/database', () => ({
	default: {
		update: (...args: unknown[]) => mockUpdate(...args),
		delete: (...args: unknown[]) => mockDelete(...args)
	}
}));

// Mock notifications schema object — vi.hoisted() szükséges, mert a vi.mock hoist-olódik
const fakeNotifications = vi.hoisted(() => ({
	id: 'id_col',
	userId: 'user_id_col',
	isRead: 'is_read_col',
	createdAt: 'created_at_col',
	type: 'type_col'
}));

vi.mock('@racona/database/schemas', () => ({
	notifications: fakeNotifications
}));

vi.mock('drizzle-orm', () => ({
	eq: vi.fn((col, val) => ({ op: 'eq', col, val })),
	and: vi.fn((...conditions) => ({ op: 'and', conditions })),
	desc: vi.fn(),
	asc: vi.fn(),
	count: vi.fn()
}));

import { notificationRepository } from '../notificationRepository';

const scopedCondition = (id: number, userId: number) => ({
	op: 'and',
	conditions: [
		{ op: 'eq', col: 'id_col', val: id },
		{ op: 'eq', col: 'user_id_col', val: userId }
	]
});

describe('notificationRepository — felhasználóhoz kötött műveletek', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('markAsReadForUser', () => {
		it('id-re és userId-ra együtt szűr', async () => {
			mockUpdateReturning.mockResolvedValue([{ id: 7, userId: 3, isRead: true }]);

			const result = await notificationRepository.markAsReadForUser(7, 3);

			expect(mockUpdateWhere).toHaveBeenCalledWith(scopedCondition(7, 3));
			expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ isRead: true }));
			expect(result).toEqual({ id: 7, userId: 3, isRead: true });
		});

		it('undefined-ot ad vissza, ha nincs egyező (idegen vagy nem létező) értesítés', async () => {
			mockUpdateReturning.mockResolvedValue([]);

			const result = await notificationRepository.markAsReadForUser(7, 99);

			expect(result).toBeUndefined();
		});
	});

	describe('deleteForUser', () => {
		it('id-re és userId-ra együtt szűr, és true-t ad vissza törléskor', async () => {
			mockDeleteReturning.mockResolvedValue([{ id: 7 }]);

			const result = await notificationRepository.deleteForUser(7, 3);

			expect(mockDelete).toHaveBeenCalledWith(fakeNotifications);
			expect(mockDeleteWhere).toHaveBeenCalledWith(scopedCondition(7, 3));
			expect(result).toBe(true);
		});

		it('false-t ad vissza, ha nincs egyező (idegen vagy nem létező) értesítés', async () => {
			mockDeleteReturning.mockResolvedValue([]);

			const result = await notificationRepository.deleteForUser(7, 99);

			expect(result).toBe(false);
		});
	});

	it('nem kínál felhasználóhoz nem kötött markAsRead/delete metódust', () => {
		expect(notificationRepository).not.toHaveProperty('markAsRead');
		expect(notificationRepository).not.toHaveProperty('delete');
	});
});
