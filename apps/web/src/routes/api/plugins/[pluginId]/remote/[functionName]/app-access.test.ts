/**
 * Unit tesztek: POST /api/plugins/[pluginId]/remote/[functionName] — app-hozzáférés
 *
 * A remote függvény csak akkor töltődik be és fut, ha a hívó felhasználó az appot is
 * elérheti (nyilvános app, vagy szerepkörén/csoportján keresztül hozzárendelt).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCanUserAccessApp = vi.fn();
const mockResolveServerModuleUrl = vi.fn();

vi.mock('$lib/server/database', () => ({
	default: {
		select: () => ({
			from: () => ({
				where: () => ({
					limit: () =>
						Promise.resolve([
							{
								pluginStatus: 'active',
								appType: 'plugin',
								pluginPermissions: ['remote_functions']
							}
						])
				})
			})
		})
	},
	client: { query: () => Promise.resolve({ rows: [] }) }
}));

vi.mock('$lib/server/database/repositories', () => ({
	appRepository: {
		canUserAccessApp: (...args: unknown[]) => mockCanUserAccessApp(...args)
	}
}));

vi.mock('$lib/server/scheduler/repository', () => ({
	isRegisteredJobHandler: () => Promise.resolve(false)
}));

vi.mock('$lib/server/plugins/utils/filesystem', () => ({
	getPluginDir: () => '/nonexistent/plugin'
}));

vi.mock('$lib/server/plugins/utils/server-snapshot', () => ({
	resolveServerModuleUrl: (...args: unknown[]) => mockResolveServerModuleUrl(...args)
}));

vi.mock('$lib/server/plugins/runtime/services', () => ({
	createPluginDb: vi.fn(),
	createPluginEmailService: vi.fn(),
	createPluginNotificationService: vi.fn(),
	prefixTemplateName: vi.fn()
}));

vi.mock('$lib/server/plugins/files', () => ({
	createPluginFileService: vi.fn()
}));

import { POST } from './+server';

type Event = Parameters<typeof POST>[0];

const PLUGIN_ID = 'demo-plugin';

async function callRemote(): Promise<number> {
	try {
		const res = (await POST({
			params: { pluginId: PLUGIN_ID, functionName: 'ping' },
			request: new Request(`http://localhost/api/plugins/${PLUGIN_ID}/remote/ping`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ params: {} })
			}),
			locals: { user: { id: '7' } }
		} as unknown as Event)) as Response;
		return res.status;
	} catch (err) {
		return (err as { status: number }).status;
	}
}

describe('POST /api/plugins/[pluginId]/remote/[functionName] — app-hozzáférés', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'error').mockImplementation(() => {});
		// A modul betöltését itt megállítjuk — a teszt csak azt nézi, eljut-e idáig a kérés
		mockResolveServerModuleUrl.mockRejectedValue(new Error('stop'));
	});

	it('hozzáférés nélkül 403, a plugin szerverkódja be sem töltődik', async () => {
		mockCanUserAccessApp.mockResolvedValue(false);

		expect(await callRemote()).toBe(403);
		expect(mockCanUserAccessApp).toHaveBeenCalledWith(7, PLUGIN_ID);
		expect(mockResolveServerModuleUrl).not.toHaveBeenCalled();
	});

	it('hozzáféréssel eljut a szerverkód betöltéséig', async () => {
		mockCanUserAccessApp.mockResolvedValue(true);

		await callRemote();
		expect(mockResolveServerModuleUrl).toHaveBeenCalledTimes(1);
	});
});
