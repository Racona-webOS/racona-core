// @vitest-environment node
/**
 * A core fájlkezelése nem éri el a plugin fájlokat
 * (.kiro/specs/plugin-file-storage, 3. követelmény).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as v from 'valibot';

vi.mock('$lib/auth/index', () => ({
	auth: { api: { getSession: vi.fn(async () => ({ user: { id: '5' } })) } }
}));

import { GET as serveFile } from '../../../../../routes/api/files/[...path]/+server';
import { GET as listFiles } from '../../../../../routes/api/files/list/+server';
import { categorySchema } from '../../../../storage/schemas';
// A szerver oldali storage modul ugyanazt a sémát exportálja (nincs külön másolat)
import { categorySchema as serverCategorySchema } from '../../../storage/index';

beforeEach(() => {
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

function serve(p: string) {
	return serveFile({
		params: { path: p },
		request: new Request(`http://localhost/api/files/${p}`)
	} as never) as Promise<Response>;
}

function list(query: string) {
	const url = new URL(`http://localhost/api/files/list?${query}`);
	return listFiles({ url, request: new Request(url) } as never) as Promise<Response>;
}

describe('/api/files/[...path]', () => {
	it('never serves plugin files', async () => {
		for (const p of [
			'plugin-files/shared/x',
			'plugin-files/user-5/x',
			'plugin-files/demo/2026/10/0b9f6f1e-3c1a-4f53-9d0e-5a2b7c8d9e10'
		]) {
			expect((await serve(p)).status).toBe(404);
		}
	});
});

describe('/api/files/list', () => {
	it('only lists core categories', async () => {
		expect((await list('category=plugin-files&scope=shared')).status).toBe(400);
		expect((await list('category=plugins&scope=shared')).status).toBe(400);
		expect((await list('category=../plugin-files&scope=shared')).status).toBe(400);
	});

	it('rejects path characters in type', async () => {
		expect((await list('category=backgrounds&scope=shared&type=../../plugin-files')).status).toBe(400);
	});

	it('still lists backgrounds', async () => {
		expect((await list('category=backgrounds&scope=shared&type=image')).status).toBe(200);
	});
});

describe('core saveFile category', () => {
	it('rejects the reserved folders', () => {
		expect(v.safeParse(categorySchema, 'plugin-files').success).toBe(false);
		expect(v.safeParse(categorySchema, 'plugins').success).toBe(false);
		expect(v.safeParse(categorySchema, 'backgrounds').success).toBe(true);
		expect(v.safeParse(categorySchema, 'gallery').success).toBe(true);
		expect(v.safeParse(serverCategorySchema, 'plugin-files').success).toBe(false);
	});
});
