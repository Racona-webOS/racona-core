/**
 * Unit tesztek: POST /api/plugins/[pluginId]/notifications jogosultság ellenőrzés
 *
 * - A plugin kliens oldali kódja a hívó nevében küld: saját magának bárki küldhet.
 * - Más felhasználó célzásához a hívónak notifications.send core jogosultság kell,
 *   enélkül 403 és nem jön létre értesítés (a célfelhasználó létezése sem derül ki).
 * - A plugin oldali feltételek (létezik, aktív, van 'notifications' joga) továbbra is kellenek.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apps, users } from '@racona/database';

// --- Mockok ---

const mockSendNotification = vi.fn();
const mockFindPermissionsForUser = vi.fn();
/** db.select().from(table).where().limit() eredménye táblánként */
const tableRows = new Map<unknown, unknown[]>();

vi.mock('$lib/server/database', () => ({
	default: {
		select: () => ({
			from: (table: unknown) => ({
				where: () => ({
					limit: () => Promise.resolve(tableRows.get(table) ?? [])
				})
			})
		})
	}
}));

vi.mock('$lib/server/socket', () => ({
	sendNotification: (...args: unknown[]) => mockSendNotification(...args)
}));

vi.mock('$lib/server/database/repositories', () => ({
	permissionRepository: {
		findPermissionsForUser: (...args: unknown[]) => mockFindPermissionsForUser(...args)
	}
}));

import { POST } from './+server';

type Event = Parameters<typeof POST>[0];

const CALLER_ID = 1;
const OTHER_ID = 2;
const PLUGIN_ID = 'demo-plugin';

const activePlugin = {
	pluginStatus: 'active',
	appType: 'plugin',
	pluginPermissions: ['notifications']
};

/** A handler SvelteKit error()-t dob, 500-nál Response-t ad — mindkettőből státuszt csinálunk. */
async function callPost(
	body: Record<string, unknown>,
	userId: string | null = String(CALLER_ID)
): Promise<number> {
	try {
		const res = (await POST({
			params: { pluginId: PLUGIN_ID },
			request: new Request(`http://localhost/api/plugins/${PLUGIN_ID}/notifications`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			}),
			locals: { user: userId ? { id: userId } : undefined }
		} as unknown as Event)) as Response;
		return res.status;
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			return (err as { status: number }).status;
		}
		throw err;
	}
}

const base = { title: 'Cím', message: 'Üzenet' };

