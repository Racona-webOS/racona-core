// @vitest-environment node
/**
 * Típusfelismerés és engedélylista (.kiro/specs/plugin-file-storage, 2.3).
 */

import { describe, it, expect, afterAll } from 'vitest';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { detectFileMimeType, PLUGIN_FILE_MIME_TYPES, resolveAllowedMimeTypes } from '../mime';
import { FAKE_PDF, PDF_MINIMAL, PNG_1X1 } from './fixtures';

const dirs: string[] = [];

async function tempFile(name: string, content: Buffer): Promise<string> {
	const dir = await mkdtemp(path.join(tmpdir(), 'plugin-mime-'));
	dirs.push(dir);
	const file = path.join(dir, name);
	await writeFile(file, content);
	return file;
}

afterAll(async () => {
	await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
});

describe('resolveAllowedMimeTypes', () => {
	it('defaults to every supported type', () => {
		expect(resolveAllowedMimeTypes()).toEqual([...PLUGIN_FILE_MIME_TYPES]);
		expect(resolveAllowedMimeTypes([])).toEqual([...PLUGIN_FILE_MIME_TYPES]);
	});

	it('accepts a subset and removes duplicates', () => {
		expect(resolveAllowedMimeTypes(['application/pdf', 'application/pdf'])).toEqual([
			'application/pdf'
		]);
	});

	it('rejects unsupported types', () => {
		expect(() => resolveAllowedMimeTypes(['text/html'])).toThrow(/Unsupported MIME types/);
		expect(() => resolveAllowedMimeTypes(['image/svg+xml'])).toThrow();
	});
});

describe('detectFileMimeType', () => {
	it('detects from the content, not the name', async () => {
		expect(await detectFileMimeType(await tempFile('scan.bin', PDF_MINIMAL))).toBe('application/pdf');
		expect(await detectFileMimeType(await tempFile('photo.pdf', PNG_1X1))).toBe('image/png');
	});

	it('returns null for unrecognizable content', async () => {
		expect(await detectFileMimeType(await tempFile('evil.pdf', FAKE_PDF))).toBeNull();
	});
});
