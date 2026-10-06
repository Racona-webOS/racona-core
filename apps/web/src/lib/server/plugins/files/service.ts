/**
 * A `file_access` jogú pluginok `context.files` szolgáltatása.
 * Lásd: .kiro/specs/plugin-file-storage.
 */

import { randomUUID } from 'crypto';
import type { PluginFile } from '@racona/database';
import {
	DOWNLOAD_TOKEN_TTL_SECONDS,
	UPLOAD_TOKEN_TTL_SECONDS,
	getPluginFileMaxBytes
} from './config';
import { PluginFileError } from './errors';
import { detectFileMimeType, resolveAllowedMimeTypes } from './mime';
import {
	deletePluginFileRow,
	findPluginFile,
	insertPluginFile,
	markPluginFileClaimed
} from './repository';
import {
	buildStoragePath,
	commitTemp,
	deleteStoredFile,
	readStoredFile,
	removeQuietly,
	writeToTemp
} from './storage';
import { signToken } from './tokens';

/** A manifest jogosultság, amely a szolgáltatást adja. */
export const FILE_ACCESS_PERMISSION = 'file_access';

const MAX_REF_LENGTH = 255;
const MAX_NAME_LENGTH = 255;

export interface PluginFileInfo {
	id: string;
	originalName: string;
	mimeType: string;
	size: number;
	sha256: string;
	ref: string | null;
	createdBy: number | null;
	createdAt: Date;
	claimedAt: Date | null;
}

export interface PluginFileService {
	/** Szerveroldali mentés (pl. generált export); a fájl rögtön claimelt. */
	save(input: {
		data: Buffer | Uint8Array;
		fileName: string;
		allowedMimeTypes?: string[];
		maxBytes?: number;
		ref?: string;
	}): Promise<PluginFileInfo>;
	get(fileId: string): Promise<PluginFileInfo | null>;
	read(fileId: string): Promise<Buffer>;
	/** Idempotens: a nem létező fájl nem hiba. */
	delete(fileId: string): Promise<void>;
	/** A feltöltött fájl a plugin adataihoz kötve; a claim nélküli fájlok 24 óra után törlődnek. */
	claim(fileId: string, options?: { ref?: string }): Promise<PluginFileInfo>;
	createUploadUrl(options: {
		allowedMimeTypes: string[];
		maxBytes?: number;
		ref?: string;
		ttlSeconds?: number;
	}): Promise<{ uploadUrl: string; expiresAt: Date }>;
	createDownloadUrl(
		fileId: string,
		options?: { disposition?: 'inline' | 'attachment'; ttlSeconds?: number }
	): Promise<{ url: string; expiresAt: Date }>;
}

export function toFileInfo(row: PluginFile): PluginFileInfo {
	return {
		id: row.id,
		originalName: row.originalName,
		mimeType: row.mimeType,
		size: Number(row.size),
		sha256: row.sha256,
		ref: row.ref,
		createdBy: row.createdBy,
		createdAt: row.createdAt,
		claimedAt: row.claimedAt
	};
}

/**
 * Az eredeti fájlnév megőrzendő része: csak a megjelenítéshez és a letöltéshez
 * kell (a lemezen nem ez a név), ezért az ékezetek maradnak.
 */
