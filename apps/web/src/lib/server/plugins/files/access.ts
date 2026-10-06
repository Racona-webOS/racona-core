/**
 * A fel- és letöltési végpontok közös ellenőrzései.
 */

import { eq } from 'drizzle-orm';
import db from '$lib/server/database';
import { apps } from '@racona/database';
import { FILE_ACCESS_PERMISSION } from './service';

export type PluginFileAccess = 'ok' | 'not_found' | 'inactive' | 'no_permission';

/** A plugin létezik, aktív, és van `file_access` joga. */
export async function checkPluginFileAccess(pluginId: string): Promise<PluginFileAccess> {
	const [plugin] = await db
		.select({
			appType: apps.appType,
			pluginStatus: apps.pluginStatus,
			pluginPermissions: apps.pluginPermissions
		})
		.from(apps)
		.where(eq(apps.appId, pluginId))
		.limit(1);

	if (!plugin || plugin.appType !== 'plugin') return 'not_found';
	if (plugin.pluginStatus !== 'active') return 'inactive';
	const permissions = (plugin.pluginPermissions as string[] | null) ?? [];
	return permissions.includes(FILE_ACCESS_PERMISSION) ? 'ok' : 'no_permission';
}

/**
 * `Content-Disposition` fejléc: ASCII tartalék név és UTF-8 név (RFC 6266),
 * hogy az ékezetes fájlnevek is helyesen jelenjenek meg.
 */
export function contentDisposition(type: 'inline' | 'attachment', fileName: string): string {
	const fallback = fileName.normalize('NFKD').replace(/[^\x20-\x7e]/g, '').replace(/["\\%]/g, '') || 'file';
	const encoded = encodeURIComponent(fileName).replace(
		/['()*]/g,
		(c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
	);
	return `${type}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

/** Az `X-File-Name` fejléc (URI-kódolt) dekódolása. */
export function decodeFileNameHeader(value: string | null): string {
	if (!value) return '';
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}
