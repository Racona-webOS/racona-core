/**
 * Unit tesztek: POST /api/notifications/[id]/read
 *
 * A felhasználó csak a saját értesítését jelölheti olvasottnak — idegen vagy
 * nem létező értesítésre 404 a válasz (IDOR védelem).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mockok ---

const mockMarkAsReadForUser = vi.fn();

vi.mock('$lib/server/database/repositories', () => ({
	notificationRepository: {
		markAsReadForUser: (...args: unknown[]) => mockMarkAsReadForUser(...args)
	}
}));

import { POST } from './+server';

type Event = Parameters<typeof POST>[0];

function callPost(id: string, userId?: string) {
	return POST({
		params: { id },
		locals: { user: userId ? { id: userId } : undefined }
	} as unknown as Event) as Promise<Response>;
}

describe('POST /api/notifications/[id]/read', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('401-et ad bejelentkezés nélkül', async () => {
		const res = await callPost('5');

		expect(res.status).toBe(401);
		expect(mockMarkAsReadForUser).not.toHaveBeenCalled();
	});

	it('400-at ad érvénytelen id-ra', async () => {
		const res = await callPost('abc', '1');

		expect(res.status).toBe(400);
		expect(mockMarkAsReadForUser).not.toHaveBeenCalled();
	});

	it('a bejelentkezett felhasználóra szűkítve jelöl olvasottnak', async () => {
		mockMarkAsReadForUser.mockResolvedValue({ id: 5, userId: 1, isRead: true });

		const res = await callPost('5', '1');

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ success: true });
		expect(mockMarkAsReadForUser).toHaveBeenCalledWith(5, 1);
	});

	it('404-et ad, ha az értesítés más felhasználóé vagy nem létezik', async () => {
		mockMarkAsReadForUser.mockResolvedValue(undefined);

		const res = await callPost('5', '2');

		expect(res.status).toBe(404);
		expect(mockMarkAsReadForUser).toHaveBeenCalledWith(5, 2);
	});

	it('500-at ad adatbázis hibára', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		mockMarkAsReadForUser.mockRejectedValue(new Error('db down'));

		const res = await callPost('5', '1');

		expect(res.status).toBe(500);
	});
});
