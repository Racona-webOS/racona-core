/**
 * Plugin szerver modul pillanatképek
 *
 * A plugin `server/` mappájáról tartalom-ujjlenyomattal jelölt másolatot
 * készít, hogy frissítés után minden szerver modul új URL-ről töltődjön be.
 */

import { createHash } from 'crypto';
import { access, cp, readdir, readFile, rename, rm, stat } from 'fs/promises';
import path from 'path';

/** A pillanatkép-mappák előtagja a plugin könyvtárában (`.server-<ujjlenyomat>`). */
export const SERVER_SNAPSHOT_PREFIX = '.server-';

/** Folyamatban lévő vagy kész pillanatképek: mappa → a mappa, ha elkészült. */
const serverSnapshots = new Map<string, Promise<string>>();

const exists = (p: string) =>
	access(p).then(
		() => true,
		() => false
	);

/**
 * A `server/` mappa és a telepített manifest ujjlenyomata.
 *
 * Minden fájl relatív útvonala, mérete és módosítási ideje bekerül (rekurzívan),
 * plusz a `manifest.json` tartalma. A belépő fájl mtime-ja önmagában nem elég:
 * a telepítő megőrzi a zip-ben tárolt mtime-okat, így ha csak egy testvér modul
 * változik (pl. `server/employees.ts`), a belépő fájl mtime-ja ugyanaz marad.
 * A manifest (verzió) akkor is jelez, ha egy fájl mérete és mtime-ja véletlenül
 * egyezik. Olcsó: csak `stat`, a forrásfájlokat nem olvassa be.
 *
 * @param pluginDir - A plugin könyvtára.
 * @param serverDir - A `server/` mappa.
 * @returns 16 hexa karakteres ujjlenyomat.
 */
export async function computeServerFingerprint(
	pluginDir: string,
	serverDir: string
): Promise<string> {
	const lines: string[] = [];

	const walk = async (dir: string): Promise<void> => {
		for (const entry of await readdir(dir, { withFileTypes: true })) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				await walk(fullPath);
			} else {
				const { size, mtimeMs } = await stat(fullPath);
				lines.push(`${path.relative(serverDir, fullPath)}\0${size}\0${Math.round(mtimeMs)}`);
			}
		}
	};
	await walk(serverDir);
	lines.sort();

	const hash = createHash('sha256');
	try {
		hash.update(await readFile(path.join(pluginDir, 'manifest.json')));
	} catch {
		/* manifest nélkül csak a fájlok számítanak */
	}
	hash.update('\n');
	hash.update(lines.join('\n'));
	return hash.digest('hex').slice(0, 16);
}

/**
 * A plugin szerver moduljának importálható URL-je.
 *
 * A futtatókörnyezet (Node/Bun, dev módban a Vite SSR is) URL szerint
 * gyorsítótárazza a modulokat. Ha csak a belépő fájl kapna új URL-t, az általa
 * importált modulok (pl. `./leave-closing.js`) a régi betöltésből maradnának
 * meg, és frissítés után a régi és az új kód keveredne: egy új modul a régi
 * testvérét kapná, amiből hiányzik egy export. Ezért a `server/` mappát a
 * teljes mappa ujjlenyomatával (lásd `computeServerFingerprint`) jelölt
 * testvérmappába másoljuk (`<plugin>/.server-<ujjlenyomat>/`), és onnan
 * importálunk: minden modul új URL-t kap, ha a `server/` bármely fájlja vagy a
 * manifest változott. Testvérmappa, hogy a `../` és a csomag-importok ugyanoda
 * oldódjanak fel. Ha semmi nem változott, ugyanaz a mappa marad → cache találat.
 *
 * @param pluginDir - A plugin könyvtára.
 * @param entryPath - A belépő fájl (`server/functions.{js,ts}`) útvonala.
 * @returns A pillanatképben lévő belépő fájl `file://` URL-je.
 */
