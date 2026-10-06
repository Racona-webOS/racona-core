/**
 * A kiszolgált fájlok Content-Type és Content-Disposition fejléce.
 *
 * Elsődlegesen a platform.files táblában tárolt (feltöltéskor a tartalomból detektált)
 * MIME típust használjuk; a kiterjesztés csak az adatbázisban nem szereplő fájloknál
 * (pl. a telepítéskor bemásolt közös hátterek) számít. Aktív tartalmat (HTML, JS, SVG,
 * XML) soha nem szolgálunk ki a saját típusával, mert a böngésző a mi originünkön
 * futtatná.
 */

/** Ezeket a típusokat a böngésző megjelenítheti (img, video, audio, PDF-néző, szöveg). */
const INLINE_MIME_TYPES: ReadonlySet<string> = new Set([
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/avif',
	'application/pdf',
	'text/plain',
	'text/csv',
	'audio/mpeg',
	'audio/wav',
	'audio/ogg',
	'audio/mp4',
	'video/mp4',
	'video/webm',
	'video/ogg',
	'video/quicktime'
]);

/** Szkriptet futtatni képes típusok: ezeket application/octet-stream-ként adjuk ki. */
const ACTIVE_MIME_TYPES: ReadonlySet<string> = new Set([
	'text/html',
	'application/xhtml+xml',
	'image/svg+xml',
	'application/javascript',
	'text/javascript',
	'application/ecmascript',
	'text/ecmascript',
	'application/xml',
	'text/xml',
	'text/xsl',
	'application/x-shockwave-flash'
]);

/** Kiterjesztés → MIME, csak az adatbázisban nem szereplő fájlokhoz. Aktív típus nincs benne. */
const EXTENSION_MIME_TYPES: Readonly<Record<string, string>> = {
	// Képek
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp',
	avif: 'image/avif',

	// Dokumentumok
	pdf: 'application/pdf',
	doc: 'application/msword',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	xls: 'application/vnd.ms-excel',
	xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	ppt: 'application/vnd.ms-powerpoint',
	pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	odt: 'application/vnd.oasis.opendocument.text',
	txt: 'text/plain',
	csv: 'text/csv',

	// Archívumok
	zip: 'application/zip',
	gz: 'application/gzip',

	// Hang
	mp3: 'audio/mpeg',
	wav: 'audio/wav',
	ogg: 'audio/ogg',
	m4a: 'audio/mp4',

	// Videó
	mp4: 'video/mp4',
	webm: 'video/webm',
	mov: 'video/quicktime'
};

const OCTET_STREAM = 'application/octet-stream';

/** A kiszolgálás fejlécei. */
export interface FileResponseType {
	/** Content-Type érték */
	contentType: string;
	/** inline: a böngésző megjelenítheti; attachment: csak letöltés */
	disposition: 'inline' | 'attachment';
}

/**
 * MIME típus a kiterjesztés alapján (csak biztonságos típusok).
 * @param filePath - A fájl útvonala vagy neve.
 */
export function getMimeTypeFromExtension(filePath: string): string {
	const name = filePath.split(/[\\/]/).pop() ?? '';
	const dot = name.lastIndexOf('.');
	if (dot <= 0) return OCTET_STREAM;
	const ext = name.slice(dot + 1).toLowerCase();
	return Object.hasOwn(EXTENSION_MIME_TYPES, ext) ? EXTENSION_MIME_TYPES[ext] : OCTET_STREAM;
}

/** A MIME típus paraméterek nélkül, kisbetűvel (pl. "text/html; charset=utf-8" → "text/html"). */
function normalizeMimeType(mimeType: string): string {
	return mimeType.split(';')[0].trim().toLowerCase();
}

/**
 * A kiszolgáláskor használt Content-Type és Content-Disposition.
 *
 * @param storedMimeType - A platform.files táblában tárolt MIME típus (ha van rekord).
 * @param storagePath - A fájl relatív útvonala (a kiterjesztéses tartalék miatt).
 */
export function resolveFileResponseType(
	storedMimeType: string | null | undefined,
	storagePath: string
): FileResponseType {
	const mimeType = storedMimeType
		? normalizeMimeType(storedMimeType)
		: getMimeTypeFromExtension(storagePath);

	if (!mimeType || ACTIVE_MIME_TYPES.has(mimeType)) {
		return { contentType: OCTET_STREAM, disposition: 'attachment' };
	}

	return {
		contentType: mimeType,
		disposition: INLINE_MIME_TYPES.has(mimeType) ? 'inline' : 'attachment'
	};
}

/**
 * Content-Disposition fejléc értéke.
 * @param disposition - inline vagy attachment.
 * @param filename - A letöltéskor felajánlott fájlnév.
 */
export function buildContentDisposition(
	disposition: FileResponseType['disposition'],
	filename: string
): string {
	const asciiName = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
	return `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
