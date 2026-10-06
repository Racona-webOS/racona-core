/**
 * Lemezműveletek a plugin fájlokhoz. Az útvonalak a plugin fájlok gyökeréhez
 * (`uploads/plugin-files`) relatívak, `/` elválasztóval:
 * `{pluginId}/{ÉÉÉÉ}/{HH}/{uuid}`. A lemezen lévő név nem tartalmaz
 * felhasználói adatot.
 */

import { createHash } from 'crypto';
import type { ReadStream } from 'fs';
import { mkdir, open, readdir, readFile, rename, stat, unlink } from 'fs/promises';
import path from 'path';
import { getPluginFilesRoot } from './config';
import { PluginFileError } from './errors';

const PLUGIN_ID_PATTERN = /^[a-z0-9-]{1,255}$/;
const FILE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PART_SUFFIX = '.part';

export function isValidFileId(value: unknown): value is string {
	return typeof value === 'string' && FILE_ID_PATTERN.test(value);
}

/** A fájl relatív útvonala: `{pluginId}/{ÉÉÉÉ}/{HH}/{fileId}`. */
export function buildStoragePath(pluginId: string, fileId: string, date = new Date()): string {
	if (!PLUGIN_ID_PATTERN.test(pluginId)) {
		throw new PluginFileError('INVALID_INPUT', 'Invalid plugin ID');
	}
	if (!isValidFileId(fileId)) {
		throw new PluginFileError('INVALID_INPUT', 'Invalid file ID');
	}
	const year = String(date.getUTCFullYear());
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	return `${pluginId}/${year}/${month}/${fileId}`;
}

/** Abszolút útvonal; hibát dob, ha a gyökéren kívülre mutatna. */
export function resolveStoragePath(relativePath: string): string {
	const root = path.resolve(getPluginFilesRoot());
	const full = path.resolve(root, relativePath);
	if (
		relativePath.includes('\0') ||
		path.isAbsolute(relativePath) ||
		!full.startsWith(root + path.sep)
	) {
		throw new PluginFileError('INVALID_INPUT', 'Invalid storage path');
	}
	return full;
}

export interface TempWriteResult {
	tempPath: string;
	finalPath: string;
	size: number;
	sha256: string;
}

type ByteSource = Uint8Array | AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>;

async function* chunksOf(source: ByteSource): AsyncIterable<Uint8Array> {
	if (source instanceof Uint8Array) {
		yield source;
		return;
	}
	if (typeof (source as ReadableStream<Uint8Array>).getReader === 'function') {
		const reader = (source as ReadableStream<Uint8Array>).getReader();
		let finished = false;
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					finished = true;
					return;
				}
				if (value) yield value;
			}
		} finally {
			// Korai kilépésnél (pl. túl nagy fájl) a maradékot nem olvassuk tovább
			if (!finished) await reader.cancel().catch(() => {});
			reader.releaseLock();
		}
	} else {
		yield* source as AsyncIterable<Uint8Array>;
	}
}

/**
 * A tartalom írása `.part` fájlba a végleges hely mellé, bájtszámlálással és
 * sha256-tal. A `maxBytes` túllépésekor megszakít, és a részfájlt törli.
 */
export async function writeToTemp(
	relativePath: string,
	source: ByteSource,
	maxBytes: number
): Promise<TempWriteResult> {
	const finalPath = resolveStoragePath(relativePath);
	const tempPath = finalPath + PART_SUFFIX;
	await mkdir(path.dirname(finalPath), { recursive: true, mode: 0o700 });

	const hash = createHash('sha256');
	let size = 0;
	const handle = await open(tempPath, 'wx', 0o600);
	try {
		for await (const chunk of chunksOf(source)) {
			size += chunk.byteLength;
			if (size > maxBytes) {
				throw new PluginFileError('FILE_TOO_LARGE', `File is larger than ${maxBytes} bytes`);
			}
			hash.update(chunk);
			let offset = 0;
			while (offset < chunk.byteLength) {
				const { bytesWritten } = await handle.write(chunk, offset, chunk.byteLength - offset);
				offset += bytesWritten;
			}
		}
	} catch (err) {
		await handle.close().catch(() => {});
		await removeQuietly(tempPath);
		throw err;
	}
	await handle.close();

	return { tempPath, finalPath, size, sha256: hash.digest('hex') };
}

export async function commitTemp(result: TempWriteResult): Promise<void> {
	await rename(result.tempPath, result.finalPath);
}

export async function removeQuietly(fullPath: string): Promise<void> {
	try {
		await unlink(fullPath);
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
			console.error(`[PluginFiles] Failed to remove ${fullPath}:`, err);
		}
	}
}

/** Törlés a lemezről; a hiányzó fájl nem hiba. */
export async function deleteStoredFile(relativePath: string): Promise<void> {
	await removeQuietly(resolveStoragePath(relativePath));
}

export async function readStoredFile(relativePath: string): Promise<Buffer> {
	try {
		return await readFile(resolveStoragePath(relativePath));
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
			throw new PluginFileError('FILE_NOT_FOUND', 'File not found');
		}
		throw err;
	}
}

/**
 * Megnyitás streameléshez; `null`, ha a fájl nincs a lemezen. A fájlt előbb
 * megnyitjuk, így a méret és a stream ugyanarra a fájlra vonatkozik (a stream
 * akkor sem hibázik, ha közben törlik).
 */
export async function openStoredFile(
	relativePath: string
): Promise<{ stream: ReadStream; size: number } | null> {
	const fullPath = resolveStoragePath(relativePath);
	let handle;
	try {
		handle = await open(fullPath, 'r');
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw err;
	}
	try {
		const info = await handle.stat();
		if (!info.isFile()) {
			await handle.close();
			return null;
		}
		return { stream: handle.createReadStream(), size: info.size };
	} catch (err) {
		await handle.close().catch(() => {});
		throw err;
	}
}

/** A félbemaradt (`.part`) fájlok törlése, amelyek régebbiek a megadottnál. */
export async function removeStalePartFiles(olderThanMs: number, now = Date.now()): Promise<number> {
	const root = getPluginFilesRoot();
	let removed = 0;

	async function walk(dir: string): Promise<void> {
		let entries;
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch (err) {
			if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
			throw err;
		}
		for (const entry of entries) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				await walk(full);
			} else if (entry.isFile() && entry.name.endsWith(PART_SUFFIX)) {
				const info = await stat(full).catch(() => null);
				if (info && now - info.mtimeMs > olderThanMs) {
					await removeQuietly(full);
					removed++;
				}
			}
		}
	}

	await walk(root);
	return removed;
}
