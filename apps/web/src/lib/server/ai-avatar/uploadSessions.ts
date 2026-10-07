/**
 * Avatar csomagok darabolt feltöltése
 *
 * Az avatar csomagok 5–20 MB-osak, egy kérésben (base64-ben) átlépnék a
 * BODY_SIZE_LIMIT-et és a proxyk korlátait. Ezért a böngésző kis darabokban
 * küldi őket: a darabok egy ideiglenes fájlba fűződnek, és a telepítés ebből
 * az összefűzött fájlból történik.
 *
 * A munkamenetek a szerver memóriájában élnek (egy folyamat fut), a félbehagyott
 * feltöltések egy óra után törlődnek.
 */

import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

/** Egy darab legnagyobb mérete (nyers bájt; base64-ben ~1,34-szerese) */
export const AVATAR_CHUNK_SIZE = 512 * 1024;

/** Egy avatar csomag legnagyobb mérete */
export const AVATAR_MAX_PACKAGE_SIZE = 64 * 1024 * 1024;

/** Ennyi idő után a félbehagyott feltöltés törlődik */
const SESSION_TTL_MS = 60 * 60 * 1000;

interface UploadSession {
	userId: number;
	size: number;
	received: number;
	nextIndex: number;
	filePath: string;
	createdAt: number;
}

export type UploadErrorCode =
	| 'TOO_LARGE'
	| 'NOT_FOUND'
	| 'OUT_OF_ORDER'
	| 'OVERFLOW'
	| 'INCOMPLETE';

export class AvatarUploadError extends Error {
	constructor(public code: UploadErrorCode) {
		super(code);
	}
}

const sessions = new Map<string, UploadSession>();

/** Az ideiglenes fájlok mappája (tesztben felülírható) */
let uploadsRoot = path.join(os.tmpdir(), 'racona-avatar-uploads');

export function setUploadsRootForTests(dir: string): void {
	uploadsRoot = dir;
}

/**
 * Új feltöltés indítása
 *
 * @returns A feltöltés azonosítója és a darabméret
 */
export async function beginUpload(
	userId: number,
	size: number
): Promise<{ uploadId: string; chunkSize: number }> {
	if (size <= 0 || size > AVATAR_MAX_PACKAGE_SIZE) {
		throw new AvatarUploadError('TOO_LARGE');
	}

	await cleanupStaleSessions();

	const uploadId = randomUUID();
	await fs.mkdir(uploadsRoot, { recursive: true });
	const filePath = path.join(uploadsRoot, `${uploadId}.raconapkg`);
	await fs.writeFile(filePath, Buffer.alloc(0));

	sessions.set(uploadId, {
		userId,
		size,
		received: 0,
		nextIndex: 0,
		filePath,
		createdAt: Date.now()
	});

	return { uploadId, chunkSize: AVATAR_CHUNK_SIZE };
}

/**
 * Egy darab hozzáfűzése. A darabok csak sorrendben érkezhetnek.
 *
 * @returns Az eddig fogadott bájtok száma
 */
export async function appendChunk(
	userId: number,
	uploadId: string,
	index: number,
	data: Buffer
): Promise<number> {
	const session = getSession(userId, uploadId);

	if (index !== session.nextIndex) {
		throw new AvatarUploadError('OUT_OF_ORDER');
	}
	if (data.length > AVATAR_CHUNK_SIZE || session.received + data.length > session.size) {
		await discardUpload(uploadId);
		throw new AvatarUploadError('OVERFLOW');
	}

	await fs.appendFile(session.filePath, data);
	session.received += data.length;
	session.nextIndex += 1;
	return session.received;
}

/**
 * A teljes feltöltött fájl beolvasása és a munkamenet lezárása (a fájl törlődik)
 */
export async function finishUpload(userId: number, uploadId: string): Promise<Buffer> {
	const session = getSession(userId, uploadId);

	if (session.received !== session.size) {
		await discardUpload(uploadId);
		throw new AvatarUploadError('INCOMPLETE');
	}

	try {
		return await fs.readFile(session.filePath);
	} finally {
		await discardUpload(uploadId);
	}
}

/**
 * Feltöltés eldobása (hiba vagy megszakítás esetén)
 */
export async function discardUpload(uploadId: string): Promise<void> {
	const session = sessions.get(uploadId);
	sessions.delete(uploadId);
	if (session) {
		await fs.rm(session.filePath, { force: true });
	}
}

function getSession(userId: number, uploadId: string): UploadSession {
	const session = sessions.get(uploadId);
	// Más felhasználó feltöltése ugyanúgy „nem található”
	if (!session || session.userId !== userId) {
		throw new AvatarUploadError('NOT_FOUND');
	}
	return session;
}

async function cleanupStaleSessions(): Promise<void> {
	const now = Date.now();
	for (const [uploadId, session] of sessions) {
		if (now - session.createdAt > SESSION_TTL_MS) {
			await discardUpload(uploadId);
		}
	}
}
