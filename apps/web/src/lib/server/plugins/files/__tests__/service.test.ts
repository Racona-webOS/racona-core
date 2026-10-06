// @vitest-environment node
/**
 * `context.files` szolgáltatás (.kiro/specs/plugin-file-storage, 1–6. követelmény).
 * Az adatbázis réteg memóriabeli, a lemezműveletek valódiak (ideiglenes mappában).
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

vi.mock('../repository', () => import('./memory-repository'));

import { createPluginFileService, sanitizeOriginalName, storePluginFile } from '../service';
import { verifyToken } from '../tokens';
import { resolveStoragePath } from '../storage';
import { cleanupPluginFiles } from '../cleanup';
import { resetRows, rows } from './memory-repository';
import { FAKE_PDF, PDF_MINIMAL, PNG_1X1 } from './fixtures';

const PERMS = ['remote_functions', 'file_access'];
let cwd: string;

beforeAll(() => {
	process.env.BETTER_AUTH_SECRET = 'test-secret-for-plugin-files';
});

beforeEach(async () => {
	cwd = await mkdtemp(path.join(tmpdir(), 'plugin-files-svc-'));
	vi.spyOn(process, 'cwd').mockReturnValue(cwd);
	resetRows();
});

afterEach(async () => {
	vi.restoreAllMocks();
	await rm(cwd, { recursive: true, force: true });
});

describe('createPluginFileService', () => {
	it('is only available with the file_access permission', () => {
		expect(createPluginFileService('demo', ['remote_functions'], 1)).toBeUndefined();
		expect(createPluginFileService('demo', PERMS, 1)).toBeDefined();
	});

	it('saves, reads and deletes a file', async () => {
		const files = createPluginFileService('demo', PERMS, 5)!;
		const info = await files.save({ data: PDF_MINIMAL, fileName: 'Munkaszerződés.pdf', ref: 'doc:1' });
		expect(info).toMatchObject({
			originalName: 'Munkaszerződés.pdf',
			mimeType: 'application/pdf',
			size: PDF_MINIMAL.length,
			ref: 'doc:1',
			createdBy: 5
		});
		expect(info.claimedAt).not.toBeNull();
		expect(await files.read(info.id)).toEqual(PDF_MINIMAL);

		const storagePath = rows.get(info.id)!.storagePath;
		expect(storagePath.startsWith('demo/')).toBe(true);
		await files.delete(info.id);
		expect(await files.get(info.id)).toBeNull();
		expect(existsSync(resolveStoragePath(storagePath))).toBe(false);
		await expect(files.delete(info.id)).resolves.toBeUndefined();
	});

	it('rejects content that does not match the allowed types', async () => {
		const files = createPluginFileService('demo', PERMS, 5)!;
		await expect(
			files.save({ data: PNG_1X1, fileName: 'x.pdf', allowedMimeTypes: ['application/pdf'] })
		).rejects.toMatchObject({ code: 'INVALID_MIME' });
		await expect(files.save({ data: FAKE_PDF, fileName: 'x.pdf' })).rejects.toMatchObject({
			code: 'INVALID_MIME'
		});
		expect(rows.size).toBe(0);
	});

	it('enforces maxBytes', async () => {
		const files = createPluginFileService('demo', PERMS, 5)!;
		await expect(
			files.save({ data: PDF_MINIMAL, fileName: 'x.pdf', maxBytes: 10 })
		).rejects.toMatchObject({ code: 'FILE_TOO_LARGE' });
	});

	it('does not see files of another plugin', async () => {
		const mine = createPluginFileService('demo', PERMS, 5)!;
		const other = createPluginFileService('other', PERMS, 5)!;
		const info = await mine.save({ data: PDF_MINIMAL, fileName: 'a.pdf' });
		expect(await other.get(info.id)).toBeNull();
		await expect(other.read(info.id)).rejects.toMatchObject({ code: 'FILE_NOT_FOUND' });
		await expect(other.claim(info.id)).rejects.toMatchObject({ code: 'FILE_NOT_FOUND' });
		await other.delete(info.id);
		expect(await mine.get(info.id)).not.toBeNull();
	});

	it('treats invalid IDs as missing files', async () => {
		const files = createPluginFileService('demo', PERMS, 5)!;
		expect(await files.get('../../etc/passwd')).toBeNull();
	});
});

describe('claim', () => {
	async function upload(createdBy: number) {
		return storePluginFile({
			pluginId: 'demo',
			source: PDF_MINIMAL,
			fileName: 'a.pdf',
			allowedMimeTypes: ['application/pdf'],
			maxBytes: 1024,
			createdBy,
			claimed: false
		});
	}

	it('lets the uploader claim, idempotently', async () => {
		const row = await upload(5);
		const files = createPluginFileService('demo', PERMS, 5)!;
		const first = await files.claim(row.id, { ref: 'doc:9' });
		expect(first.claimedAt).not.toBeNull();
		expect(first.ref).toBe('doc:9');
		const again = await files.claim(row.id);
		expect(again.claimedAt).toEqual(first.claimedAt);
	});

	it('rejects another user, but allows a scheduled job', async () => {
		const row = await upload(5);
		await expect(createPluginFileService('demo', PERMS, 6)!.claim(row.id)).rejects.toMatchObject({
			code: 'PERMISSION_DENIED'
		});
		await expect(createPluginFileService('demo', PERMS, null)!.claim(row.id)).resolves.toBeDefined();
	});
});

describe('links', () => {
	it('creates an upload link bound to the user', async () => {
		const files = createPluginFileService('demo', PERMS, 5)!;
		const { uploadUrl, expiresAt } = await files.createUploadUrl({
			allowedMimeTypes: ['application/pdf'],
			maxBytes: 999_999_999,
			ref: 'doc:1'
		});
		expect(uploadUrl.startsWith('/api/plugins/demo/files/upload/')).toBe(true);
		const payload = verifyToken(uploadUrl.split('/').pop()!, 'u')!;
		expect(payload).toMatchObject({ p: 'demo', u: 5, m: ['application/pdf'], r: 'doc:1' });
		expect(payload.s).toBe(10 * 1024 * 1024);
		expect(expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(300_000);
	});

	it('caps the link lifetime', async () => {
		const files = createPluginFileService('demo', PERMS, 5)!;
		const { expiresAt } = await files.createUploadUrl({
			allowedMimeTypes: ['application/pdf'],
			ttlSeconds: 86_400
		});
		expect(expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(900_000);
	});

	it('creates a download link only for existing files', async () => {
		const files = createPluginFileService('demo', PERMS, 5)!;
		const info = await files.save({ data: PNG_1X1, fileName: 'a.png' });
		const { url } = await files.createDownloadUrl(info.id, { disposition: 'inline' });
		expect(verifyToken(url.split('/').pop()!, 'd')).toMatchObject({
			p: 'demo',
			u: 5,
			f: info.id,
			d: 'inline'
		});
		await expect(
			files.createDownloadUrl('0b9f6f1e-3c1a-4f53-9d0e-5a2b7c8d9e10')
		).rejects.toMatchObject({ code: 'FILE_NOT_FOUND' });
	});

	it('is not available in scheduled jobs', async () => {
		const files = createPluginFileService('demo', PERMS, null)!;
		await expect(files.createUploadUrl({ allowedMimeTypes: [] })).rejects.toMatchObject({
			code: 'PERMISSION_DENIED'
		});
	});

	it('rejects unsupported types in the link', async () => {
		const files = createPluginFileService('demo', PERMS, 5)!;
		await expect(files.createUploadUrl({ allowedMimeTypes: ['text/html'] })).rejects.toMatchObject({
			code: 'INVALID_INPUT'
		});
	});
});

describe('cleanupPluginFiles', () => {
	it('removes old unclaimed uploads only', async () => {
		const old = await storePluginFile({
			pluginId: 'demo',
			source: PDF_MINIMAL,
			fileName: 'old.pdf',
			allowedMimeTypes: ['application/pdf'],
			maxBytes: 1024,
			createdBy: 1,
			claimed: false
		});
		old.createdAt = new Date(Date.now() - 25 * 3600 * 1000);
		const files = createPluginFileService('demo', PERMS, 1)!;
		const kept = await files.save({ data: PDF_MINIMAL, fileName: 'kept.pdf' });
		const fresh = await storePluginFile({
			pluginId: 'demo',
			source: PDF_MINIMAL,
			fileName: 'fresh.pdf',
			allowedMimeTypes: ['application/pdf'],
			maxBytes: 1024,
			createdBy: 1,
			claimed: false
		});

		const result = await cleanupPluginFiles();
		expect(result.unclaimed).toBe(1);
		expect(rows.has(old.id)).toBe(false);
		expect(existsSync(resolveStoragePath(old.storagePath))).toBe(false);
		expect(rows.has(kept.id)).toBe(true);
		expect(rows.has(fresh.id)).toBe(true);
	});
});

describe('sanitizeOriginalName', () => {
	it('keeps accents and strips paths and control characters', () => {
		expect(sanitizeOriginalName('C:\\docs\\Erkölcsi bizonyítvány.pdf')).toBe(
			'Erkölcsi bizonyítvány.pdf'
		);
		expect(sanitizeOriginalName('../../a"b\n.pdf')).toBe('ab.pdf');
		expect(sanitizeOriginalName('')).toBe('file');
		expect(sanitizeOriginalName('..')).toBe('file');
	});

	it('shortens long names but keeps the extension', () => {
		const name = sanitizeOriginalName(`${'a'.repeat(300)}.pdf`);
		expect(name.length).toBe(255);
		expect(name.endsWith('.pdf')).toBe(true);
	});
});
