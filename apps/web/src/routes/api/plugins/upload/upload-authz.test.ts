/**
 * Unit tesztek: POST /api/plugins/upload jogosultság ellenőrzés
 *
 * - A feltöltés validál és telepít is, a plugin szerverkódja a core folyamatában fut,
 *   ezért ugyanaz a plugin.manual.install jog kell hozzá, mint az /install végponthoz.
 * - Jogosultság nélkül 403, és a kérés törzse fel sem dolgozódik.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mockok ---

const mockFindPermissionsForUser = vi.fn();
const mockValidate = vi.fn();
const mockInstall = vi.fn();

vi.mock('$lib/server/database/repositories', () => ({
	permissionRepository: {
		findPermissionsForUser: (...args: unknown[]) => mockFindPermissionsForUser(...args)
	}
}));

vi.mock('$lib/server/plugins/validation/PluginValidator', () => ({
	PluginValidator: class {
		validate = (...args: unknown[]) => mockValidate(...args);
	}
}));

vi.mock('$lib/server/plugins/installer/PluginInstaller', () => ({
	PluginInstaller: class {
		install = (...args: unknown[]) => mockInstall(...args);
	}
}));

vi.mock('$lib/server/activity-log/service', () => ({
	activityLogService: { log: vi.fn() }
}));

import { POST } from './+server';

type Event = Parameters<typeof POST>[0];

/** A handler SvelteKit error()-t dob, 500-nál Response-t ad — mindkettőből státuszt csinálunk. */
async function callPost(userId: string | null): Promise<number> {
	const request = new Request('http://localhost/api/plugins/upload', { method: 'POST' });
	const formDataSpy = vi.spyOn(request, 'formData').mockResolvedValue(new FormData());
	const event = { request, locals: { user: userId ? { id: userId } : null } } as unknown as Event;

	try {
		const res = await POST(event);
		return res.status;
	} catch (err) {
		return (err as { status: number }).status;
	} finally {
		lastFormDataCalls = formDataSpy.mock.calls.length;
	}
}

let lastFormDataCalls = 0;

describe('POST /api/plugins/upload — jogosultság', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		lastFormDataCalls = 0;
	});

	it('bejelentkezés nélkül 401', async () => {
		expect(await callPost(null)).toBe(401);
		expect(mockFindPermissionsForUser).not.toHaveBeenCalled();
	});

	it('plugin.manual.install nélkül 403, a feltöltést nem dolgozza fel', async () => {
		mockFindPermissionsForUser.mockResolvedValue(['notifications.send']);

		expect(await callPost('5')).toBe(403);
		expect(mockFindPermissionsForUser).toHaveBeenCalledWith(5);
		expect(lastFormDataCalls).toBe(0);
		expect(mockValidate).not.toHaveBeenCalled();
		expect(mockInstall).not.toHaveBeenCalled();
	});

	it('plugin.manual.install joggal továbbjut a fájl-ellenőrzésig', async () => {
		mockFindPermissionsForUser.mockResolvedValue(['plugin.manual.install']);

		// Üres form-data → a jogellenőrzés után a hiányzó fájl miatt 400
		expect(await callPost('5')).toBe(400);
		expect(lastFormDataCalls).toBe(1);
	});
});
