/**
 * Unit tesztek: GET /api/plugins/[pluginId]/components/[componentName]
 *
 * A komponens bundle URL-je nem verziózott, ezért a válasz nem kerülhet
 * lejárati idővel cache-be: plugin frissítés után azonnal az új kódnak kell
 * futnia. Változatlan fájlra az ETag alapú újraellenőrzés 304-et ad.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, utimes } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

let pluginsRoot = '';

vi.mock('$lib/server/plugins/utils/filesystem', () => ({
	getPluginDir: (pluginId: string) => join(pluginsRoot, pluginId)
}));

import { GET } from './+server';

type Event = Parameters<typeof GET>[0];

function callGet(pluginId: string, componentName: string, ifNoneMatch?: string) {
	const headers = new Headers();
	if (ifNoneMatch) headers.set('if-none-match', ifNoneMatch);
	return GET({
		params: { pluginId, componentName },
		request: new Request('http://localhost/', { headers })
	} as unknown as Event) as Promise<Response>;
}

async function writeComponent(code: string, mtime: Date) {
	const dir = join(pluginsRoot, 'demo-plugin', 'dist', 'components');
	await mkdir(dir, { recursive: true });
	const file = join(dir, 'Dashboard.iife.js');
	await writeFile(file, code);
	await utimes(file, mtime, mtime);
}

describe('GET /api/plugins/[pluginId]/components/[componentName]', () => {
	beforeEach(async () => {
		pluginsRoot = await mkdtemp(join(tmpdir(), 'plugin-components-'));
	});

	afterEach(async () => {
		await rm(pluginsRoot, { recursive: true, force: true });
	});

	it('a bundle-t no-cache + ETag fejléccel adja vissza', async () => {
		await writeComponent('console.log(1);', new Date('2026-09-10T10:00:00Z'));

		const res = await callGet('demo-plugin', 'Dashboard');

		expect(res.status).toBe(200);
		expect(res.headers.get('cache-control')).toBe('no-cache');
		expect(res.headers.get('etag')).toMatch(/^W\/".+"$/);
		expect(await res.text()).toBe('console.log(1);');
	});

	it('változatlan fájlra 304-et ad törzs nélkül', async () => {
		await writeComponent('console.log(1);', new Date('2026-09-10T10:00:00Z'));
		const first = await callGet('demo-plugin', 'Dashboard');

		const res = await callGet('demo-plugin', 'Dashboard', first.headers.get('etag')!);

		expect(res.status).toBe(304);
		expect(await res.text()).toBe('');
	});

	it('plugin frissítés után a régi ETag-re az új bundle jön', async () => {
		await writeComponent('console.log(1);', new Date('2026-09-10T10:00:00Z'));
		const oldEtag = (await callGet('demo-plugin', 'Dashboard')).headers.get('etag')!;

		await writeComponent('console.log(2);', new Date('2026-09-10T11:00:00Z'));
		const res = await callGet('demo-plugin', 'Dashboard', oldEtag);

		expect(res.status).toBe(200);
		expect(res.headers.get('etag')).not.toBe(oldEtag);
		expect(await res.text()).toBe('console.log(2);');
	});

	it('nem létező komponensre 404-et ad', async () => {
		await expect(callGet('demo-plugin', 'Missing')).rejects.toMatchObject({ status: 404 });
	});

	it('érvénytelen komponensnévre 400-at ad', async () => {
		await expect(callGet('demo-plugin', '../secret')).rejects.toMatchObject({ status: 400 });
	});
});
