/**
 * A `platform.plugin_files` tábla műveletei. Minden lekérdezés a plugin
 * azonosítójára szűr, így egy plugin csak a saját fájljait éri el.
 */

import { and, eq, isNull, lt, sql } from 'drizzle-orm';
import db from '$lib/server/database';
import { pluginFiles, type NewPluginFile, type PluginFile } from '@racona/database';
import { isValidFileId } from './storage';

export async function insertPluginFile(row: NewPluginFile): Promise<PluginFile> {
	const [inserted] = await db.insert(pluginFiles).values(row).returning();
	return inserted;
}

export async function findPluginFile(pluginId: string, fileId: string): Promise<PluginFile | null> {
	if (!isValidFileId(fileId)) return null;
	const [row] = await db
		.select()
		.from(pluginFiles)
		.where(and(eq(pluginFiles.pluginId, pluginId), eq(pluginFiles.id, fileId)))
		.limit(1);
	return row ?? null;
}

/** A sor törlése; a törölt sort adja vissza (a fájl útvonalához), vagy `null`-t. */
export async function deletePluginFileRow(
	pluginId: string,
	fileId: string
): Promise<PluginFile | null> {
	if (!isValidFileId(fileId)) return null;
	const [row] = await db
		.delete(pluginFiles)
		.where(and(eq(pluginFiles.pluginId, pluginId), eq(pluginFiles.id, fileId)))
		.returning();
	return row ?? null;
}

/** Claimelt állapotba tesz; a már claimelt fájl időpontja nem változik. */
export async function markPluginFileClaimed(
	pluginId: string,
	fileId: string,
	ref: string | undefined
): Promise<PluginFile | null> {
	if (!isValidFileId(fileId)) return null;
	const [row] = await db
		.update(pluginFiles)
		.set({
			claimedAt: sql`COALESCE(${pluginFiles.claimedAt}, now())`,
			...(ref !== undefined ? { ref } : {})
		})
		.where(and(eq(pluginFiles.pluginId, pluginId), eq(pluginFiles.id, fileId)))
		.returning();
	return row ?? null;
}

/** A megadott időpontnál régebbi, claim nélküli fájlok (takarításhoz). */
export async function findUnclaimedBefore(before: Date, limit: number): Promise<PluginFile[]> {
	return db
		.select()
		.from(pluginFiles)
		.where(and(isNull(pluginFiles.claimedAt), lt(pluginFiles.createdAt, before)))
		.orderBy(pluginFiles.createdAt)
		.limit(limit);
}

/** Takarításhoz: törlés azonosító alapján, plugintól függetlenül. */
export async function deletePluginFileRowById(fileId: string): Promise<PluginFile | null> {
	const [row] = await db.delete(pluginFiles).where(eq(pluginFiles.id, fileId)).returning();
	return row ?? null;
}
