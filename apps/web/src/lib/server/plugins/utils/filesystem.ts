/**
 * Fájlrendszer Utility Függvények
 *
 * Plugin fájlok kezelésére szolgáló segédfüggvények.
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Plugin tárolási könyvtárak
 *
 * A pluginok az uploads/plugins/ mappában tárolódnak,
 * ugyanúgy mint a többi feltöltött fájl.
 */
export const PLUGIN_DIRS = {
	/** Telepített pluginok könyvtára */
	PLUGINS: path.join(process.cwd(), 'uploads', 'plugins'),
	/** Ideiglenes fájlok könyvtára */
	TEMP: path.join(process.cwd(), 'uploads', 'plugins', '.temp'),
	/** Backup könyvtár */
	BACKUPS: path.join(process.cwd(), 'uploads', 'plugins', '.backups')
} as const;

/**
 * Könyvtár létrehozása ha nem létezik
 */
export async function ensureDir(dirPath: string): Promise<void> {
	try {
		await fs.mkdir(dirPath, { recursive: true, mode: 0o755 });
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
			throw error;
		}
	}
}

/**
 * Összes plugin könyvtár inicializálása
 */
export async function initializePluginDirectories(): Promise<void> {
	await Promise.all([
		ensureDir(PLUGIN_DIRS.PLUGINS),
		ensureDir(PLUGIN_DIRS.TEMP),
		ensureDir(PLUGIN_DIRS.BACKUPS)
	]);
}

/**
 * Plugin könyvtár útvonalának generálása
 */
export function getPluginDir(pluginId: string): string {
	return path.join(PLUGIN_DIRS.PLUGINS, pluginId);
}

/**
 * Ideiglenes fájl útvonalának generálása
 */
export function getTempPath(filename: string): string {
	return path.join(PLUGIN_DIRS.TEMP, filename);
}

/**
 * Backup útvonal generálása
 */
export function getBackupPath(pluginId: string, timestamp?: number): string {
	const ts = timestamp || Date.now();
	return path.join(PLUGIN_DIRS.BACKUPS, `${pluginId}_${ts}`);
}

/**
 * Path traversal támadás ellenőrzése
 *
 * Biztosítja, hogy az útvonal a megadott base könyvtáron belül marad.
 */
export function validatePath(basePath: string, targetPath: string): boolean {
	const resolvedBase = path.resolve(basePath);
	const resolvedTarget = path.resolve(basePath, targetPath);

	return resolvedTarget.startsWith(resolvedBase);
}

/**
 * Biztonságos fájl olvasás
 *
 * Ellenőrzi a path traversal támadásokat.
 */
export async function safeReadFile(basePath: string, filePath: string): Promise<Buffer> {
	if (!validatePath(basePath, filePath)) {
		throw new Error('Invalid file path: path traversal detected');
	}

	const fullPath = path.join(basePath, filePath);
	return await fs.readFile(fullPath);
}

/**
 * Biztonságos fájl írás
 *
 * Ellenőrzi a path traversal támadásokat.
 */
export async function safeWriteFile(
	basePath: string,
	filePath: string,
	content: Buffer | string
): Promise<void> {
	if (!validatePath(basePath, filePath)) {
		throw new Error('Invalid file path: path traversal detected');
	}

	const fullPath = path.join(basePath, filePath);
	const dir = path.dirname(fullPath);

	// Könyvtár létrehozása ha nem létezik
	await ensureDir(dir);

	await fs.writeFile(fullPath, content, { mode: 0o644 });
}

/**
 * Könyvtár rekurzív törlése
 */
export async function removeDir(dirPath: string): Promise<void> {
	if (existsSync(dirPath)) {
		await fs.rm(dirPath, { recursive: true, force: true });
	}
}

/**
 * Könyvtár másolása
 */
export async function copyDir(src: string, dest: string): Promise<void> {
	await ensureDir(dest);

	const entries = await fs.readdir(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			await copyDir(srcPath, destPath);
		} else {
			await fs.copyFile(srcPath, destPath);
		}
	}
}

/**
 * Fájl méret lekérdezése
 */
export async function getFileSize(filePath: string): Promise<number> {
	const stats = await fs.stat(filePath);
	return stats.size;
}

/**
 * Könyvtár méret számítása (rekurzív)
 */
export async function getDirSize(dirPath: string): Promise<number> {
	let totalSize = 0;

	const entries = await fs.readdir(dirPath, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry.name);

		if (entry.isDirectory()) {
			totalSize += await getDirSize(fullPath);
		} else {
			const stats = await fs.stat(fullPath);
			totalSize += stats.size;
		}
	}

	return totalSize;
}

/**
 * Ideiglenes fájlok tisztítása (7 napnál régebbiek)
 */
export async function cleanupTempFiles(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
	const now = Date.now();

	try {
		const entries = await fs.readdir(PLUGIN_DIRS.TEMP, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(PLUGIN_DIRS.TEMP, entry.name);
			const stats = await fs.stat(fullPath);

			if (now - stats.mtimeMs > maxAgeMs) {
				if (entry.isDirectory()) {
					await removeDir(fullPath);
				} else {
					await fs.unlink(fullPath);
				}
			}
		}
	} catch (error) {
		// A könyvtár az első feltöltésig nem létezik — ez nem hiba
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
		console.error('Error cleaning temp files:', error);
	}
}

/**
 * Régi backup-ok tisztítása
 */
export async function cleanupOldBackups(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
	const now = Date.now();

	try {
		const entries = await fs.readdir(PLUGIN_DIRS.BACKUPS, { withFileTypes: true });

		for (const entry of entries) {
			if (!entry.isDirectory()) continue;

			const fullPath = path.join(PLUGIN_DIRS.BACKUPS, entry.name);
			const stats = await fs.stat(fullPath);

			if (now - stats.mtimeMs > maxAgeMs) {
				await removeDir(fullPath);
			}
		}
	} catch (error) {
		// A könyvtár az első frissítésig nem létezik — ez nem hiba
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
		console.error('Error cleaning old backups:', error);
	}
}

/**
 * Fájl jogosultságok ellenőrzése
 */
export async function checkPermissions(filePath: string): Promise<{
	readable: boolean;
	writable: boolean;
	executable: boolean;
}> {
	try {
		await fs.access(filePath, fs.constants.R_OK);
		const readable = true;

		let writable = false;
		try {
			await fs.access(filePath, fs.constants.W_OK);
			writable = true;
		} catch {}

		let executable = false;
		try {
			await fs.access(filePath, fs.constants.X_OK);
			executable = true;
		} catch {}

		return { readable, writable, executable };
	} catch {
		return { readable: false, writable: false, executable: false };
	}
}
