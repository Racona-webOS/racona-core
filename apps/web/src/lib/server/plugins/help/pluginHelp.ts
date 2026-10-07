/**
 * Plugin súgó
 *
 * Egy plugin a csomagjában `help/` mappát hozhat, amit a Súgó alkalmazás jelenít meg:
 *
 *   help/<locale>/index.md        a plugin súgójának főoldala (az ablak ? gombja ide visz)
 *   help/<locale>/**\/*.md         további oldalak (Starlight frontmatter: title, description, sidebar.order)
 *   help/assets/**                képek, a markdownból relatív útvonallal hivatkozva
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { getPluginDir } from '../utils/filesystem';
import { parseHelpFrontmatter } from '$apps/help/utils/frontmatter';
import { appRepository } from '$lib/server/database/repositories';
import type { HelpTocPage, PluginHelpInfo } from '$apps/help/types';

export const PLUGIN_HELP_DIR = 'help';

/** A help/ mappában kiszolgálható fájlok. */
export const PLUGIN_HELP_MIME_TYPES: Record<string, string> = {
	'.md': 'text/markdown; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml'
};

/** A plugin azonosítók formátuma (kebab-case), az útvonalba csak ilyen kerülhet. */
export const PLUGIN_ID_PATTERN = /^[a-z0-9-]+$/;

const LOCALE_DIR_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

/**
 * A plugin help/ mappájának útvonala.
 *
 * @param pluginId - A plugin azonosítója
 */
export function getPluginHelpDir(pluginId: string): string {
	return path.join(getPluginDir(pluginId), PLUGIN_HELP_DIR);
}

async function isDirectory(dir: string): Promise<boolean> {
	try {
		return (await stat(dir)).isDirectory();
	} catch {
		return false;
	}
}

async function listMarkdown(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) files.push(...(await listMarkdown(full)));
		else if (entry.name.endsWith('.md')) files.push(full);
	}
	return files.sort();
}

/**
 * A plugin súgójának tartalomjegyzéke nyelvenként.
 *
 * @param pluginId - A plugin azonosítója
 * @returns Az oldalak nyelvenként, vagy null, ha a pluginnak nincs súgója
 */
export async function readPluginHelpToc(
	pluginId: string
): Promise<Record<string, HelpTocPage[]> | null> {
	const helpDir = getPluginHelpDir(pluginId);
	if (!(await isDirectory(helpDir))) return null;

	const pages: Record<string, HelpTocPage[]> = {};
	for (const entry of await readdir(helpDir, { withFileTypes: true })) {
		if (!entry.isDirectory() || !LOCALE_DIR_PATTERN.test(entry.name)) continue;

		const localeDir = path.join(helpDir, entry.name);
		const list: HelpTocPage[] = [];
		for (const file of await listMarkdown(localeDir)) {
			const slug = path.relative(localeDir, file).replace(/\.md$/, '').split(path.sep).join('/');
			const fm = parseHelpFrontmatter(await readFile(file, 'utf8'));
			list.push({
				slug,
				title: fm.title ?? slug,
				...(fm.description ? { description: fm.description } : {}),
				order: fm.order ?? (slug === 'index' ? 0 : 999)
			});
		}
		if (list.length > 0) pages[entry.name] = list;
	}

	return Object.keys(pages).length > 0 ? pages : null;
}

/**
 * Egy help/ mappán belüli fájl abszolút útvonala, ha kiszolgálható.
 *
 * Csak a megengedett kiterjesztések, és csak a plugin help/ mappáján belül.
 *
 * @param pluginId - A plugin azonosítója
 * @param filePath - A help/ mappához relatív útvonal (pl. 'hu/index.md', 'assets/kep.png')
 * @returns Az abszolút útvonal, vagy null, ha nem szolgálható ki
 */
export function resolvePluginHelpFile(pluginId: string, filePath: string): string | null {
	const segments = filePath.split('/');
	if (segments.some((s) => !s || s === '.' || s === '..' || s.startsWith('.'))) return null;
	if (!PLUGIN_HELP_MIME_TYPES[path.extname(filePath).toLowerCase()]) return null;

	const helpDir = path.resolve(getPluginHelpDir(pluginId));
	const resolved = path.resolve(helpDir, ...segments);
	return resolved.startsWith(helpDir + path.sep) ? resolved : null;
}

/**
 * A felhasználó számára elérhető pluginek súgója.
 *
 * A hozzáférést ugyanaz dönti el, mint az alkalmazáslistát (szerepkör, csoport,
 * nyilvános app, aktív állapot); csak a help/ mappát hozó pluginek kerülnek bele.
 *
 * @param userId - A felhasználó azonosítója
 * @param locale - A felület nyelve (a plugin nevéhez)
 */
export async function listAccessiblePluginHelp(
	userId: number,
	locale: string
): Promise<PluginHelpInfo[]> {
	const accessible = await appRepository.findAppsForUser(userId, locale);
	const result: PluginHelpInfo[] = [];
	for (const app of accessible) {
		if (!PLUGIN_ID_PATTERN.test(app.appId)) continue;
		const pages = await readPluginHelpToc(app.appId);
		if (!pages) continue;
		result.push({
			pluginId: app.appId,
			title: app.name[locale] || app.name['hu'] || app.name['en'] || app.appId,
			pages
		});
	}
	return result;
}

/**
 * Elérheti-e a felhasználó a plugin súgóját (azaz magát a plugint).
 *
 * @param userId - A felhasználó azonosítója
 * @param pluginId - A plugin azonosítója
 */
export async function canAccessPluginHelp(userId: number, pluginId: string): Promise<boolean> {
	if (!PLUGIN_ID_PATTERN.test(pluginId)) return false;
	return appRepository.canUserAccessApp(userId, pluginId);
}
