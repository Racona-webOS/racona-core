/**
 * Plugin System Configuration
 *
 * Központi konfiguráció a plugin rendszer számára.
 * Az értékek a validált környezeti változókból töltődnek be.
 */

import { env } from '$lib/env';

/**
 * Plugin csomag kiterjesztése (pont nélkül)
 * Példa: 'elyospkg', 'wospkg'
 */
export const PLUGIN_PACKAGE_EXTENSION = env.PLUGIN_PACKAGE_EXTENSION;

/**
 * Plugin csomag kiterjesztése ponttal
 * Példa: '.elyospkg', '.wospkg'
 */
export const PLUGIN_PACKAGE_EXTENSION_WITH_DOT = `.${PLUGIN_PACKAGE_EXTENSION}`;

/**
 * Maximális plugin csomag méret bájtokban
 * Alapértelmezett: 10 MB (10485760 bájt)
 */
export const PLUGIN_MAX_SIZE = env.PLUGIN_MAX_SIZE;

/**
 * Maximális plugin csomag méret megabájtokban (olvasható formátum)
 */
export const PLUGIN_MAX_SIZE_MB = (PLUGIN_MAX_SIZE ?? 0) / (1024 * 1024);

/**
 * Plugin tárolási könyvtár
 */
export const PLUGIN_STORAGE_DIR = env.PLUGIN_STORAGE_DIR ?? '/var/webos/plugins';

/**
 * Ideiglenes feltöltési könyvtár
 */
export const PLUGIN_TEMP_DIR = env.PLUGIN_TEMP_DIR ?? '/tmp/webos-plugins';

/**
 * Engedélyezett MIME típusok plugin csomagokhoz
 */
export const PLUGIN_ALLOWED_MIME_TYPES = [
	'application/zip',
	'application/x-zip-compressed',
	'application/octet-stream'
] as const;

/**
 * Plugin konfiguráció objektum (kompatibilitás)
 */
export const PLUGIN_CONFIG = {
	PACKAGE_EXTENSION: PLUGIN_PACKAGE_EXTENSION,
	PACKAGE_EXTENSION_WITH_DOT: PLUGIN_PACKAGE_EXTENSION_WITH_DOT,
	MAX_SIZE: PLUGIN_MAX_SIZE,
	MAX_SIZE_MB: PLUGIN_MAX_SIZE_MB,
	STORAGE_DIR: PLUGIN_STORAGE_DIR,
	TEMP_DIR: PLUGIN_TEMP_DIR,
	ALLOWED_MIME_TYPES: PLUGIN_ALLOWED_MIME_TYPES
} as const;