export async function resolveServerModuleUrl(pluginDir: string, entryPath: string): Promise<string> {
	const serverDir = path.dirname(entryPath);
	let fingerprint: string | undefined;
	try {
		await stat(entryPath);
		fingerprint = await computeServerFingerprint(pluginDir, serverDir);
	} catch {
		/* fallback: pillanatkép nélkül, közvetlenül */
	}
	if (!fingerprint) return new URL(`file://${path.resolve(entryPath)}`).href;

	const snapshotDir = path.join(pluginDir, `${SERVER_SNAPSHOT_PREFIX}${fingerprint}`);
	let snapshot = serverSnapshots.get(snapshotDir);
	if (!snapshot) {
		snapshot = createServerSnapshot(pluginDir, serverDir, snapshotDir);
		serverSnapshots.set(snapshotDir, snapshot);
		// Hiba esetén a következő hívás újrapróbálja
		snapshot.catch(() => serverSnapshots.delete(snapshotDir));
	}
	const dir = await snapshot;
	return new URL(`file://${path.resolve(dir, path.basename(entryPath))}`).href;
}

/**
 * A `server/` mappa másolása a pillanatkép-mappába, majd a régi pillanatképek
 * törlése. Ideiglenes néven másol és átnevez, hogy egy párhuzamos kérés (vagy
 * másik folyamat) ne lásson félkész mappát.
 *
 * @param pluginDir - A plugin könyvtára.
 * @param serverDir - A másolandó `server/` mappa.
 * @param snapshotDir - A pillanatkép-mappa.
 * @returns A pillanatkép-mappa.
 */
async function createServerSnapshot(
	pluginDir: string,
	serverDir: string,
	snapshotDir: string
): Promise<string> {
	if (!(await exists(snapshotDir))) {
		const tmpDir = `${snapshotDir}.tmp-${process.pid}-${Date.now()}`;
		await cp(serverDir, tmpDir, { recursive: true });
		try {
			await rename(tmpDir, snapshotDir);
		} catch (err) {
			// Közben egy másik kérés elkészítette: azt használjuk
			await rm(tmpDir, { recursive: true, force: true });
			if (!(await exists(snapshotDir))) throw err;
		}
	}

	// A régi verziók pillanatképei már nem kellenek (a betöltött modulok a memóriában vannak)
	for (const entry of await readdir(pluginDir)) {
		const entryPath = path.join(pluginDir, entry);
		if (
			entry.startsWith(SERVER_SNAPSHOT_PREFIX) &&
			entryPath !== snapshotDir &&
			!entry.includes('.tmp-')
		) {
			await rm(entryPath, { recursive: true, force: true }).catch(() => {});
			serverSnapshots.delete(entryPath);
		}
	}
	return snapshotDir;
}

/**
 * A plugin összes szerver pillanatképének törlése (lemezről és a memóriából).
 *
 * Telepítéskor / frissítéskor hívjuk, hogy a következő remote hívás biztosan
 * a friss `server/` mappáról készítsen pillanatképet, akkor is, ha az
 * ujjlenyomat valamiért egyezne. A félkész (`.tmp-`) mappákat is törli: egy
 * éppen futó másolás ilyenkor hibára fut, és a következő hívás újrapróbálja.
 * Hibát nem dob — a pillanatkép hiánya nem akadályozhatja a telepítést.
 *
 * @param pluginDir - A plugin könyvtára.
 */
export async function invalidateServerSnapshots(pluginDir: string): Promise<void> {
	const resolvedPluginDir = path.resolve(pluginDir);
	for (const key of serverSnapshots.keys()) {
		if (path.resolve(path.dirname(key)) === resolvedPluginDir) serverSnapshots.delete(key);
	}

	let entries: string[];
	try {
		entries = await readdir(pluginDir);
	} catch {
		return;
	}
	for (const entry of entries) {
		if (entry.startsWith(SERVER_SNAPSHOT_PREFIX)) {
			await rm(path.join(pluginDir, entry), { recursive: true, force: true }).catch(() => {});
		}
	}
}
