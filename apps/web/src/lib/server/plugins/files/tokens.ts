/**
 * Aláírt, lejáró fel- és letöltési tokenek (HMAC-SHA256, állapot nélkül).
 * A kulcs a `BETTER_AUTH_SECRET`-ből származik (HKDF), így nincs új titok.
 */

import { createHmac, hkdfSync, timingSafeEqual } from 'crypto';
import { env } from '$lib/env';
import { PluginFileError } from './errors';

export interface UploadTokenPayload {
	k: 'u';
	/** plugin ID */
	p: string;
	/** felhasználó ID */
	u: number;
	/** engedett MIME típusok */
	m: string[];
	/** méretkorlát (bájt) */
	s: number;
	/** a plugin hivatkozása */
	r?: string;
	/** lejárat (unix mp) */
	e: number;
}

export interface DownloadTokenPayload {
	k: 'd';
	p: string;
	u: number;
	/** fájl ID */
	f: string;
	/** megjelenítés */
	d: 'inline' | 'attachment';
	e: number;
}

type TokenPayload = UploadTokenPayload | DownloadTokenPayload;

const HKDF_INFO = 'racona:plugin-files:v1';

let cached: { secret: string; key: Buffer } | null = null;

function signingKey(): Buffer {
	const secret = (env as unknown as Record<string, unknown>).BETTER_AUTH_SECRET;
	if (typeof secret !== 'string' || secret.length === 0) {
		throw new PluginFileError('STORAGE_ERROR', 'BETTER_AUTH_SECRET is not configured');
	}
	if (cached?.secret !== secret) {
		cached = { secret, key: Buffer.from(hkdfSync('sha256', secret, '', HKDF_INFO, 32)) };
	}
	return cached.key;
}

function sign(body: string): Buffer {
	return createHmac('sha256', signingKey()).update(body).digest();
}

export function signToken(payload: TokenPayload): string {
	const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
	return `${body}.${sign(body).toString('base64url')}`;
}

/**
 * A token ellenőrzése: aláírás, típus, lejárat. Érvénytelen tokennél `null`.
 * A plugin és a felhasználó egyezését a hívó ellenőrzi.
 */
export function verifyToken(token: string, kind: 'u', nowMs?: number): UploadTokenPayload | null;
export function verifyToken(token: string, kind: 'd', nowMs?: number): DownloadTokenPayload | null;
export function verifyToken(
	token: string,
	kind: 'u' | 'd',
	nowMs: number = Date.now()
): TokenPayload | null {
	if (typeof token !== 'string' || token.length > 4096) return null;
	const dot = token.indexOf('.');
	if (dot <= 0 || dot !== token.lastIndexOf('.')) return null;
	const body = token.slice(0, dot);
	const given = Buffer.from(token.slice(dot + 1), 'base64url');
	const expected = sign(body);
	if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

	let payload: TokenPayload;
	try {
		payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
	} catch {
		return null;
	}
	if (!payload || typeof payload !== 'object' || payload.k !== kind) return null;
	if (typeof payload.e !== 'number' || payload.e * 1000 <= nowMs) return null;
	if (typeof payload.p !== 'string' || !Number.isInteger(payload.u)) return null;
	return payload;
}
