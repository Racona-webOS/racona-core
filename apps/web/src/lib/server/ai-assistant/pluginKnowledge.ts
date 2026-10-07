/**
 * Plugin tudásbázisok felderítése
 *
 * Egy plugin a csomagjában `knowledge-base/{hu,en}/*.md` mappát hozhat.
 * Itt olvassuk be a pluginhoz tartozó adatokat, amik a keresés eredményéhez
 * és a prompthoz kellenek: a plugin nevét (manifest) és a menü szekcióit
 * (menu.json, feliratok a locales/ fájlokból).
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import type { KnowledgeBaseLocale, LocalizedName, PluginKnowledgeInfo } from './types.js';

/** A plugin csomagon belüli tudásbázis mappa neve */
export const PLUGIN_KNOWLEDGE_BASE_DIR = 'knowledge-base';

const LOCALES: KnowledgeBaseLocale[] = ['hu', 'en'];

interface MenuItem {
	labelKey?: string;
	href?: string;
	children?: MenuItem[];
}

/**
 * A pluginok mappáinak listája, amelyekben van tudásbázis
 */
export async function listPluginsWithKnowledgeBase(pluginsPath: string): Promise<string[]> {
	let entries;
	try {
		entries = await readdir(pluginsPath, { withFileTypes: true });
	} catch {
		// Nincs még telepített plugin
		return [];
	}

	const result: string[] = [];
	for (const entry of entries) {
		// A .temp és .backups mappák nem pluginok
		if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
		if (await hasKnowledgeBase(join(pluginsPath, entry.name))) {
			result.push(entry.name);
		}
	}
	return result;
}

/**
 * Van-e a plugin mappájában tudásbázis
 */
export async function hasKnowledgeBase(pluginDir: string): Promise<boolean> {
	try {
		return (await stat(join(pluginDir, PLUGIN_KNOWLEDGE_BASE_DIR))).isDirectory();
	} catch {
		return false;
	}
}

/**
 * A plugin neve és menü szekciói. Hiányzó vagy hibás fájlnál üres értékekkel tér vissza.
 */
export async function readPluginInfo(
	pluginDir: string,
	pluginId: string
): Promise<PluginKnowledgeInfo> {
	const manifest = await readJson<{ name?: LocalizedName | string }>(
		join(pluginDir, 'manifest.json')
	);
	const name: LocalizedName =
		typeof manifest?.name === 'string'
			? { hu: manifest.name, en: manifest.name }
			: (manifest?.name ?? {});

	const labels: Partial<Record<KnowledgeBaseLocale, Record<string, unknown>>> = {};
	for (const locale of LOCALES) {
		labels[locale] =
			(await readJson<Record<string, unknown>>(join(pluginDir, 'locales', `${locale}.json`))) ?? {};
	}

	const menu = (await readJson<MenuItem[]>(join(pluginDir, 'menu.json'))) ?? [];
	const sections: PluginKnowledgeInfo['sections'] = [];

	const walk = (items: MenuItem[]) => {
		for (const item of items) {
			const id = item.href?.replace(/^#/, '');
			if (id && item.labelKey) {
				const label: LocalizedName = {};
				for (const locale of LOCALES) {
					const value = labels[locale]?.[item.labelKey];
					if (typeof value === 'string') label[locale] = value;
				}
				sections.push({ id, label });
			}
			if (Array.isArray(item.children)) walk(item.children);
		}
	};
	if (Array.isArray(menu)) walk(menu);

	return { id: pluginId, name, sections };
}

async function readJson<T>(filePath: string): Promise<T | null> {
	try {
		return JSON.parse(await readFile(filePath, 'utf-8')) as T;
	} catch {
		return null;
	}
}
