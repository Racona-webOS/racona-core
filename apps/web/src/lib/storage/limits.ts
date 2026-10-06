/**
 * Feltöltési méretkorlát (kliens-elérhető)
 *
 * A fájl base64-ként, egy remote function kérésben érkezik, így a kérés törzse
 * (BODY_SIZE_LIMIT) kb. 4/3-szorosa a fájlnak. A fájl mérethatárát ebből számoljuk,
 * hogy ami a kliens ellenőrzésén átmegy, azt a szerver is fogadja.
 */

const MIB = 1024 * 1024;

/** A BODY_SIZE_LIMIT alapértéke (.env.schema): 10 MiB. */
export const DEFAULT_BODY_SIZE_LIMIT = 10 * MIB;

/** A kérés base64-en kívüli része (data URL előtag, fájlnév, egyéb mezők) — bőven számolva. */
export const UPLOAD_REQUEST_OVERHEAD_BYTES = 64 * 1024;

/**
 * A legnagyobb feltölthető fájl mérete egy adott kéréstörzs-korláthoz.
 * 1 MiB felett lefelé kerekít egész MiB-ra, hogy a felületen kiírt érték pontos legyen.
 *
 * @param bodySizeLimit - A kérés törzsének mérethatára bájtban (BODY_SIZE_LIMIT).
 * @returns A fájl legnagyobb mérete bájtban.
 */
export function maxUploadBytesForBodyLimit(bodySizeLimit: number): number {
	if (!Number.isFinite(bodySizeLimit) || bodySizeLimit <= UPLOAD_REQUEST_OVERHEAD_BYTES) {
		return 0;
	}
	const raw = Math.floor((bodySizeLimit - UPLOAD_REQUEST_OVERHEAD_BYTES) / 4) * 3;
	return raw >= MIB ? Math.floor(raw / MIB) * MIB : raw;
}

/** A feltölthető fájl mérethatára az alapértelmezett BODY_SIZE_LIMIT mellett (7 MiB). */
export const DEFAULT_MAX_UPLOAD_BYTES = maxUploadBytesForBodyLimit(DEFAULT_BODY_SIZE_LIMIT);

/**
 * Bájtérték olvasható formában (pl. "7 MB").
 * @param bytes - Méret bájtban.
 */
export function formatBytes(bytes: number): string {
	if (bytes <= 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
