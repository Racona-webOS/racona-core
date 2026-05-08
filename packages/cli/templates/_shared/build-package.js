/**
 * Plugin csomagoló script
 *
 * Összegyűjti a dist/, locales/, assets/ mappákat és a manifest.json-t,
 * majd ZIP archívumba tömöríti .raconapkg kiterjesztéssel.
 *
 * Használat: bun run package
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import AdmZip from 'adm-zip';

const ROOT = resolve(import.meta.dir);

const manifestPath = join(ROOT, 'manifest.json');
if (!existsSync(manifestPath)) {
	console.error('❌ manifest.json nem található');
	process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
const { id, version } = manifest;

if (!id || !version) {
	console.error('❌ A manifest.json-ban hiányzik az "id" vagy "version" mező');
	process.exit(1);
}

const distPath = join(ROOT, 'dist');
if (!existsSync(distPath)) {
	console.error('❌ dist/ mappa nem található — futtasd előbb: bun run build');
	process.exit(1);
}

const outputName = `${id}-${version}.raconapkg`;
const outputPath = join(ROOT, outputName);

const entries = ['manifest.json', 'dist'];
if (existsSync(join(ROOT, 'locales'))) entries.push('locales');
if (existsSync(join(ROOT, 'assets'))) entries.push('assets');
if (existsSync(join(ROOT, 'menu.json'))) entries.push('menu.json');
// A server mappa már a dist-ben van lefordítva, nem kell külön csomagolni
if (existsSync(join(ROOT, 'migrations'))) entries.push('migrations');

// Rekurzív fájl hozzáadás függvény
function addDirectoryToZip(zip, dirPath, zipPath = '') {
	const files = readdirSync(dirPath);
	for (const file of files) {
		const fullPath = join(dirPath, file);
		const zipFilePath = zipPath ? join(zipPath, file) : file;

		// Kihagyjuk a dev seed fájlokat
		if (fullPath.includes('migrations/dev') || fullPath.includes('migrations\\dev')) {
			continue;
		}

		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			addDirectoryToZip(zip, fullPath, zipFilePath);
		} else {
			zip.addLocalFile(fullPath, zipPath);
		}
	}
}

try {
	const zip = new AdmZip();

	// Fájlok és mappák hozzáadása
	for (const entry of entries) {
		const entryPath = join(ROOT, entry);
		if (existsSync(entryPath)) {
			const stat = statSync(entryPath);
			if (stat.isDirectory()) {
				addDirectoryToZip(zip, entryPath, entry);
			} else {
				zip.addLocalFile(entryPath);
			}
		}
	}

	// ZIP mentése
	zip.writeZip(outputPath);
	console.log(`\n✅ Csomag elkészült: ${outputName}`);
} catch (error) {
	console.error('❌ ZIP létrehozása sikertelen:', error.message);
	process.exit(1);
}
