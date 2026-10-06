/**
 * Plugin fájltárolás konfiguráció. A változók leírása: apps/web/.env.schema,
 * docs/CONFIGURATION.md.
 */

import path from 'path';
import { env } from '$lib/env';
import { getUploadsPath } from '$lib/server/storage/types';

/** Az uploads mappán belüli gyökér. A `/api/files` útvonal ezt nem szolgálja ki. */
export const PLUGIN_FILES_DIR_NAME = 'plugin-files';

/** Alapértelmezett méretkorlát fájlonként: 10 MiB. */
export const DEFAULT_PLUGIN_FILE_MAX_BYTES = 10 * 1024 * 1024;

/** A konfigurálható felső határ: 1 GiB. */
const MAX_CONFIGURABLE_BYTES = 1024 * 1024 * 1024;

/** Feltöltési link érvényessége (s). */
export const UPLOAD_TOKEN_TTL_SECONDS = { default: 300, max: 900 } as const;

/** Letöltési link érvényessége (s). */
export const DOWNLOAD_TOKEN_TTL_SECONDS = { default: 60, max: 600 } as const;

/** Ennyi idő után törlődik a feltöltött, de a plugin által be nem kötött fájl. */
export const UNCLAIMED_RETENTION_MS = 24 * 60 * 60 * 1000;

export function getPluginFilesRoot(): string {
	return path.join(getUploadsPath(), PLUGIN_FILES_DIR_NAME);
}

let bodyLimitChecked = false;

/** A fájlonkénti méretkorlát (`PLUGIN_FILE_MAX_BYTES`, alapérték 10 MiB). */
export function getPluginFileMaxBytes(): number {
	const raw = (env as unknown as Record<string, unknown>).PLUGIN_FILE_MAX_BYTES;
	const n = Number(raw);
	const limit =
		raw === undefined || raw === null || raw === '' || !Number.isFinite(n) || n < 1
			? DEFAULT_PLUGIN_FILE_MAX_BYTES
			: Math.min(Math.round(n), MAX_CONFIGURABLE_BYTES);

	if (!bodyLimitChecked) {
		bodyLimitChecked = true;
		const body = Number((env as unknown as Record<string, unknown>).BODY_SIZE_LIMIT);
		if (Number.isFinite(body) && body > 0 && body < limit) {
			console.warn(
				`[PluginFiles] PLUGIN_FILE_MAX_BYTES (${limit}) is larger than BODY_SIZE_LIMIT (${body}); uploads above ${body} bytes will be rejected`
			);
		}
	}

	return limit;
}
