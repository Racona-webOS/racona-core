/**
 * A core fájltárolás szerver oldali méretkorlátja.
 */

import { env } from '$lib/env';
import { DEFAULT_BODY_SIZE_LIMIT, maxUploadBytesForBodyLimit } from '$lib/storage/limits';

/**
 * A szerver által elfogadott legnagyobb fájlméret, a BODY_SIZE_LIMIT-ből számolva
 * (a base64 kódolás miatt kb. a háromnegyede).
 */
export function getMaxUploadBytes(): number {
	const raw = (env as unknown as Record<string, unknown>).BODY_SIZE_LIMIT;
	const n = Number(raw);
	const bodyLimit =
		raw === undefined || raw === null || raw === '' || !Number.isFinite(n) || n < 1
			? DEFAULT_BODY_SIZE_LIMIT
			: n;
	return maxUploadBytesForBodyLimit(bodyLimit);
}

/**
 * A base64 szöveg dekódolt méretének becslése dekódolás nélkül.
 * @param base64 - Base64 adat, opcionálisan data URL előtaggal.
 */
export function estimateDecodedSize(base64: string): number {
	const comma = base64.indexOf(',');
	const data = comma >= 0 ? base64.slice(comma + 1) : base64;
	const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
	return Math.max(0, Math.floor((data.length * 3) / 4) - padding);
}