describe('POST /api/plugins/[pluginId]/notifications — jogosultság', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'error').mockImplementation(() => {});
		mockSendNotification.mockResolvedValue([{ id: 99 }]);
		mockFindPermissionsForUser.mockResolvedValue([]);
		tableRows.clear();
		tableRows.set(apps, [activePlugin]);
		tableRows.set(users, [{ id: CALLER_ID }]);
	});

	it('401-et ad bejelentkezés nélkül', async () => {
		const status = await callPost({ ...base, userId: OTHER_ID }, null);

		expect(status).toBe(401);
		expect(mockSendNotification).not.toHaveBeenCalled();
	});

	describe('saját magának küldés — jogosultság nélkül is engedélyezett', () => {
		it.each([
			['számként', CALLER_ID],
			['stringként', String(CALLER_ID)]
		])('saját userId %s', async (_label, userId) => {
			const status = await callPost({ ...base, userId, type: 'critical' });

			expect(status).toBe(200);
			expect(mockFindPermissionsForUser).not.toHaveBeenCalled();
			expect(mockSendNotification).toHaveBeenCalledWith(
				expect.objectContaining({ userId: CALLER_ID, appName: PLUGIN_ID, type: 'critical' })
			);
		});
	});

	it('a sendNotification-ön keresztül küld (valós idejű push) és visszaadja a notificationId-t', async () => {
		const res = (await POST({
			params: { pluginId: PLUGIN_ID },
			request: new Request(`http://localhost/api/plugins/${PLUGIN_ID}/notifications`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...base, userId: CALLER_ID, injected: 'x' })
			}),
			locals: { user: { id: String(CALLER_ID) } }
		} as unknown as Event)) as Response;

		expect(await res.json()).toEqual({ success: true, notificationId: 99 });
		expect(mockSendNotification).toHaveBeenCalledTimes(1);
		expect(mockSendNotification.mock.calls[0][0]).toEqual({
			userId: CALLER_ID,
			appName: PLUGIN_ID,
			title: base.title,
			message: base.message,
			type: 'info'
		});
	});

	describe('más felhasználó jogosultság nélkül — 403', () => {
		it.each([
			['számként', OTHER_ID],
			['stringként', String(OTHER_ID)]
		])('más userId %s', async (_label, userId) => {
			tableRows.set(users, [{ id: OTHER_ID }]);

			const status = await callPost({ ...base, userId, type: 'critical' });

			expect(status).toBe(403);
			expect(mockFindPermissionsForUser).toHaveBeenCalledWith(CALLER_ID);
			expect(mockSendNotification).not.toHaveBeenCalled();
		});

		it('nem létező célfelhasználóra is 403-at ad (nem szivárogtat 404-gyel)', async () => {
			tableRows.set(users, []);

			const status = await callPost({ ...base, userId: 12345 });

			expect(status).toBe(403);
			expect(mockSendNotification).not.toHaveBeenCalled();
		});

		it('más core jogosultság nem elég', async () => {
			mockFindPermissionsForUser.mockResolvedValue(['notifications.view', 'plugin.manual.install']);
			tableRows.set(users, [{ id: OTHER_ID }]);

			const status = await callPost({ ...base, userId: OTHER_ID });

			expect(status).toBe(403);
			expect(mockSendNotification).not.toHaveBeenCalled();
		});
	});

	describe('más felhasználó notifications.send jogosultsággal — engedélyezett', () => {
		beforeEach(() => {
			mockFindPermissionsForUser.mockResolvedValue(['notifications.send']);
		});

		it('más userId-nak küld', async () => {
			tableRows.set(users, [{ id: OTHER_ID }]);

			const status = await callPost({ ...base, userId: String(OTHER_ID) });

			expect(status).toBe(200);
			expect(mockSendNotification).toHaveBeenCalledWith(
				expect.objectContaining({ userId: OTHER_ID, appName: PLUGIN_ID })
			);
		});

		it('nem létező célfelhasználóra 404-et ad', async () => {
			tableRows.set(users, []);

			const status = await callPost({ ...base, userId: 12345 });

			expect(status).toBe(404);
			expect(mockSendNotification).not.toHaveBeenCalled();
		});
	});

	describe('plugin feltételek — saját magának sem küldhet', () => {
		it.each([
			['nem létező plugin', [], 404],
			['inaktív plugin', [{ ...activePlugin, pluginStatus: 'inactive' }], 403],
			['nem plugin típusú app', [{ ...activePlugin, appType: 'core' }], 400],
			[
				'notifications jog nélküli plugin',
				[{ ...activePlugin, pluginPermissions: ['database'] }],
				403
			]
		])('%s', async (_label, pluginRows, expected) => {
			tableRows.set(apps, pluginRows);

			const status = await callPost({ ...base, userId: CALLER_ID });

			expect(status).toBe(expected);
			expect(mockSendNotification).not.toHaveBeenCalled();
		});
	});

	it.each([
		['hiányzó userId', { ...base }],
		['nem numerikus userId', { ...base, userId: 'abc' }],
		['negatív userId', { ...base, userId: -2 }],
		['hiányzó cím', { message: 'Üzenet', userId: CALLER_ID }],
		['ismeretlen típus', { ...base, userId: CALLER_ID, type: 'bogus' }]
	])('400-at ad érvénytelen kérésre: %s', async (_label, body) => {
		const status = await callPost(body);

		expect(status).toBe(400);
		expect(mockSendNotification).not.toHaveBeenCalled();
	});
});
