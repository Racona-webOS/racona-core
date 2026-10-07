#!/usr/bin/env bun
/**
 * Súgó tartalom szinkronizálása
 *
 * A racona-docs-user (Starlight) projekt felhasználói dokumentációját másolja át
 * a Súgó alkalmazásba, ahol build-időben a bundle része lesz.
 *
 * Használat:
 *   bun run scripts/sync-help-docs.ts [racona-docs-user mappa]
 *
 * A forrás alapértelmezetten a racona-core melletti ../racona-docs-user mappa,
 * felülírható argumentummal vagy a RACONA_DOCS_USER_DIR környezeti változóval.
 *
 * Mit csinál:
 *   1. Törli és újraírja az apps/web/src/apps/help/content mappát
 *   2. Átmásolja a src/content/docs/<locale>/user/** markdown fájlokat
 *   3. Átmásolja a markdownban hivatkozott képeket (src/assets/**)
 *   4. Legenerálja a toc.json tartalomjegyzéket (cím, sorrend, csoportok)
 */

import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parseHelpFrontmatter } from '../apps/web/src/apps/help/utils/frontmatter';

// ─── Konfiguráció ───────────────────────────────────────────────

const ROOT = resolve(import.meta.dir, '..');
const TARGET = join(ROOT, 'apps/web/src/apps/help/content');
const LOCALES = ['hu', 'en'];

/**
 * A Starlight sidebar csoportjai (astro.config.mjs). A mappák címe nem a
 * frontmatterből jön, ezért itt tartjuk karban; az order a felső szintű
 * oldalak sidebar.order értékei közé illeszti a csoportot.
 */
const GROUPS: Record<string, { order: number; label: Record<string, string> }> = {
	'desktop-basics': { order: 2, label: { hu: 'A felület használata', en: 'Using the Interface' } },
	'ui-components': { order: 3, label: { hu: 'UI komponensek', en: 'UI Components' } },
	applications: { order: 4, label: { hu: 'Alkalmazások', en: 'Applications' } }
};

// ─── Segédfüggvények ────────────────────────────────────────────

interface TocPage {
	slug: string;
	title: string;
	description?: string;
	order: number;
}

async function listMarkdown(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) files.push(...(await listMarkdown(full)));
		else if (entry.name.endsWith('.md')) files.push(full);
	}
	return files.sort();
}

async function gitCommit(dir: string): Promise<string | null> {
	try {
		const proc = Bun.spawn(['git', 'rev-parse', '--short', 'HEAD'], { cwd: dir, stdout: 'pipe' });
		const out = (await new Response(proc.stdout).text()).trim();
		return (await proc.exited) === 0 && out ? out : null;
	} catch {
		return null;
	}
}

// ─── Fő folyamat ────────────────────────────────────────────────

async function main() {
	const source = resolve(
		process.argv[2] ?? process.env.RACONA_DOCS_USER_DIR ?? join(ROOT, '../racona-docs-user')
	);
	const docsDir = join(source, 'src/content/docs');
	const assetsDir = join(source, 'src/assets');

	if (!existsSync(docsDir)) {
		console.error(`❌ Nem található a dokumentáció: ${docsDir}`);
		process.exit(1);
	}

	console.log(`📚 Forrás: ${source}`);
	await rm(TARGET, { recursive: true, force: true });

	const toc: Record<string, TocPage[]> = {};
	const assets = new Set<string>();

	for (const locale of LOCALES) {
		const localeDir = join(docsDir, locale, 'user');
		if (!existsSync(localeDir)) {
			console.warn(`⚠️  Hiányzó nyelv: ${locale}`);
			continue;
		}

		toc[locale] = [];
		for (const file of await listMarkdown(localeDir)) {
			const rel = relative(localeDir, file);
			const slug = rel.replace(/\.md$/, '').split('\\').join('/');
			const content = await readFile(file, 'utf8');
			const fm = parseHelpFrontmatter(content);

			toc[locale].push({
				slug,
				title: fm.title ?? slug,
				...(fm.description ? { description: fm.description } : {}),
				order: fm.order ?? 999
			});

			// A képhivatkozások az src/assets mappára mutatnak relatív útvonallal
			for (const m of content.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
				const idx = m[1].indexOf('assets/');
				if (idx !== -1) assets.add(m[1].slice(idx + 'assets/'.length));
			}

			const dest = join(TARGET, locale, rel);
			await mkdir(dirname(dest), { recursive: true });
			await writeFile(dest, content);
		}
		console.log(`✅ ${locale}: ${toc[locale].length} oldal`);
	}

	let copied = 0;
	for (const asset of assets) {
		const from = join(assetsDir, asset);
		if (!existsSync(from)) {
			console.warn(`⚠️  Hiányzó kép: ${asset}`);
			continue;
		}
		await mkdir(dirname(join(TARGET, 'assets', asset)), { recursive: true });
		await cp(from, join(TARGET, 'assets', asset));
		copied++;
	}
	console.log(`🖼️  ${copied} kép`);

	const groups = Object.fromEntries(
		Object.entries(GROUPS).map(([dir, g]) => [dir, { order: g.order, label: g.label }])
	);
	await writeFile(
		join(TARGET, 'toc.json'),
		JSON.stringify({ source: await gitCommit(source), groups, pages: toc }, null, '\t') + '\n'
	);
	console.log(`📝 toc.json → ${relative(ROOT, TARGET)}`);
}

await main();
