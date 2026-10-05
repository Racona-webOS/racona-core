// @vitest-environment node
/**
 * Unit tesztek a plugin szerver pillanatképekhez.
 *
 * Valódi ideiglenes mappákkal dolgozik. A fájlok mtime-ját fix értékre állítjuk,
 * ahogy a telepítő is megőrzi a zip-ben tárolt mtime-okat.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, utimes } from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import {
	resolveServerModuleUrl,
	invalidateServerSnapshots,
	SERVER_SNAPSHOT_PREFIX
} from './server-snapshot';

/** A zip-ből kicsomagolt fájlok megőrzött módosítási ideje */
const FIXED_MTIME = new Date('2026-01-01T00:00:00Z');

let tmpRoot: string;
let pluginDir: string;
let entryPath: string;

/** Fájl írása fix mtime-mal (a telepítő viselkedését utánozza) */
async function writeFixed(relPath: string, content: string): Promise<void> {
	const fullPath = path.join(pluginDir, relPath);
	await mkdir(path.dirname(fullPath), { recursive: true });
	await writeFile(fullPath, content);
	await utimes(fullPath, FIXED_MTIME, FIXED_MTIME);
}

async function snapshotDirs(): Promise<string[]> {
	return (await readdir(pluginDir)).filter((e) => e.startsWith(SERVER_SNAPSHOT_PREFIX));
}

/** A pillanatképben lévő testvér fájl tartalma a belépő fájl URL-je alapján */
async function readSibling(entryUrl: string, name: string): Promise<string> {
	return readFile(path.join(path.dirname(fileURLToPath(entryUrl)), name), 'utf8');
}

beforeEach(async () => {
	// Minden teszt saját plugin mappát kap, így a modul memóriabeli cache-e nem ütközik
	tmpRoot = await mkdtemp(path.join(os.tmpdir(), 'server-snapshot-'));
	pluginDir = path.join(tmpRoot, 'racona-work');
	entryPath = path.join(pluginDir, 'server', 'functions.ts');
	await writeFixed('manifest.json', JSON.stringify({ id: 'racona-work', version: '0.8.59' }));
	await writeFixed('server/functions.ts', "export * from './employees.ts';\n");
	await writeFixed('server/employees.ts', 'export const version = 1;\n');
});

afterEach(async () => {
	await rm(tmpRoot, { recursive: true, force: true });
});

describe('resolveServerModuleUrl', () => {
	it('változatlan tartalomnál ugyanazt a pillanatképet használja', async () => {
		const first = await resolveServerModuleUrl(pluginDir, entryPath);
		const second = await resolveServerModuleUrl(pluginDir, entryPath);

		expect(second).toBe(first);
		expect(await snapshotDirs()).toHaveLength(1);
	});

	it('testvér modul változásakor új pillanatképet készít, ha a belépő fájl mtime-ja nem változott', async () => {
		const oldUrl = await resolveServerModuleUrl(pluginDir, entryPath);

		// Csak az employees.ts változik, a functions.ts érintetlen (azonos mtime)
		await writeFixed('server/employees.ts', 'export const version = 2; // isExternal\n');
		const newUrl = await resolveServerModuleUrl(pluginDir, entryPath);

		expect(newUrl).not.toBe(oldUrl);
		expect(await readSibling(newUrl, 'employees.ts')).toContain('version = 2');
		// A régi pillanatkép törlődik
		expect(await snapshotDirs()).toEqual([path.basename(path.dirname(fileURLToPath(newUrl)))]);
	});

	it('azonos méretű és mtime-ú változásnál a manifest verziója jelez', async () => {
		const oldUrl = await resolveServerModuleUrl(pluginDir, entryPath);

		await writeFixed('server/employees.ts', 'export const version = 3;\n');
		await writeFixed('manifest.json', JSON.stringify({ id: 'racona-work', version: '0.8.60' }));
		const newUrl = await resolveServerModuleUrl(pluginDir, entryPath);

		expect(newUrl).not.toBe(oldUrl);
		expect(await readSibling(newUrl, 'employees.ts')).toContain('version = 3');
	});

	it('az almappák fájljait is figyeli', async () => {
		await writeFixed('server/lib/helpers.ts', 'export const a = 1;\n');
		const oldUrl = await resolveServerModuleUrl(pluginDir, entryPath);

		await writeFixed('server/lib/helpers.ts', 'export const a = 1, b = 2;\n');
		const newUrl = await resolveServerModuleUrl(pluginDir, entryPath);

		expect(newUrl).not.toBe(oldUrl);
		expect(await readSibling(newUrl, 'lib/helpers.ts')).toContain('b = 2');
	});

	it('a pillanatkép a plugin mappa testvérmappája, a belépő fájl nevével', async () => {
		const url = await resolveServerModuleUrl(pluginDir, entryPath);
		const snapshotEntry = fileURLToPath(url);

		expect(path.dirname(path.dirname(snapshotEntry))).toBe(pluginDir);
		expect(path.basename(snapshotEntry)).toBe('functions.ts');
	});

	it('hiányzó belépő fájlnál közvetlenül a fájl URL-jét adja', async () => {
		const missing = path.join(pluginDir, 'server', 'missing.js');
		const url = await resolveServerModuleUrl(pluginDir, missing);

		expect(fileURLToPath(url)).toBe(missing);
		expect(await snapshotDirs()).toHaveLength(0);
	});
});

describe('invalidateServerSnapshots', () => {
	it('törli a pillanatképeket, és a következő hívás újra elkészíti őket', async () => {
		const url = await resolveServerModuleUrl(pluginDir, entryPath);
		await mkdir(path.join(pluginDir, `${SERVER_SNAPSHOT_PREFIX}abc.tmp-1-2`));

		await invalidateServerSnapshots(pluginDir);
		expect(await snapshotDirs()).toHaveLength(0);

		// Azonos tartalom → azonos URL, de a mappa újra létrejön (nem a memóriából jön)
		const again = await resolveServerModuleUrl(pluginDir, entryPath);
		expect(again).toBe(url);
		expect(await readSibling(again, 'employees.ts')).toContain('version = 1');
	});

	it('nem létező plugin mappánál nem dob hibát', async () => {
		await expect(
			invalidateServerSnapshots(path.join(tmpRoot, 'nincs-ilyen'))
		).resolves.toBeUndefined();
	});
});