export function sanitizeOriginalName(name: unknown): string {
	const base = String(name ?? '')
		.split(/[\\/]/)
		.pop()!
		// eslint-disable-next-line no-control-regex
		.replace(/[\u0000-\u001f\u007f"]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	if (!base || base === '.' || base === '..') return 'file';
	if (base.length <= MAX_NAME_LENGTH) return base;
	const dot = base.lastIndexOf('.');
	const ext = dot > 0 && base.length - dot <= 16 ? base.slice(dot) : '';
	return base.slice(0, MAX_NAME_LENGTH - ext.length) + ext;
}

function normalizeRef(ref: unknown): string | undefined {
	if (ref === undefined || ref === null) return undefined;
	if (typeof ref !== 'string' || ref.length > MAX_REF_LENGTH) {
		throw new PluginFileError('INVALID_INPUT', `ref must be a string of at most ${MAX_REF_LENGTH} characters`);
	}
	return ref;
}

function resolveMaxBytes(requested: unknown): number {
	const limit = getPluginFileMaxBytes();
	if (requested === undefined || requested === null) return limit;
	const n = Number(requested);
	if (!Number.isInteger(n) || n < 1) {
		throw new PluginFileError('INVALID_INPUT', 'maxBytes must be a positive integer');
	}
	return Math.min(n, limit);
}

function resolveTtl(requested: unknown, bounds: { default: number; max: number }): number {
	if (requested === undefined || requested === null) return bounds.default;
	const n = Number(requested);
	if (!Number.isFinite(n) || n < 1) {
		throw new PluginFileError('INVALID_INPUT', 'ttlSeconds must be a positive number');
	}
	return Math.min(Math.round(n), bounds.max);
}

/**
 * Fájl tárolása: írás `.part` fájlba, típusellenőrzés a tartalomból, átnevezés,
 * metaadat mentése. Bármely hibánál a lemezen nem marad semmi.
 */
export async function storePluginFile(params: {
	pluginId: string;
	source: Uint8Array | AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>;
	fileName: unknown;
	allowedMimeTypes: readonly string[];
	maxBytes: number;
	ref?: string;
	createdBy: number | null;
	claimed: boolean;
}): Promise<PluginFile> {
	const fileId = randomUUID();
	const now = new Date();
	const storagePath = buildStoragePath(params.pluginId, fileId, now);
	const written = await writeToTemp(storagePath, params.source, params.maxBytes);

	const mimeType = await detectFileMimeType(written.tempPath);
	if (!mimeType || !params.allowedMimeTypes.includes(mimeType)) {
		await removeQuietly(written.tempPath);
		throw new PluginFileError(
			'INVALID_MIME',
			mimeType ? `File type ${mimeType} is not allowed` : 'File type could not be recognized'
		);
	}

	try {
		await commitTemp(written);
	} catch (err) {
		await removeQuietly(written.tempPath);
		throw err;
	}

	try {
		return await insertPluginFile({
			id: fileId,
			pluginId: params.pluginId,
			storagePath,
			originalName: sanitizeOriginalName(params.fileName),
			mimeType,
			size: written.size,
			sha256: written.sha256,
			ref: params.ref ?? null,
			createdBy: params.createdBy,
			createdAt: now,
			claimedAt: params.claimed ? now : null
		});
	} catch (err) {
		await removeQuietly(written.finalPath);
		throw err;
	}
}

/**
 * @param userId - A hívó felhasználó; ütemezett feladatban `null` (ilyenkor
 * fel- és letöltési link nem kérhető).
 * @returns A szolgáltatás, vagy `undefined`, ha a pluginnak nincs `file_access` joga.
 */
export function createPluginFileService(
	pluginId: string,
	pluginPermissions: string[],
	userId: number | null
): PluginFileService | undefined {
	if (!pluginPermissions.includes(FILE_ACCESS_PERMISSION)) return undefined;

	async function requireFile(fileId: string): Promise<PluginFile> {
		const row = await findPluginFile(pluginId, fileId);
		if (!row) throw new PluginFileError('FILE_NOT_FOUND', 'File not found');
		return row;
	}

	function requireUser(action: string): number {
		if (userId === null) {
			throw new PluginFileError(
				'PERMISSION_DENIED',
				`${action} is only available in remote functions called by a user`
			);
		}
		return userId;
	}

	return {
		async save({ data, fileName, allowedMimeTypes, maxBytes, ref }) {
			if (!(data instanceof Uint8Array)) {
				throw new PluginFileError('INVALID_INPUT', 'data must be a Buffer or Uint8Array');
			}
			const row = await storePluginFile({
				pluginId,
				source: data,
				fileName,
				allowedMimeTypes: resolveAllowedMimeTypes(allowedMimeTypes),
				maxBytes: resolveMaxBytes(maxBytes),
				ref: normalizeRef(ref),
				createdBy: userId,
				claimed: true
			});
			return toFileInfo(row);
		},

		async get(fileId) {
			const row = await findPluginFile(pluginId, fileId);
			return row ? toFileInfo(row) : null;
		},

		async read(fileId) {
			const row = await requireFile(fileId);
			return readStoredFile(row.storagePath);
		},

		async delete(fileId) {
			const row = await deletePluginFileRow(pluginId, fileId);
			if (row) await deleteStoredFile(row.storagePath);
		},

		async claim(fileId, options) {
			const ref = normalizeRef(options?.ref);
			const row = await requireFile(fileId);
			if (userId !== null && row.createdBy !== userId) {
				throw new PluginFileError('PERMISSION_DENIED', 'The file was uploaded by another user');
			}
			const claimed = await markPluginFileClaimed(pluginId, fileId, ref);
			if (!claimed) throw new PluginFileError('FILE_NOT_FOUND', 'File not found');
			return toFileInfo(claimed);
		},

		async createUploadUrl({ allowedMimeTypes, maxBytes, ref, ttlSeconds }) {
			const user = requireUser('createUploadUrl');
			const ttl = resolveTtl(ttlSeconds, UPLOAD_TOKEN_TTL_SECONDS);
			const expiresAt = new Date(Date.now() + ttl * 1000);
			const normalizedRef = normalizeRef(ref);
			const token = signToken({
				k: 'u',
				p: pluginId,
				u: user,
				m: resolveAllowedMimeTypes(allowedMimeTypes),
				s: resolveMaxBytes(maxBytes),
				...(normalizedRef !== undefined ? { r: normalizedRef } : {}),
				e: Math.floor(expiresAt.getTime() / 1000)
			});
			return { uploadUrl: `/api/plugins/${pluginId}/files/upload/${token}`, expiresAt };
		},

		async createDownloadUrl(fileId, options) {
			const user = requireUser('createDownloadUrl');
			const row = await requireFile(fileId);
			const disposition = options?.disposition ?? 'attachment';
			if (disposition !== 'inline' && disposition !== 'attachment') {
				throw new PluginFileError('INVALID_INPUT', "disposition must be 'inline' or 'attachment'");
			}
			const ttl = resolveTtl(options?.ttlSeconds, DOWNLOAD_TOKEN_TTL_SECONDS);
			const expiresAt = new Date(Date.now() + ttl * 1000);
			const token = signToken({
				k: 'd',
				p: pluginId,
				u: user,
				f: row.id,
				d: disposition,
				e: Math.floor(expiresAt.getTime() / 1000)
			});
			return { url: `/api/plugins/${pluginId}/files/download/${token}`, expiresAt };
		}
	};
}
