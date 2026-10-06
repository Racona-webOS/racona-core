// @vitest-environment node
/**
 * Lemezműveletek (.kiro/specs/plugin-file-storage, 2.1, 2.2, 5.4, 5.6).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, readFile, readdir, rm, stat, utimes, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import {
	buildStoragePath,
	commitTemp,
	deleteStoredFile,
	openStoredFile,
	removeStalePartFiles,
	resolveStoragePath,
	writeToTemp
} from '../storage';
import { getPluginFilesRoot } from '../config';
import { PluginFileError } from '../errors';

const FILE_ID = '0b9f6f1e-3c1a-4f53-9d0e-5a2b7c8d9e10';
let cwd: string;

beforeEach(async () => {
	cwd = await mkdtemp(path.join(tmpdir(), 'plugin-files-'));
	vi.spyOn(process, 'cwd').mockReturnValue(cwd);
});

afterEach(async () => {
	vi.restoreAllMocks();
	await rm(cwd, { recursive: true, force: true });
});

describe('buildStoragePath', () => {
	it('builds {pluginId}/{year}/{month}/{fileId}', () => {
		expect(buildStoragePath('racona-work', FILE_ID, new Date(Date.UTC(2026, 9, 6)))).toBe(
			`racona-work/2026/10/${FILE_ID}`
		);
	});

	it('rejects invalid plugin and file IDs', () => {
		expect(() => buildStoragePath('../x', FILE_ID)).toThrow(PluginFileError);
		expect(() => buildStoragePath('Demo', FILE_ID)).toThrow(PluginFileError);
		expect(() => buildStoragePath('demo', 'not-a-uuid')).toThrow(PluginFileError);
	});
});

describe('resolveStoragePath', () => {
	it('stays under the plugin files root', () => {
		expect(resolveStoragePath(`demo/2026/10/${FILE_ID}`)).toBe(
			path.join(cwd, 'uploads', 'plugin-files', 'demo', '2026', '10', FILE_ID)
		);
	});

	it('rejects traversal and absolute paths', () => {
		for (const p of ['../secret', 'demo/../../x', '/etc/passwd', '', 'a\0b']) {
			expect(() => resolveStoragePath(p)).toThrow(PluginFileError);
		}
	});
});

describe('writeToTemp / commitTemp', () => {
	it('writes, hashes and commits the content', async () => {
		const rel = `demo/2026/10/${FILE_ID}`;
		const result = await writeToTemp(rel, Buffer.from('hello world'), 100);
		expect(result.size).toBe(11);
		expect(result.sha256).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
		expect(result.tempPath.endsWith('.part')).toBe(true);
		await commitTemp(result);
		expect(await readFile(resolveStoragePath(rel), 'utf8')).toBe('hello world');
		expect((await stat(resolveStoragePath(rel))).mode & 0o777).toBe(0o600);
	});

	it('reads a web ReadableStream source', async () => {
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new TextEncoder().encode('ab'));
				controller.enqueue(new TextEncoder().encode('cd'));
				controller.close();
			}
		});
		const result = await writeToTemp(`demo/2026/10/${FILE_ID}`, stream, 10);
		expect(result.size).toBe(4);
		expect(await readFile(result.tempPath, 'utf8')).toBe('abcd');
	});

	it('aborts above the limit and leaves nothing on disk', async () => {
		const rel = `demo/2026/10/${FILE_ID}`;
		const chunks = (async function* () {
			yield Buffer.alloc(6);
			yield Buffer.alloc(6);
		})();
		await expect(writeToTemp(rel, chunks, 10)).rejects.toMatchObject({ code: 'FILE_TOO_LARGE' });
		expect(await readdir(path.dirname(resolveStoragePath(rel)))).toEqual([]);
	});
});

describe('deleteStoredFile / openStoredFile', () => {
	it('deletes idempotently and reports missing files', async () => {
		const rel = `demo/2026/10/${FILE_ID}`;
		await commitTemp(await writeToTemp(rel, Buffer.from('x'), 10));
		const opened = await openStoredFile(rel);
		expect(opened?.size).toBe(1);
		opened?.stream.destroy();
		await deleteStoredFile(rel);
		await deleteStoredFile(rel);
		expect(await openStoredFile(rel)).toBeNull();
	});
});

describe('removeStalePartFiles', () => {
	it('removes only old .part files', async () => {
		const dir = path.join(getPluginFilesRoot(), 'demo', '2026', '10');
		await mkdir(dir, { recursive: true });
		const oldPart = path.join(dir, 'a.part');
		const newPart = path.join(dir, 'b.part');
		const oldFile = path.join(dir, FILE_ID);
		for (const f of [oldPart, newPart, oldFile]) await writeFile(f, 'x');
		const old = new Date(Date.now() - 2 * 24 * 3600 * 1000);
		await utimes(oldPart, old, old);
		await utimes(oldFile, old, old);

		expect(await removeStalePartFiles(24 * 3600 * 1000)).toBe(1);
		expect((await readdir(dir)).sort()).toEqual([FILE_ID, 'b.part'].sort());
	});

	it('works when the root does not exist yet', async () => {
		expect(await removeStalePartFiles(1000)).toBe(0);
	});
});
