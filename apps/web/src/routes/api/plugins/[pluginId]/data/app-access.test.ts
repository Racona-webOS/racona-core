/**
 * Unit tesztek: POST /api/plugins/[pluginId]/data/{get,set,delete,query} — app-hozzáférés
 *
 * A plugin adatai csak annak a felhasználónak érhetők el, aki az appot is elérheti
 * (nyilvános app, vagy szerepkörén/csoportján keresztül hozzárendelt). Különben 403,
 * és az adatbázishoz sem nyúl a végpont.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCanUserAccessApp = vi.fn();
const mockExecute = vi.fn();
const mockPoolQuery = vi.fn();

vi.mock('$lib/server/database', () => ({
	default: {
		select: () => ({
			from: () => ({
				where: () => ({
					limit: () =>
						Promise.resolve([
							{ pluginStatus: 'active', appType: 'plugin', pluginPermissions: ['database'] }
						])
				})
			})
		}),
		execute: (...args: unknown[]) => mockExecute(...args)
	},
	client: { query: (...args: unknown[]) => mockPoolQuery(...args) }
}));

vi.mock('$lib/server/database/repositories', () => ({
	appRepository: {
		canUserAccessApp: (...args: unknown[]) => mockCanUserAccessApp(...args)
	}
}));

import { POST as getPost } from './get/+server';
import { POST as setPost } from './set/+server';
import { POST as deletePost } from './delete/+server';
import { POST as queryPost } from './query/+server';

const PLUGIN_ID = 'demo-plugin';

type Handler = (event: never) => Promise<Response>;

const routes: Array<[string, Handler, Record<string, unknown>]> = [
	['get', getPost as unknown as Handler, { key: 'k' }],
	['set', setPost as unknown as Handler, { key: 'k', value: 1 }],
	['delete', deletePost as unknown as Handler, { key: 'k' }],
	['query', queryPost as unknown as Handler, { sql: 'SELECT * FROM items', params: [] }]
];

async function call(handler: Handler, body: Record<string, unknown>): Promise<number> {
	try {
		const res = await handler({
			params: { pluginId: PLUGIN_ID },
			request: new Request(`http://localhost/api/plugins/${PLUGIN_ID}/data`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			}),
			locals: { user: { id: '7' } }
		} as never);
		return res.status;
	} catch (err) {
		return (err as { status: number }).status;
	}
}

describe('POST /api/plugins/[pluginId]/data/* — app-hozzáférés', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'error').mockImplementation(() => {});
		mockExecute.mockResolvedValue({ rows: [] });
		mockPoolQuery.mockResolvedValue({ rows: [], rowCount: 0 });
	});

	it.each(routes)('%s: hozzáférés nélkül 403, adatbázist nem ér', async (_name, handler, body) => {
		mockCanUserAccessApp.mockResolvedValue(false);

		expect(await call(handler, body)).toBe(403);
		expect(mockCanUserAccessApp).toHaveBeenCalledWith(7, PLUGIN_ID);
		expect(mockExecute).not.toHaveBeenCalled();
		expect(mockPoolQuery).not.toHaveBeenCalled();
	});

	it.each(routes)('%s: hozzáféréssel lefut a lekérdezés', async (_name, handler, body) => {
		mockCanUserAccessApp.mockResolvedValue(true);

		expect(await call(handler, body)).toBe(200);
		expect(mockExecute.mock.calls.length + mockPoolQuery.mock.calls.length).toBe(1);
	});
});
