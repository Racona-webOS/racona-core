// @vitest-environment node
/**
 * Rekord → StoredFile leképezés, URL-ek és bélyegkép-előtag (stored-file.ts).
 */

import { describe, it, expect } from 'vitest';
import type { FileSelectModel } from '@racona/database/schemas';
import { mapToStoredFile, toUrlPath, stripThumbnailPrefix, THUMBNAIL_PREFIX } from '../stored-file';
import { generateStoragePath } from '../filesystem';

function record(overrides: Partial<FileSelectModel> = {}): FileSelectModel {
	return {
		id: 1,
		publicId: '0b9f6f1e-3c1a-4f53-9d0e-5a2b7c8d9e10',
		filename: 'photo.png',
		originalName: 'Photo.png',
		category: 'backgrounds',
		scope: 'user',
		userId: 5,
		mimeType: 'image/png',
		size: 10,
		storagePath: 'backgrounds/user-5/photo.png',
		thumbnailPath: 'backgrounds/user-5/thumb-photo.png',
		createdAt: new Date(0),
		updatedAt: new Date(0),
		...overrides
	};
}

describe('mapToStoredFile', () => {
	it('builds URLs with forward slashes', () => {
		const file = mapToStoredFile(record());
		expect(file.url).toBe('/api/files/backgrounds/user-5/photo.png');
		expect(file.thumbnailUrl).toBe('/api/files/backgrounds/user-5/thumb-photo.png');
	});

	it('normalizes paths saved on Windows', () => {
		const file = mapToStoredFile(
			record({
				storagePath: 'backgrounds\\user-5\\photo.png',
				thumbnailPath: 'backgrounds\\user-5\\thumb-photo.png'
			})
		);
		expect(file.thumbnailUrl).toBe('/api/files/backgrounds/user-5/thumb-photo.png');
		expect(file.storagePath).toBe('backgrounds/user-5/photo.png');
	});

	it('uses the shared folder for shared files', () => {
		const file = mapToStoredFile(
			record({ scope: 'shared', userId: null, storagePath: 'docs/shared/photo.png' })
		);
		expect(file.url).toBe('/api/files/backgrounds/shared/photo.png');
	});

	it('has no thumbnailUrl without a thumbnail', () => {
		expect(mapToStoredFile(record({ thumbnailPath: null })).thumbnailUrl).toBeUndefined();
	});
});

describe('toUrlPath', () => {
	it('converts separators and drops leading slashes', () => {
		expect(toUrlPath('a\\b\\c.png')).toBe('a/b/c.png');
		expect(toUrlPath('/a/b')).toBe('a/b');
	});
});

describe('generateStoragePath', () => {
	it('always uses forward slashes', () => {
		expect(generateStoragePath('backgrounds', 'user', 5)).toBe('backgrounds/user-5');
		expect(generateStoragePath('backgrounds', 'shared')).toBe('backgrounds/shared');
	});
});

describe('stripThumbnailPrefix', () => {
	it('removes the reserved prefix (repeatedly, case-insensitively)', () => {
		expect(stripThumbnailPrefix('thumb-a.png')).toBe('a.png');
		expect(stripThumbnailPrefix('thumb-thumb-a.png')).toBe('a.png');
		expect(stripThumbnailPrefix('THUMB-a.png')).toBe('a.png');
		expect(stripThumbnailPrefix('a-thumb-.png')).toBe('a-thumb-.png');
		expect(stripThumbnailPrefix(THUMBNAIL_PREFIX)).toBe('');
	});
});
