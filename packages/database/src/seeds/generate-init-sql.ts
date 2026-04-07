/**
 * ElyOS — Init SQL generátor
 *
 * Egyetlen futtatható SQL fájlt állít elő, amely tartalmazza:
 *   1. Séma létrehozások
 *   2. PostgreSQL extension engedélyezések
 *   3. Drizzle migrációk (táblastruktúra)
 *   4. Seed adatok (topológiai sorrendben)
 *   5. Stored procedures
 *   6. Admin user email beállítása
 *
 * Használat:
 *   bun src/seeds/generate-init-sql.ts
 *   bun src/seeds/generate-init-sql.ts --output=./custom-output.sql
 *   ADMIN_USER_EMAIL=admin@example.com bun src/seeds/generate-init-sql.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { seedConfig, procedureConfig, extensions } from './config';
import drizzleConfig from '../../drizzle.config';

// .env betöltése ha nincs DATABASE_URL
if (!process.env.ADMIN_USER_EMAIL) {
	config({ path: path.resolve(import.meta.dir, '../../../../.env') });
	config({ path: path.resolve(import.meta.dir, '../../../../.env.local') });
}

// Séma lista a drizzle configból
const schemas = (drizzleConfig.schemaFilter as string[])?.filter((s) => s !== 'public') ?? [];

// Drizzle migrációk mappája
const DRIZZLE_DIR = path.resolve(import.meta.dir, '../../drizzle');
const SQL_DIR = path.resolve(import.meta.dir, 'sql');
const PROCEDURES_DIR = path.resolve(import.meta.dir, 'procedures');

/**
 * Drizzle --> statement-breakpoint kommentek eltávolítása
 */
