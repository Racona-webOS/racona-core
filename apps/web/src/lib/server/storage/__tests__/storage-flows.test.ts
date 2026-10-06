// @vitest-environment node
/**
 * A core fájltárolás folyamatai valódi fájlrendszerrel (ideiglenes uploads mappa) és
 * memóriabeli platform.files táblával: saveFile, deleteFile, deleteBackground,
 * a törölt felhasználók fájljainak takarítása, valamint a /api/files útvonalak.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, access, readdir } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import sharp from 'sharp';
import type { FileSelectModel, FileInsertModel } from '@racona/database/schemas';

// ============================================================================
// Mockok
// ============================================================================

const state = vi.hoisted(() => ({
	userId: '5' as string | null,
	permissions: [] as string[],
	rows: [] as FileSelectModel[]
}));

vi.mock('$app/server', () => ({
	// A remote function maga a handler (a séma-validációt a SvelteKit végzi); a `__`
	// jelölés kell, mert a SvelteKit a .remote.ts exportjait teszt alatt is ellenőrzi
	command: (_schema: unknown, fn: (...args: unknown[]) => unknown) =>
		Object.assign((...args: unknown[]) => fn(...args), { __: { type: 'command' } }),
	getRequestEvent: () => ({ locals: { user: state.userId ? { id: state.userId } : undefined } })
}));

vi.mock('$lib/auth/index', () => ({
	auth: {
		api: {
			getSession: async () => (state.userId ? { user: { id: state.userId } } : null)
		}
	}
}));

vi.mock('$lib/server/database/repositories', () => ({
	permissionRepository: {
		findPermissionsForUser: async () => state.permissions
	}
}));

vi.mock('$lib/server/storage/file-repository', async () => {
	const { mapToStoredFile, toUrlPath } = await import('../stored-file');
	let nextId = 1;
	const repo = {
		async create(data: FileInsertModel) {
			const row = {
				id: nextId++,
				thumbnailPath: null,
				userId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				...data
			} as FileSelectModel;
			state.rows.push(row);
			return mapToStoredFile(row);
		},
		async findByPublicId(publicId: string) {
			const row = state.rows.find((r) => r.publicId === publicId);
			return row ? mapToStoredFile(row) : undefined;
		},
		async findRawByPublicId(publicId: string) {
			return state.rows.find((r) => r.publicId === publicId);
		},
		async findRawByPath(storagePath: string) {
			const p = toUrlPath(storagePath);
			return state.rows.find(
				(r) =>
					toUrlPath(r.storagePath) === p || (r.thumbnailPath && toUrlPath(r.thumbnailPath) === p)
			);
		},
		async findOrphanedUserFiles(limit: number) {
			return state.rows.filter((r) => r.scope === 'user' && r.userId === null).slice(0, limit);
		},
		async delete(publicId: string) {
			const before = state.rows.length;
			state.rows = state.rows.filter((r) => r.publicId !== publicId);
			return state.rows.length < before;
		}
	};
	return { fileRepository: repo, FileRepository: class {} };
});

import { saveFile } from '$lib/storage/save-file.remote';
import { deleteFile } from '$lib/storage/delete-file.remote';
import { deleteBackground } from '$lib/storage/delete-background.remote';
import { getFileMetadata } from '$lib/storage/get-file-metadata.remote';
import { cleanupOrphanedUserFiles } from '../file-service';
import { SHARED_FILES_PERMISSION } from '../policy';
import { GET as serveFile } from '../../../../routes/api/files/[...path]/+server';
import { GET as listFilesRoute } from '../../../../routes/api/files/list/+server';
import type { SaveFileInput, SaveFileResult } from '$lib/storage/types';

type Handler<I, O> = (input: I) => Promise<O>;
const save = saveFile as unknown as Handler<SaveFileInput, SaveFileResult>;
const remove = deleteFile as unknown as Handler<{ fileId: string }, { success: boolean; error?: string }>;
const removeBackground = deleteBackground as unknown as Handler<
	{ filename: string },
	{ success: boolean; error?: string }
>;
const metadata = getFileMetadata as unknown as Handler<
	{ fileId: string },
	{ success: boolean; error?: string }
>;

// ============================================================================
// Segédek
// ============================================================================

let root: string;
const uploads = () => path.join(root, 'uploads');

async function exists(relative: string): Promise<boolean> {
	try {
		await access(path.join(uploads(), relative));
		return true;
	} catch {
		return false;
	}
}

async function png(width = 400, height = 300): Promise<Buffer> {
	return sharp({ create: { width, height, channels: 3, background: '#3366cc' } })
		.png()
		.toBuffer();
}

function input(
	buffer: Buffer,
	overrides: Partial<SaveFileInput> & { options?: Partial<SaveFileInput['options']> } = {}
): SaveFileInput {
	return {
		fileData: `data:image/png;base64,${buffer.toString('base64')}`,
		fileName: 'pic.png',
		mimeType: 'image/png',
		category: 'backgrounds',
		scope: 'user',
		...overrides,
		options: { generateThumbnail: false, ...overrides.options }
	};
}

function serve(p: string) {
	return serveFile({
		params: { path: p },
		request: new Request(`http://localhost/api/files/${p}`)
	} as never) as Promise<Response>;
}

function addRow(data: Partial<FileSelectModel> & Pick<FileSelectModel, 'storagePath'>) {
	const row: FileSelectModel = {
		id: 1000 + state.rows.length,
		publicId: crypto.randomUUID(),
		filename: path.posix.basename(data.storagePath),
		originalName: path.posix.basename(data.storagePath),
		category: data.storagePath.split('/')[0],
		scope: 'user',
		userId: 5,
		mimeType: 'application/octet-stream',
		size: 1,
		thumbnailPath: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...data
	};
	state.rows.push(row);
	return row;
}

async function putFile(relative: string, content: string | Buffer = 'x') {
	const full = path.join(uploads(), relative);
	await mkdir(path.dirname(full), { recursive: true });
	await writeFile(full, content);
}

beforeAll(async () => {
	root = await mkdtemp(path.join(tmpdir(), 'racona-storage-'));
});

afterAll(async () => {
	await rm(root, { recursive: true, force: true });
});

const originalBodyLimit = process.env.BODY_SIZE_LIMIT;

beforeEach(async () => {
	vi.spyOn(process, 'cwd').mockReturnValue(root);
	vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	await rm(uploads(), { recursive: true, force: true });
	state.userId = '5';
	state.permissions = [];
	state.rows = [];
	delete process.env.BODY_SIZE_LIMIT;
});

afterEach(() => {
	vi.restoreAllMocks();
	if (originalBodyLimit === undefined) delete process.env.BODY_SIZE_LIMIT;
	else process.env.BODY_SIZE_LIMIT = originalBodyLimit;
});

// ============================================================================
// saveFile
// ============================================================================

describe('saveFile', () => {
	it('rejects shared uploads without the permission', async () => {
		const result = await save(input(await png(), { scope: 'shared' }));
		expect(result.success).toBe(false);
		expect(result.error).toContain(SHARED_FILES_PERMISSION);
		expect(state.rows).toHaveLength(0);
		expect(await exists('backgrounds/shared')).toBe(false);
	});

	it('accepts shared uploads with the permission', async () => {
		state.permissions = [SHARED_FILES_PERMISSION];
		const result = await save(input(await png(), { scope: 'shared' }));
		expect(result.success).toBe(true);
		expect(result.file?.url).toBe('/api/files/backgrounds/shared/pic.png');
		expect(state.rows[0].userId).toBeNull();
	});

	it('rejects files above the size derived from BODY_SIZE_LIMIT, with the limit in the message', async () => {
		// 200 KiB kérés → kb. 100 KiB fájl fér bele
		process.env.BODY_SIZE_LIMIT = String(200 * 1024);
		const result = await save(input(Buffer.alloc(150 * 1024, 1)));
		expect(result.success).toBe(false);
		expect(result.error).toMatch(/too large \(max 102 KB\)/);
		expect(state.rows).toHaveLength(0);
	});

	it('names the thumbnail after the stored (unique) filename, with forward slashes', async () => {
		const opts = { options: { generateThumbnail: true } };
		const first = await save(input(await png(), opts));
		const second = await save(input(await png(), opts));

		expect(first.success && second.success).toBe(true);
		const a = state.rows[0];
		const b = state.rows[1];
		expect(a.filename).toBe('pic.png');
		expect(b.filename).not.toBe('pic.png');
		expect(a.thumbnailPath).toBe('backgrounds/user-5/thumb-pic.png');
		expect(b.thumbnailPath).toBe(`backgrounds/user-5/thumb-${b.filename}`);
		expect(b.storagePath).toBe(`backgrounds/user-5/${b.filename}`);
		expect(second.file?.thumbnailUrl).toBe(`/api/files/backgrounds/user-5/thumb-${b.filename}`);
		expect(await exists(b.thumbnailPath!)).toBe(true);
	});

	it('does not let an upload pose as a thumbnail', async () => {
		const result = await save(input(await png(), { fileName: 'thumb-pic.png' }));
		expect(result.file?.filename).toBe('pic.png');
		expect(result.file?.originalName).toBe('thumb-pic.png');
	});

	it('rejects SVG and BMP', async () => {
		const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
		const svgResult = await save(
			input(svg, { fileName: 'x.svg', mimeType: 'image/svg+xml', fileData: svg.toString('base64') })
		);
		expect(svgResult.success).toBe(false);

		const bmp = Buffer.alloc(70);
		bmp.write('BM');
		bmp.writeUInt32LE(70, 2);
		bmp.writeUInt32LE(54, 10);
		bmp.writeUInt32LE(40, 14);
		bmp.writeInt32LE(2, 18);
		bmp.writeInt32LE(2, 22);
		bmp.writeUInt16LE(1, 26);
		bmp.writeUInt16LE(24, 28);
		const bmpResult = await save(
			input(bmp, { fileName: 'x.bmp', mimeType: 'image/bmp', fileData: bmp.toString('base64') })
		);
		expect(bmpResult.success).toBe(false);
		expect(bmpResult.error).toContain('image/bmp');
		expect(state.rows).toHaveLength(0);
	});
});

// ============================================================================
// deleteFile, getFileMetadata
// ============================================================================

describe('deleteFile', () => {
	it('lets users with the permission delete shared files (disk, thumbnail and row)', async () => {
		state.permissions = [SHARED_FILES_PERMISSION];
		const saved = await save(input(await png(), { scope: 'shared', options: { generateThumbnail: true } }));
		const row = state.rows[0];

		state.userId = '9';
		const result = await remove({ fileId: saved.file!.id });

		expect(result).toEqual({ success: true });
		expect(state.rows).toHaveLength(0);
		expect(await exists(row.storagePath)).toBe(false);
		expect(await exists(row.thumbnailPath!)).toBe(false);
	});

	it('denies deleting shared files without the permission', async () => {
		state.permissions = [SHARED_FILES_PERMISSION];
		const saved = await save(input(await png(), { scope: 'shared' }));

		state.permissions = [];
		const result = await remove({ fileId: saved.file!.id });

		expect(result.success).toBe(false);
		expect(result.error).toContain('Permission denied');
		expect(state.rows).toHaveLength(1);
		expect(await exists(state.rows[0].storagePath)).toBe(true);
	});

	it("denies deleting other users' and deleted users' files", async () => {
		const own = await save(input(await png()));
		const orphan = addRow({ storagePath: 'backgrounds/user-7/x.png', userId: null });

		state.userId = '6';
		expect((await remove({ fileId: own.file!.id })).success).toBe(false);
		expect((await remove({ fileId: orphan.publicId })).success).toBe(false);
		expect((await metadata({ fileId: orphan.publicId })).success).toBe(false);
		expect(state.rows).toHaveLength(2);
	});
});

// ============================================================================
// deleteBackground
// ============================================================================

describe('deleteBackground', () => {
	it('removes the image, its thumbnail and the platform.files row', async () => {
		const saved = await save(input(await png(), { options: { generateThumbnail: true } }));
		const row = state.rows[0];

		const result = await removeBackground({ filename: saved.file!.filename });

		expect(result).toEqual({ success: true });
		expect(state.rows).toHaveLength(0);
		expect(await exists(row.storagePath)).toBe(false);
		expect(await exists(row.thumbnailPath!)).toBe(false);
	});

	it('still deletes backgrounds that have no row', async () => {
		await putFile('backgrounds/user-5/old.png');
		await putFile('backgrounds/user-5/thumb-old.png');

		expect((await removeBackground({ filename: 'old.png' })).success).toBe(true);
		expect(await exists('backgrounds/user-5/old.png')).toBe(false);
		expect(await exists('backgrounds/user-5/thumb-old.png')).toBe(false);
	});

	it("does not touch another user's row", async () => {
		await putFile('backgrounds/user-5/a.png');
		const foreign = addRow({ storagePath: 'backgrounds/user-6/a.png', userId: 6 });

		await removeBackground({ filename: 'a.png' });
		expect(state.rows).toContain(foreign);
	});
});

// ============================================================================
// Törölt felhasználók fájljai
// ============================================================================

describe('cleanupOrphanedUserFiles', () => {
	it('deletes user-scope files whose owner was deleted, and nothing else', async () => {
		await putFile('backgrounds/user-7/a.png');
		await putFile('backgrounds/user-7/thumb-a.png');
		await putFile('backgrounds/user-5/b.png');
		await putFile('backgrounds/shared/c.png');
		addRow({
			storagePath: 'backgrounds/user-7/a.png',
			thumbnailPath: 'backgrounds/user-7/thumb-a.png',
			userId: null
		});
		addRow({ storagePath: 'backgrounds/user-7/missing.png', userId: null });
		const kept = addRow({ storagePath: 'backgrounds/user-5/b.png', userId: 5 });
		const shared = addRow({ storagePath: 'backgrounds/shared/c.png', scope: 'shared', userId: null });

		const result = await cleanupOrphanedUserFiles(undefined, 1);

		expect(result).toEqual({ deleted: 2, failed: 0 });
		expect(state.rows).toEqual([kept, shared]);
		expect(await exists('backgrounds/user-7/a.png')).toBe(false);
		expect(await exists('backgrounds/user-7/thumb-a.png')).toBe(false);
		expect(await exists('backgrounds/user-5/b.png')).toBe(true);
		expect(await exists('backgrounds/shared/c.png')).toBe(true);
	});
});

// ============================================================================
// GET /api/files/... és /api/files/list
// ============================================================================

describe('GET /api/files/[...path]', () => {
	it('marks every response private', async () => {
		await putFile('backgrounds/user-5/a.png', await png(10, 10));
		await putFile('backgrounds/shared/image/b.webp', 'x');
		await putFile('avatars/user-6/c.png', await png(10, 10));

		for (const p of ['backgrounds/user-5/a.png', 'backgrounds/shared/image/b.webp', 'avatars/user-6/c.png']) {
			const response = await serve(p);
			expect(response.status).toBe(200);
			expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600');
		}
	});

	it('uses the stored MIME type instead of the extension', async () => {
		await putFile('documents/user-5/scan.jpg', 'x');
		addRow({ storagePath: 'documents/user-5/scan.jpg', mimeType: 'application/pdf' });

		const response = await serve('documents/user-5/scan.jpg');
		expect(response.headers.get('Content-Type')).toBe('application/pdf');
		expect(response.headers.get('Content-Disposition')).toMatch(/^inline;/);
	});

	it('uses the parent row for thumbnails', async () => {
		await putFile('images/user-5/thumb-a.bin', 'x');
		addRow({
			storagePath: 'images/user-5/a.bin',
			thumbnailPath: 'images/user-5/thumb-a.bin',
			mimeType: 'image/webp'
		});
		expect((await serve('images/user-5/thumb-a.bin')).headers.get('Content-Type')).toBe('image/webp');
	});

	it('never serves HTML, JS or SVG with their own type', async () => {
		await putFile('documents/user-5/page.png', '<script>alert(1)</script>');
		addRow({ storagePath: 'documents/user-5/page.png', mimeType: 'text/html' });
		await putFile('documents/shared/x.svg', '<svg/>');
		await putFile('documents/shared/x.html', '<p/>');
		await putFile('documents/shared/x.js', 'alert(1)');

		for (const p of [
			'documents/user-5/page.png',
			'documents/shared/x.svg',
			'documents/shared/x.html',
			'documents/shared/x.js'
		]) {
			const response = await serve(p);
			expect(response.headers.get('Content-Type')).toBe('application/octet-stream');
			expect(response.headers.get('Content-Disposition')).toMatch(/^attachment;/);
			expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
		}
	});
});

describe('GET /api/files/list', () => {
	it('does not list thumbnails', async () => {
		await putFile('backgrounds/user-5/a.png');
		await putFile('backgrounds/user-5/thumb-a.png');
		await putFile('backgrounds/shared/video/v.mp4');
		await putFile('backgrounds/shared/video/thumb-v.jpg');

		const list = async (query: string) => {
			const url = new URL(`http://localhost/api/files/list?${query}`);
			const response = (await listFilesRoute({ url, request: new Request(url) } as never)) as Response;
			return ((await response.json()) as { files: { filename: string }[] }).files.map((f) => f.filename);
		};

		expect(await list('category=backgrounds&scope=user')).toEqual(['a.png']);
		expect(await list('category=backgrounds&scope=shared&type=video')).toEqual(['v.mp4']);
		expect((await readdir(path.join(uploads(), 'backgrounds/user-5'))).sort()).toEqual([
			'a.png',
			'thumb-a.png'
		]);
	});
});
