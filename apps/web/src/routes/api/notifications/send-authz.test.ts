/**
 * Unit tesztek: POST /api/notifications jogosultság ellenőrzés
 *
 * - Saját magának bárki küldhet értesítést (célzás nélkül is ez az alapértelmezés).
 * - Más felhasználó(k), csoport vagy broadcast célzásához notifications.send jogosultság kell,
 *   enélkül 403 és nem történik küldés.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mockok ---

const mockSendNotification = vi.fn();
const mockFindPermissionsForUser = vi.fn();

vi.mock('$lib/server/socket', () => ({
	sendNotification: (...args: unknown[]) => mockSendNotification(...args)
}));

vi.mock('$lib/server/database/repositories', () => ({
	notificationRepository: { getByUserId: vi.fn() },
	permissionRepository: {
		findPermissionsForUser: (...args: unknown[]) => mockFindPermissionsForUser(...args)
	}
}));

import { POST } from './+server';

type Event = Parameters<typeof POST>[0];

const CALLER_ID = 1;

function callPost(body: Record<string, unknown>, userId: string | null = String(CALLER_ID)) {
	return POST({
		request: new Request('http://localhost/api/notifications', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		}),
		locals: { user: userId ? { id: userId } : undefined }
	} as unknown as Event) as Promise<Response>;
}

const base = { title: 'Cím', message: 'Üzenet' };

describe('POST /api/notifications — jogosultság', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSendNotification.mockResolvedValue(undefined);
		mockFindPermissionsForUser.mockResolvedValue([]);
	});

	it('401-et ad bejelentkezés nélkül', async () => {
		const res = await callPost(base, null);

		expect(res.status).toBe(401);
		expect(mockSendNotification).not.toHaveBeenCalled();
	});

	it('400-at ad cím vagy üzenet nélkül', async () => {
		const res = await callPost({ title: 'Cím' });

		expect(res.status).toBe(400);
		expect(mockSendNotification).not.toHaveBeenCalled();
	});

	it('400-at ad ismeretlen típusra', async () => {
		const res = await callPost({ ...base, type: 'bogus' });

		expect(res.status).toBe(400);
		expect(mockSendNotification).not.toHaveBeenCalled();
	});

	describe('saját magának küldés — jogosultság nélkül is engedélyezett', () => {
		it('célzás nélkül a hívónak küld', async () => {
			const res = await callPost({ ...base, type: 'critical' });

			expect(res.status).toBe(200);
			expect(mockFindPermissionsForUser).not.toHaveBeenCalled();
			expect(mockSendNotification).toHaveBeenCalledWith(
				expect.objectContaining({ userId: CALLER_ID, broadcast: undefined, type: 'critical' })
			);
		});

		it('saját userId-val (stringként is) engedélyezett', async () => {
			const res = await callPost({ ...base, userId: String(CALLER_ID) });

			expect(res.status).toBe(200);
			expect(mockFindPermissionsForUser).not.toHaveBeenCalled();
			expect(mockSendNotification).toHaveBeenCalledWith(
				expect.objectContaining({ userId: CALLER_ID })
			);
		});

		it('csak saját id-t tartalmazó userIds engedélyezett', async () => {
			const res = await callPost({ ...base, userIds: [CALLER_ID, String(CALLER_ID)] });

			expect(res.status).toBe(200);
			expect(mockFindPermissionsForUser).not.toHaveBeenCalled();
		});
	});

	describe('más célpont jogosultság nélkül — 403', () => {
		it.each([
			['más userId', { userId: 2 }],
			['userIds idegen id-val', { userIds: [CALLER_ID, 2] }],
			['broadcast', { broadcast: true }],
			['broadcast saját userId mellett', { broadcast: true, userId: CALLER_ID }],
			['groupId', { groupId: 'admins' }]
		])('%s', async (_label, target) => {
			const res = await callPost({ ...base, ...target });

			expect(res.status).toBe(403);
			expect(mockFindPermissionsForUser).toHaveBeenCalledWith(CALLER_ID);
			expect(mockSendNotification).not.toHaveBeenCalled();
		});
	});

	describe('más célpont notifications.send jogosultsággal — engedélyezett', () => {
		beforeEach(() => {
			mockFindPermissionsForUser.mockResolvedValue(['notifications.send']);
		});

		it('más userId-nak küld', async () => {
			const res = await callPost({ ...base, userId: '2' });

			expect(res.status).toBe(200);
			expect(mockSendNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 2 }));
		});

		it('userIds listának küld', async () => {
			const res = await callPost({ ...base, userIds: ['2', 3] });

			expect(res.status).toBe(200);
			expect(mockSendNotification).toHaveBeenCalledWith(
				expect.objectContaining({ userIds: [2, 3] })
			);
		});

		it('broadcastot küld', async () => {
			const res = await callPost({ ...base, broadcast: true });

			expect(res.status).toBe(200);
			expect(mockSendNotification).toHaveBeenCalledWith(
				expect.objectContaining({ broadcast: true, userId: undefined, userIds: undefined })
			);
		});
	});

	it.each([
		['nem numerikus userId', { userId: 'abc' }],
		['negatív userId', { userId: -2 }],
		['üres userIds', { userIds: [] }],
		['nem tömb userIds', { userIds: '2' }],
		['érvénytelen elem a userIds-ben', { userIds: [2, 'x'] }]
	])('400-at ad érvénytelen célpontra: %s', async (_label, target) => {
		mockFindPermissionsForUser.mockResolvedValue(['notifications.send']);

		const res = await callPost({ ...base, ...target });

		expect(res.status).toBe(400);
		expect(mockSendNotification).not.toHaveBeenCalled();
	});

	it('nem továbbít ismeretlen mezőket a sendNotification-nek', async () => {
		await callPost({ ...base, injected: 'x' });

		expect(mockSendNotification.mock.calls[0][0]).not.toHaveProperty('injected');
	});
});
