// @vitest-environment node
/**
 * Fel- és letöltési végpontok (.kiro/specs/plugin-file-storage, 3., 5., 6. követelmény).
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

vi.mock('../repository', () => import('./memory-repository'));
const access = vi.hoisted(() => ({ value: 'ok' as string }));
vi.mock('../access', async (importOriginal) => ({
	...(await importOriginal<typeof import('../access')>()),
	checkPluginFileAccess: async () => access.value
}));

import { POST as upload } from '../../../../../routes/api/plugins/[pluginId]/files/upload/[token]/+server';
import { GET as download } from '../../../../../routes/api/plugins/[pluginId]/files/download/[token]/+server';
import { createPluginFileService } from '../service';
import { resetRows, rows } from './memory-repository';
import { PDF_MINIMAL, PNG_1X1 } from './fixtures';

const PERMS = ['file_access'];
let cwd: string;

beforeAll(() => {
	process.env.BETTER_AUTH_SECRET = 'test-secret-for-plugin-files';
});

beforeEach(async () => {
	cwd = await mkdtemp(path.join(tmpdir(), 'plugin-files-api-'));
	vi.spyOn(process, 'cwd').mockReturnValue(cwd);
	vi.spyOn(console, 'error').mockImplementation(() => {});
	resetRows();
	access.value = 'ok';
});

afterEach(async () => {
	vi.restoreAllMocks();
	await rm(cwd, { recursive: true, force: true });
});

function tokenOf(url: string): string {
	return url.split('/').pop()!;
}

async function uploadUrl(userId = 5, maxBytes?: number) {
	const files = createPluginFileService('demo', PERMS, userId)!;
	return (await files.createUploadUrl({ allowedMimeTypes: ['application/pdf'], maxBytes })).uploadUrl;
}

function callUpload(opts: {
	token: string;
	userId?: number | null;
	body?: BodyInit | null;
	headers?: Record<string, string>;
	pluginId?: string;
}) {
	const request = new Request('http://localhost/upload', {
		method: 'POST',
		body: opts.body === undefined ? PDF_MINIMAL : opts.body,
		headers: { 'x-file-name': encodeURIComponent('Szerződés.pdf'), ...opts.headers },
		// @ts-expect-error Node fetch: streamelt törzshöz kell
		duplex: 'half'
	});
	return upload({
		params: { pluginId: opts.pluginId ?? 'demo', token: opts.token },
		request,
		locals: opts.userId === null ? {} : { user: { id: String(opts.userId ?? 5) } }
	} as never) as Promise<Response>;
}

function callDownload(token: string, userId = 5, pluginId = 'demo') {
	return download({
		params: { pluginId, token },
		locals: { user: { id: String(userId) } }
	} as never) as Promise<Response>;
}

describe('POST /api/plugins/:pluginId/files/upload/:token', () => {
	it('stores the file unclaimed', async () => {
		const res = await callUpload({ token: tokenOf(await uploadUrl()) });
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toMatchObject({
			originalName: 'Szerződés.pdf',
			mimeType: 'application/pdf',
			size: PDF_MINIMAL.length
		});
		expect(rows.get(body.fileId)?.claimedAt).toBeNull();
		expect(rows.get(body.fileId)?.createdBy).toBe(5);
	});

	it('requires a signed-in user', async () => {
		const res = await callUpload({ token: tokenOf(await uploadUrl()), userId: null });
		expect(res.status).toBe(401);
	});

	it('rejects a link of another user or plugin', async () => {
		const token = tokenOf(await uploadUrl(5));
		expect((await callUpload({ token, userId: 6 })).status).toBe(403);
		expect((await callUpload({ token, pluginId: 'other' })).status).toBe(403);
		expect((await callUpload({ token: 'garbage' })).status).toBe(403);
	});

	it('rejects when the plugin has no file access', async () => {
		access.value = 'no_permission';
		expect((await callUpload({ token: tokenOf(await uploadUrl()) })).status).toBe(403);
		access.value = 'not_found';
		expect((await callUpload({ token: tokenOf(await uploadUrl()) })).status).toBe(404);
	});

	it('rejects too large files', async () => {
		const token = tokenOf(await uploadUrl(5, 16));
		const res = await callUpload({ token });
		expect(res.status).toBe(413);
		expect((await res.json()).code).toBe('FILE_TOO_LARGE');
		expect(rows.size).toBe(0);
	});

	it('rejects too large streamed bodies without a length', async () => {
		const token = tokenOf(await uploadUrl(5, 16));
		const stream = new ReadableStream<Uint8Array>({
			start(c) {
				c.enqueue(new Uint8Array(10));
				c.enqueue(new Uint8Array(10));
				c.close();
			}
		});
		const res = await callUpload({ token, body: stream });
		expect(res.status).toBe(413);
	});

	it('rejects types the link does not allow', async () => {
		const res = await callUpload({ token: tokenOf(await uploadUrl()), body: PNG_1X1 });
		expect(res.status).toBe(415);
		expect((await res.json()).code).toBe('INVALID_MIME');
	});
});

describe('GET /api/plugins/:pluginId/files/download/:token', () => {
	async function stored(disposition: 'inline' | 'attachment' = 'attachment') {
		const files = createPluginFileService('demo', PERMS, 5)!;
		const info = await files.save({ data: PDF_MINIMAL, fileName: 'Bizonyítvány.pdf' });
		const { url } = await files.createDownloadUrl(info.id, { disposition });
		return { info, token: tokenOf(url) };
	}

	it('streams the file without caching', async () => {
		const { token } = await stored('inline');
		const res = await callDownload(token);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('application/pdf');
		expect(res.headers.get('content-length')).toBe(String(PDF_MINIMAL.length));
		expect(res.headers.get('cache-control')).toBe('private, no-store');
		expect(res.headers.get('x-content-type-options')).toBe('nosniff');
		expect(res.headers.get('content-disposition')).toMatch(/^inline; .*Bizony%C3%ADtv%C3%A1ny\.pdf$/);
		expect(Buffer.from(await res.arrayBuffer())).toEqual(PDF_MINIMAL);
	});

	it('rejects another user', async () => {
		const { token } = await stored();
		expect((await callDownload(token, 6)).status).toBe(403);
	});

	it('rejects an upload token', async () => {
		expect((await callDownload(tokenOf(await uploadUrl()))).status).toBe(403);
	});

	it('returns 404 after the file was deleted', async () => {
		const { info, token } = await stored();
		await createPluginFileService('demo', PERMS, 5)!.delete(info.id);
		expect((await callDownload(token)).status).toBe(404);
	});
});
