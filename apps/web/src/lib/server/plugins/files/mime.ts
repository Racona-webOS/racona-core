/**
 * A pluginok által tárolható fájltípusok. A típust mindig a fájl tartalmából
 * állapítjuk meg; a kliens által küldött típus és a kiterjesztés nem számít.
 */

import { fileTypeFromFile } from 'file-type';
import { PluginFileError } from './errors';

export const PLUGIN_FILE_MIME_TYPES = [
	'application/pdf',
	'image/jpeg',
	'image/png',
	'image/webp',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.oasis.opendocument.text',
	'application/vnd.oasis.opendocument.spreadsheet'
] as const;

const SUPPORTED: ReadonlySet<string> = new Set(PLUGIN_FILE_MIME_TYPES);

/**
 * A plugin által kért típuslista ellenőrzése. Üres vagy hiányzó lista: minden
 * támogatott típus.
 */
export function resolveAllowedMimeTypes(requested?: readonly string[] | null): string[] {
	if (!requested || requested.length === 0) return [...PLUGIN_FILE_MIME_TYPES];
	const unsupported = requested.filter((m) => !SUPPORTED.has(m));
	if (unsupported.length > 0) {
		throw new PluginFileError(
			'INVALID_INPUT',
			`Unsupported MIME types: ${unsupported.join(', ')}`
		);
	}
	return [...new Set(requested)];
}

/** A fájl típusa a tartalma alapján, vagy `null`, ha nem ismerhető fel. */
export async function detectFileMimeType(filePath: string): Promise<string | null> {
	try {
		const result = await fileTypeFromFile(filePath);
		return result?.mime ?? null;
	} catch {
		return null;
	}
}