function cleanDrizzleSql(sql: string): string {
	return sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--> statement-breakpoint'))
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/**
 * Topológiai rendezés a seed függőségek alapján
 */
function topologicalSort(): string[] {
	const visited = new Set<string>();
	const result: string[] = [];

	function visit(name: string) {
		if (visited.has(name)) return;
		visited.add(name);
		const seed = seedConfig[name];
		if (!seed) throw new Error(`Ismeretlen seed: ${name}`);
		for (const dep of seed.dependsOn) visit(dep);
		result.push(name);
	}

	for (const name of Object.keys(seedConfig)) visit(name);
	return result;
}

/**
 * Drizzle migrációs fájlok beolvasása sorrendben.
 * Ha a drizzle/ mappa üres vagy nem létezik, lefuttatja a generate-t.
 */
function readMigrations(): string {
	const hasMigrations =
		fs.existsSync(DRIZZLE_DIR) && fs.readdirSync(DRIZZLE_DIR).some((f) => f.endsWith('.sql'));

	if (!hasMigrations) {
		console.log('   ⚠️  Nincs migrációs fájl, drizzle-kit generate futtatása...');
		const dbPackagePath = path.resolve(import.meta.dir, '../..');
		execSync('bun run db:generate', { cwd: dbPackagePath, stdio: 'inherit' });
		console.log('   ✓ Migrációk legenerálva');
	}
	const files = fs
		.readdirSync(DRIZZLE_DIR)
		.filter((f) => f.endsWith('.sql'))
		.sort();

	const parts: string[] = [];
	for (const file of files) {
		const content = fs.readFileSync(path.join(DRIZZLE_DIR, file), 'utf-8');
		parts.push(`-- Migration: ${file}\n${cleanDrizzleSql(content)}`);
	}
	return parts.join('\n\n');
}

/**
 * Seed SQL fájlok beolvasása topológiai sorrendben
 */
function readSeeds(): string {
	const order = topologicalSort();
	const parts: string[] = [];

	for (const name of order) {
		const def = seedConfig[name];
		if (!def) continue;
		const filePath = path.join(SQL_DIR, def.file);
		if (!fs.existsSync(filePath)) {
			console.warn(`   ⚠️  Seed fájl nem található: ${def.file}`);
			continue;
		}
		const content = fs.readFileSync(filePath, 'utf-8').trim();
		const desc = def.description ? ` — ${def.description}` : '';
		parts.push(`-- Seed: ${name}${desc}\n${content}`);
	}
	return parts.join('\n\n');
}

/**
 * Stored procedure fájlok beolvasása
 */
function readProcedures(): string {
	const names = Object.keys(procedureConfig);
	if (names.length === 0) return '';

	const parts: string[] = [];
	for (const name of names) {
		const def = procedureConfig[name];
		if (!def) continue;
		const filePath = path.join(PROCEDURES_DIR, def.file);
		if (!fs.existsSync(filePath)) {
			console.warn(`   ⚠️  Procedure fájl nem található: ${def.file}`);
			continue;
		}
		const content = fs.readFileSync(filePath, 'utf-8').trim();
		const desc = def.description ? ` — ${def.description}` : '';
		parts.push(`-- Procedure: ${name}${desc}\n${content}`);
	}
	return parts.join('\n\n');
}

/**
 * Admin email SQL generálása
 */
function buildAdminEmailSql(): string {
	const adminEmail = process.env.ADMIN_USER_EMAIL?.trim();

	if (adminEmail) {
		return `-- Admin user email beállítása
UPDATE auth.users
SET email = '${adminEmail.replace(/'/g, "''")}'
WHERE id = (SELECT id FROM auth.users ORDER BY id ASC LIMIT 1);`;
	}

	return `-- Admin user email beállítása
-- Cseréld ki az alábbi sort a kívánt admin email címre, majd futtasd le:
-- UPDATE auth.users SET email = 'admin@example.com' WHERE id = (SELECT id FROM auth.users ORDER BY id ASC LIMIT 1);`;
}

/**
 * Fő generáló függvény
 */
function generate(): void {
	const outputArg = process.argv.find((a) => a.startsWith('--output='));
	const outputPath = outputArg
		? path.resolve(outputArg.split('=')[1])
		: path.resolve(import.meta.dir, '../../init.sql');

	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	console.log('     ElyOS — Init SQL generálás');
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

	const timestamp = new Date().toISOString();
	const adminEmail = process.env.ADMIN_USER_EMAIL?.trim();

	const sections: string[] = [];

	// Fejléc
	sections.push(`-- ============================================================
-- ElyOS — Database Init Script
-- Generated: ${timestamp}
-- Admin email: ${adminEmail ?? '(placeholder — lásd lent)'}
--
-- Futtatás:
--   psql -U <user> -d <database> -f init.sql
-- ============================================================`);

	// 1. Sémák
	console.log('🏗️  Sémák hozzáadása...');
	const schemaLines = ['extensions', ...schemas]
		.map((s) => `CREATE SCHEMA IF NOT EXISTS ${s};`)
		.join('\n');
	sections.push(`-- ============================================================
-- 1. Sémák létrehozása
-- ============================================================
${schemaLines}`);

	// 2. Extensions
	console.log('🔌 Extensions hozzáadása...');
	if (extensions.length > 0) {
		const extLines = extensions
			.map((e) => `CREATE EXTENSION IF NOT EXISTS "${e}" SCHEMA extensions;`)
			.join('\n');
		sections.push(`-- ============================================================
-- 2. PostgreSQL extensions
-- ============================================================
${extLines}`);
	}

	// 3. Migrációk
	console.log('📦 Drizzle migrációk beolvasása...');
	const migrations = readMigrations();
	sections.push(`-- ============================================================
-- 3. Táblastruktúra (Drizzle migrációk)
-- ============================================================
${migrations}`);

	// 4. Seed adatok
	console.log('🌱 Seed adatok beolvasása...');
	const seeds = readSeeds();
	sections.push(`-- ============================================================
-- 4. Seed adatok
-- ============================================================
${seeds}`);

	// 5. Stored procedures
	console.log('⚙️  Stored procedures beolvasása...');
	const procedures = readProcedures();
	if (procedures) {
		sections.push(`-- ============================================================
-- 5. Stored procedures
-- ============================================================
${procedures}`);
	}

	// 6. Admin email
	console.log(`👤 Admin email: ${adminEmail ?? '(placeholder)'}`);
	sections.push(`-- ============================================================
-- 6. Admin user email
-- ============================================================
${buildAdminEmailSql()}`);

	// Összefűzés tranzakcióba csomagolva
	const output = `BEGIN;\n\n${sections.join('\n\n')}\n\nCOMMIT;\n`;

	fs.writeFileSync(outputPath, output, 'utf-8');

	console.log(`\n✅ Generálás kész: ${outputPath}`);
	console.log(`   Méret: ${(output.length / 1024).toFixed(1)} KB`);
}

generate();
