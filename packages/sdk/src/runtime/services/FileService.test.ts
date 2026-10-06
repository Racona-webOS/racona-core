// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { FileService } from './FileService.js';

const URL_OK = '/api/plugins/demo/files/upload/abc.def';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('FileService.upload', () => {
	it("rejects links that are not this plugin's upload links", async () => {
		const files = new FileService('demo');
		for (const url of ['https://evil.example/upload', '/api/plugins/other/files/upload/x', '']) {
			await expect(files.upload(url, new Blob(['x']))).rejects.toThrow('Invalid upload URL');
		}
	});

	it('sends the raw file with its encoded name', async () => {
		const fetchMock = vi.fn(async () =>
			new Response(JSON.stringify({ fileId: 'f1', originalName: 'Bér.pdf', mimeType: 'application/pdf', size: 3 }), {
				status: 200
			})
		);
		vi.stubGlobal('fetch', fetchMock);
		const file = new File(['abc'], 'Bér.pdf', { type: 'application/pdf' });
		const result = await new FileService('demo').upload(URL_OK, file);
		expect(result.fileId).toBe('f1');
		const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe(URL_OK);
		expect(init.method).toBe('POST');
		expect(init.body).toBe(file);
		expect((init.headers as Record<string, string>)['X-File-Name']).toBe(encodeURIComponent('Bér.pdf'));
	});

	it('exposes the server error code', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(JSON.stringify({ error: 'too big', code: 'FILE_TOO_LARGE' }), { status: 413 }))
		);
		await expect(new FileService('demo').upload(URL_OK, new Blob(['x']))).rejects.toMatchObject({
			message: 'too big',
			code: 'FILE_TOO_LARGE',
			status: 413
		});
	});
});
