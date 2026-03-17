/**
 * Plugin csomagoló script
 *
 * Összegyűjti a dist/, locales/, assets/ mappákat és a manifest.json-t,
 * majd ZIP archívumba tömöríti .elyospkg kiterjesztéssel.
 *
 * A kiterjesztés a PLUGIN_PACKAGE_EXTENSION környezeti változóból jön
 * (alapértelmezett: elyospkg) — ez az ElyOS szerver konfigurációjával kell egyezzen.
 *
 * Használat: bun run package
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = resolve(import.meta.dir);

// Kiterjesztés env változóból (egyezzen az ElyOS PLUGIN_PACKAGE_EXTENSION értékével)
const PACKAGE_EXTENSION = process.env.PLUGIN_PACKAGE_EXTENSION || 'elyospkg';

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

const outputName = `${id}-${version}.${PACKAGE_EXTENSION}`;
const outputPath = join(ROOT, outputName);

const entries = ['manifest.json', 'dist'];
if (existsSync(join(ROOT, 'locales'))) entries.push('locales');
if (existsSync(join(ROOT, 'assets'))) entries.push('assets');
if (existsSync(join(ROOT, 'menu.json'))) entries.push('menu.json');
if (existsSync(join(ROOT, 'server'))) entries.push('server');

console.log(`📦 Csomagolás: ${outputName}`);
console.log(`   Tartalom: ${entries.join(', ')}`);

const zipArgs = entries.join(' ');
try {
	execSync(`zip -r "${outputPath}" ${zipArgs}`, { cwd: ROOT, stdio: 'inherit' });
	console.log(`\n✅ Csomag elkészült: ${outputName}`);
	console.log(`🚀 Feltölthető az ElyOS Plugin Manager-be`);
} catch {
	console.error('❌ ZIP létrehozása sikertelen — ellenőrizd, hogy a "zip" parancs elérhető-e');
	process.exit(1);
}
