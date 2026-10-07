// @vitest-environment node
/**
 * Avatar csomagok darabolt feltöltése: összefűzés, sorrend, méret, tulajdonos.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, readdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import {
	AVATAR_CHUNK_SIZE,
	AVATAR_MAX_PACKAGE_SIZE,
	AvatarUploadError,
	appendChunk,
	beginUpload,
	finishUpload,
	setUploadsRootForTests
} from '../uploadSessions';

let root: string;

beforeAll(async () => {
	root = await mkdtemp(path.join(tmpdir(), 'avatar-upload-'));
	setUploadsRootForTests(root);
});

afterAll(async () => {
	await rm(root, { recursive: true, force: true });
});

function bytes(length: number, seed: number): Buffer {
	return Buffer.from(Array.from({ length }, (_, i) => (i * 31 + seed) % 256));
}

async function expectCode(promise: Promise<unknown>, code: string) {
	await expect(promise).rejects.toSatisfy(
		(err) => err instanceof AvatarUploadError && err.code === code
	);
}

describe('darabolt avatar feltöltés', () => {
	it('a darabokat sorrendben összefűzi, a végén törli az ideiglenes fájlt', async () => {
		const file = Buffer.concat([bytes(AVATAR_CHUNK_SIZE, 1), bytes(1000, 2)]);
		const { uploadId, chunkSize } = await beginUpload(1, file.length);
		expect(chunkSize).toBe(AVATAR_CHUNK_SIZE);

		await appendChunk(1, uploadId, 0, file.subarray(0, chunkSize));
		const received = await appendChunk(1, uploadId, 1, file.subarray(chunkSize));
		expect(received).toBe(file.length);

		const result = await finishUpload(1, uploadId);
		expect(result.equals(file)).toBe(true);
		expect(await readdir(root)).toHaveLength(0);
	});

	it('elutasítja a túl nagy csomagot', async () => {
		await expectCode(beginUpload(1, AVATAR_MAX_PACKAGE_SIZE + 1), 'TOO_LARGE');
	});

	it('elutasítja a sorrenden kívüli darabot', async () => {
		const { uploadId } = await beginUpload(1, 10);
		await expectCode(appendChunk(1, uploadId, 1, bytes(5, 1)), 'OUT_OF_ORDER');
	});

	it('elutasítja a bejelentett méretnél több adatot', async () => {
		const { uploadId } = await beginUpload(1, 10);
		await expectCode(appendChunk(1, uploadId, 0, bytes(11, 1)), 'OVERFLOW');
	});

	it('hiányos feltöltést nem telepít', async () => {
		const { uploadId } = await beginUpload(1, 10);
		await appendChunk(1, uploadId, 0, bytes(5, 1));
		await expectCode(finishUpload(1, uploadId), 'INCOMPLETE');
	});

	it('más felhasználó feltöltéséhez nem fér hozzá', async () => {
		const { uploadId } = await beginUpload(1, 10);
		await expectCode(appendChunk(2, uploadId, 0, bytes(5, 1)), 'NOT_FOUND');
		await expectCode(finishUpload(2, uploadId), 'NOT_FOUND');
	});
});
