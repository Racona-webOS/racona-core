/** A `../repository` memóriabeli változata a tesztekhez (vi.mock-kal). */

import type { NewPluginFile, PluginFile } from '@racona/database';

export const rows = new Map<string, PluginFile>();

export function resetRows(): void {
	rows.clear();
}

export async function insertPluginFile(row: NewPluginFile): Promise<PluginFile> {
	const full: PluginFile = {
		id: row.id!,
		pluginId: row.pluginId,
		storagePath: row.storagePath,
		originalName: row.originalName,
		mimeType: row.mimeType,
		size: row.size,
		sha256: row.sha256,
		ref: row.ref ?? null,
		createdBy: row.createdBy ?? null,
		createdAt: row.createdAt ?? new Date(),
		claimedAt: row.claimedAt ?? null
	};
	rows.set(full.id, full);
	return full;
}

export async function findPluginFile(pluginId: string, fileId: string): Promise<PluginFile | null> {
	const row = rows.get(fileId);
	return row && row.pluginId === pluginId ? row : null;
}

export async function deletePluginFileRow(pluginId: string, fileId: string): Promise<PluginFile | null> {
	const row = await findPluginFile(pluginId, fileId);
	if (row) rows.delete(fileId);
	return row;
}

export async function markPluginFileClaimed(
	pluginId: string,
	fileId: string,
	ref: string | undefined
): Promise<PluginFile | null> {
	const row = await findPluginFile(pluginId, fileId);
	if (!row) return null;
	row.claimedAt ??= new Date();
	if (ref !== undefined) row.ref = ref;
	return row;
}

export async function findUnclaimedBefore(before: Date, limit: number): Promise<PluginFile[]> {
	return [...rows.values()]
		.filter((r) => r.claimedAt === null && r.createdAt < before)
		.slice(0, limit);
}

export async function deletePluginFileRowById(fileId: string): Promise<PluginFile | null> {
	const row = rows.get(fileId) ?? null;
	rows.delete(fileId);
	return row;
}
