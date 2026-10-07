/**
 * Unit tesztek: requirePluginAppAccess
 *
 * - Érvénytelen / hiányzó felhasználó → 401.
 * - Ha a felhasználó nem érheti el az appot (nem nyilvános, nincs szerepkör/csoport
 *   hozzárendelés) → 403 PERMISSION_DENIED.
 * - A string user id-t számmá alakítva adja tovább a repositorynak.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCanUserAccessApp = vi.fn();

vi.mock('$lib/server/database/repositories', () => ({
	appRepository: {
		canUserAccessApp: (...args: unknown[]) => mockCanUserAccessApp(...args)
	}
}));

import { requirePluginAppAccess } from './appAccess';

async function statusOf(promise: Promise<void>): Promise<number | 'ok'> {
	try {
		await promise;
		return 'ok';
	} catch (err) {
		return (err as { status: number }).status;
	}
}

describe('requirePluginAppAccess', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.each([[undefined], [''], ['abc'], [0], [-3], ['1.5']])(
		'érvénytelen felhasználó (%s) → 401, a repositoryt nem kérdezi',
		async (userId) => {
			expect(await statusOf(requirePluginAppAccess(userId, 'demo-plugin'))).toBe(401);
			expect(mockCanUserAccessApp).not.toHaveBeenCalled();
		}
	);

	it('hozzáférés nélkül 403', async () => {
		mockCanUserAccessApp.mockResolvedValue(false);

		expect(await statusOf(requirePluginAppAccess('7', 'demo-plugin'))).toBe(403);
		expect(mockCanUserAccessApp).toHaveBeenCalledWith(7, 'demo-plugin');
	});

	it('a 403 üzenete PERMISSION_DENIED kóddal kezdődik', async () => {
		mockCanUserAccessApp.mockResolvedValue(false);

		await expect(requirePluginAppAccess(7, 'demo-plugin')).rejects.toMatchObject({
			status: 403,
			body: { message: expect.stringMatching(/^PERMISSION_DENIED:/) }
		});
	});

	it('hozzáféréssel átengedi', async () => {
		mockCanUserAccessApp.mockResolvedValue(true);

		expect(await statusOf(requirePluginAppAccess(7, 'demo-plugin'))).toBe('ok');
	});
});
