/**
 * Súgó tartalom
 *
 * A content mappa a racona-docs-user projektből szinkronizált markdown oldalakat
 * tartalmazza (`bun run help:sync`). Az oldalak build-időben a bundle részei,
 * megnyitáskor töltődnek be lustán.
 *
 * Az oldalak azonosítója (slug) a docs projekt user/ mappájához viszonyított
 * útvonal kiterjesztés nélkül, pl. `applications/settings`, `desktop-basics/index`.
 *
 * A pluginek súgója (a csomag help/ mappája) futásidőben, a szerverről töltődik:
 * ezek azonosítója `plugins/<pluginId>/<útvonal>`, pl. `plugins/racona-work/index`.
 */

import { Marked, type Tokens } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import type { RawMenuItem } from '$lib/types/menu';
import toc from '../content/toc.json';
import type { HelpTocPage, PluginHelpInfo } from '../types';
import { stripHelpFrontmatter } from './frontmatter';
import { findPluginHelp, getPluginHelpList } from './pluginHelp.svelte';

/** Ennek a nyelvnek a tartalma jelenik meg, ha a felület nyelvéhez nincs súgó. */
export const DEFAULT_HELP_LOCALE = 'hu';

/** A Súgó app tartalom-komponense, amit a menüpontok betöltenek. */
export const HELP_PAGE_COMPONENT = 'HelpPage';

type TocPage = HelpTocPage;

interface TocGroup {
	order: number;
	label: Record<string, string>;
}

const pages = toc.pages as Record<string, TocPage[]>;
const groups = toc.groups as Record<string, TocGroup>;

const pageLoaders = import.meta.glob('../content/**/*.md', {
	query: '?raw',
	import: 'default'
}) as Record<string, () => Promise<string>>;

const assetUrls = import.meta.glob('../content/assets/**/*', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

/** Felső szintű oldalak és csoportok menüikonjai (Lucide). */
const MENU_ICONS: Record<string, string> = {
	index: 'BookOpen',
	authentication: 'LogIn',
	troubleshooting: 'Wrench',
	faq: 'CircleHelp',
	'desktop-basics': 'Monitor',
	'ui-components': 'LayoutPanelTop',
	applications: 'AppWindow',
	plugins: 'Puzzle'
};

/** A plugin súgó oldalak azonosítójának előtagja. */
export const PLUGIN_HELP_PREFIX = 'plugins/';

/** A plugin csoportok helye a menüben (az Alkalmazások után). */
const PLUGIN_GROUPS_ORDER = 4.5;

interface PluginSlug {
	pluginId: string;
	/** Az oldal útvonala a plugin súgóján belül (pl. 'index'). */
	path: string;
}

function parsePluginSlug(slug: string): PluginSlug | null {
	if (!slug.startsWith(PLUGIN_HELP_PREFIX)) return null;
	const rest = slug.slice(PLUGIN_HELP_PREFIX.length);
	const idx = rest.indexOf('/');
	if (idx < 1 || idx === rest.length - 1) return null;
	return { pluginId: rest.slice(0, idx), path: rest.slice(idx + 1) };
}

/**
 * A plugin súgójának nyelve: a kért nyelv, ha a plugin hoz hozzá tartalmat,
 * különben az alapértelmezett, végül bármelyik meglévő.
 */
function resolvePluginLocale(plugin: PluginHelpInfo, locale: string): string {
	if (plugin.pages[locale]?.length) return locale;
	if (plugin.pages[DEFAULT_HELP_LOCALE]?.length) return DEFAULT_HELP_LOCALE;
	return Object.keys(plugin.pages)[0];
}

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

/**
 * A megjelenítendő súgó nyelv: a kért nyelv, ha van hozzá tartalom, különben az alapértelmezett.
 *
 * @param locale - A felület nyelve
 * @returns A súgó nyelve
 */
export function resolveHelpLocale(locale: string | undefined): string {
	return locale && pages[locale]?.length ? locale : DEFAULT_HELP_LOCALE;
}

function findPage(slug: string, locale: string): TocPage | undefined {
	const pluginSlug = parsePluginSlug(slug);
	if (pluginSlug) {
		const plugin = findPluginHelp(pluginSlug.pluginId);
		if (!plugin) return undefined;
		const list = plugin.pages[resolvePluginLocale(plugin, locale)];
		return list?.find((p) => p.slug === pluginSlug.path);
	}
	return pages[resolveHelpLocale(locale)]?.find((p) => p.slug === slug);
}

/**
 * Létezik-e az adott súgó oldal.
 *
 * @param slug - Az oldal azonosítója
 * @param locale - A felület nyelve (alapértelmezett: DEFAULT_HELP_LOCALE)
 */
export function hasHelpTopic(slug: string, locale: string = DEFAULT_HELP_LOCALE): boolean {
	return !!findPage(slug, locale);
}

/**
 * Egy alkalmazás súgó oldala, ha van. Beépített appnál az `applications/<appName>`
 * oldal, pluginnál a plugin súgójának főoldala (index, ennek híján az első oldal).
 *
 * @param appName - Az alkalmazás azonosítója (pl. 'settings', 'racona-work')
 * @param locale - A felület nyelve (alapértelmezett: DEFAULT_HELP_LOCALE)
 * @returns Az oldal azonosítója vagy null
 */
export function getAppHelpTopic(
	appName: string,
	locale: string = DEFAULT_HELP_LOCALE
): string | null {
	const slug = `applications/${appName}`;
	if (hasHelpTopic(slug)) return slug;

	const plugin = findPluginHelp(appName);
	if (!plugin) return null;
	const list = [...(plugin.pages[resolvePluginLocale(plugin, locale)] ?? [])].sort(byOrder);
	const entry = list.find((p) => p.slug === 'index') ?? list[0];
	return entry ? `${PLUGIN_HELP_PREFIX}${appName}/${entry.slug}` : null;
}

function pageMenuItem(page: TocPage, icon?: string, slugPrefix = ''): RawMenuItem {
	const slug = slugPrefix + page.slug;
	return {
		label: page.title,
		href: `#${slug}`,
		icon,
		component: HELP_PAGE_COMPONENT,
		props: { slug }
	};
}

/** Pluginenként egy menücsoport, egyetlen oldalnál maga az oldal a plugin nevével. */
function pluginMenuEntries(locale: string): { order: number; item: RawMenuItem }[] {
	const plugins = [...getPluginHelpList()].sort((a, b) => a.title.localeCompare(b.title));
	return plugins.flatMap((plugin, i) => {
		const prefix = `${PLUGIN_HELP_PREFIX}${plugin.pluginId}/`;
		const list = [...(plugin.pages[resolvePluginLocale(plugin, locale)] ?? [])].sort(byOrder);
		if (list.length === 0) return [];
		const order = PLUGIN_GROUPS_ORDER + i / 1000;
		if (list.length === 1) {
			return [
				{
					order,
					item: pageMenuItem({ ...list[0], title: plugin.title }, MENU_ICONS.plugins, prefix)
				}
			];
		}
		return [
			{
				order,
				item: {
					label: plugin.title,
					href: '#',
					icon: MENU_ICONS.plugins,
					children: list.map((p) => pageMenuItem(p, undefined, prefix))
				}
			}
		];
	});
}

/**
 * A Súgó oldalsáv menüje: a felső szintű oldalak és a mappánkénti csoportok
 * a docs projekt sidebar sorrendjében.
 *
 * @param locale - A súgó nyelve
 */
export function buildHelpMenu(locale: string): RawMenuItem[] {
	const helpLocale = resolveHelpLocale(locale);
	const list = pages[helpLocale] ?? [];

	const entries: { order: number; item: RawMenuItem }[] = list
		.filter((p) => !p.slug.includes('/'))
		.map((p) => ({ order: p.order, item: pageMenuItem(p, MENU_ICONS[p.slug] ?? 'FileText') }));

	for (const [dir, group] of Object.entries(groups)) {
		const children = list
			.filter((p) => p.slug.startsWith(`${dir}/`))
			.sort(byOrder)
			.map((p) => pageMenuItem(p));
		if (children.length === 0) continue;
		entries.push({
			order: group.order,
			item: {
				label: group.label[helpLocale] ?? dir,
				href: '#',
				icon: MENU_ICONS[dir],
				children
			}
		});
	}

	entries.push(...pluginMenuEntries(helpLocale));

	return entries.sort(byOrder).map((e) => e.item);
}

// ─── Hivatkozások ───────────────────────────────────────────────

export type HelpLink =
	| { type: 'internal'; slug: string; anchor?: string }
	| { type: 'external'; href: string }
	| { type: 'broken' };

function dirOf(slug: string): string {
	const idx = slug.lastIndexOf('/');
	return idx === -1 ? '' : slug.slice(0, idx);
}

/** Útvonal-szegmensek összefűzése a `.` és `..` feloldásával (a gyökér fölé nem lép ki). */
function joinPath(base: string, path: string): string[] {
	const segments = base ? base.split('/') : [];
	for (const part of path.split('/')) {
		if (!part || part === '.') continue;
		if (part === '..') segments.pop();
		else segments.push(part);
	}
	return segments;
}

function slugCandidates(segments: string[]): string[] {
	const parts = [...segments];
	if (parts[0] === 'hu' || parts[0] === 'en') parts.shift();
	if (parts[0] === 'user') parts.shift();
	if (parts.length > 0) parts[parts.length - 1] = parts[parts.length - 1].replace(/\.mdx?$/, '');
	const path = parts.join('/');
	return path ? [path, `${path}/index`] : ['index'];
}

/**
 * Egy markdown hivatkozás feloldása súgó oldalra.
 *
 * A docs oldalak URL-jei perjelre végződnek, ezért a Starlightban működő
 * hivatkozások az oldal URL-jéhez képest relatívak. A dokumentációban vannak
 * fájlhoz képest relatív (pl. `./taskbar/`, `./users.md`) hivatkozások is,
 * ezeket második körben próbáljuk.
 *
 * @param href - A hivatkozás a markdownban
 * @param currentSlug - Az aktuális oldal azonosítója
 * @param locale - A súgó nyelve
 */
export function resolveHelpLink(href: string, currentSlug: string, locale: string): HelpLink {
	if (/^(https?:|mailto:)/i.test(href)) return { type: 'external', href };

	const hashIdx = href.indexOf('#');
	const path = hashIdx === -1 ? href : href.slice(0, hashIdx);
	const rawAnchor = hashIdx === -1 ? '' : href.slice(hashIdx + 1);
	let anchor: string | undefined;
	try {
		anchor = rawAnchor ? decodeURIComponent(rawAnchor) : undefined;
	} catch {
		anchor = rawAnchor;
	}

	if (!path) return { type: 'internal', slug: currentSlug, anchor };

	const isIndex = currentSlug === 'index' || currentSlug.endsWith('/index');
	const urlBase = isIndex ? dirOf(currentSlug) : currentSlug;
	const bases = path.startsWith('/') ? [''] : [urlBase, dirOf(currentSlug)];

	for (const base of bases) {
		for (const slug of slugCandidates(joinPath(base, path))) {
			if (findPage(slug, locale)) return { type: 'internal', slug, anchor };
		}
	}
	return { type: 'broken' };
}

// ─── Megjelenítés ───────────────────────────────────────────────

/**
 * Címsor azonosító a Starlight (github-slugger) szabályai szerint, hogy a
 * dokumentáció horgonyai (pl. `#súgó-gomb`) itt is működjenek.
 *
 * @param text - A címsor szövege
 */
export function slugifyHeading(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
		.replace(/ /g, '-');
}

function escapeAttr(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function htmlToText(html: string): string {
	return html
		.replace(/<[^>]*>/g, '')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

type ImageResolver = (href: string) => string | null;

/** A beépített súgó képei a bundle-ből (a docs src/assets mappájára mutató hivatkozások). */
function resolveBundledImage(href: string): string | null {
	const idx = href.indexOf('assets/');
	if (idx === -1) return null;
	return assetUrls[`../content/${href.slice(idx)}`] ?? null;
}

/**
 * Plugin súgó képei: a markdown fájlhoz relatív útvonal a plugin help/ mappáján belül,
 * a szerver /api/plugins/<id>/help/ végpontján keresztül.
 */
function pluginImageResolver(pluginId: string, file: string): ImageResolver {
	return (href) => {
		if (href.startsWith('/') || /^[a-z]+:/i.test(href)) return null;
		const segments = joinPath(dirOf(file), href.split(/[?#]/)[0]);
		if (segments.length === 0) return null;
		return `/api/plugins/${encodeURIComponent(pluginId)}/help/${segments.map(encodeURIComponent).join('/')}`;
	};
}

function renderMarkdown(
	source: string,
	slug: string,
	locale: string,
	resolveImage: ImageResolver
): string {
	const usedIds = new Map<string, number>();

	const marked = new Marked({
		gfm: true,
		renderer: {
			heading({ tokens, depth }: Tokens.Heading) {
				const inner = this.parser.parseInline(tokens);
				const base = slugifyHeading(htmlToText(inner));
				const count = usedIds.get(base) ?? 0;
				usedIds.set(base, count + 1);
				const id = count === 0 ? base : `${base}-${count}`;
				return `<h${depth} id="${escapeAttr(id)}">${inner}</h${depth}>\n`;
			},
			link({ href, tokens }: Tokens.Link) {
				const inner = this.parser.parseInline(tokens);
				const target = resolveHelpLink(href, slug, locale);
				if (target.type === 'external') {
					return `<a href="${escapeAttr(target.href)}" data-help-external>${inner}</a>`;
				}
				if (target.type === 'broken') {
					return `<span class="help-broken-link">${inner}</span>`;
				}
				const anchor = target.anchor ? ` data-help-anchor="${escapeAttr(target.anchor)}"` : '';
				const hash = target.anchor ? `#${target.anchor}` : '';
				return `<a href="#${escapeAttr(target.slug + hash)}" data-help-slug="${escapeAttr(target.slug)}"${anchor}>${inner}</a>`;
			},
			image({ href, text }: Tokens.Image) {
				const src = /^https?:/i.test(href) ? href : resolveImage(href);
				if (!src) return '';
				return `<img src="${escapeAttr(src)}" alt="${escapeAttr(text)}" loading="lazy" />`;
			}
		}
	});

	return DOMPurify.sanitize(marked.parse(stripHelpFrontmatter(source), { async: false }));
}

export interface HelpPageContent {
	slug: string;
	title: string;
	description?: string;
	html: string;
}

/**
 * Súgó oldal betöltése és HTML-lé alakítása.
 *
 * @param slug - Az oldal azonosítója
 * @param locale - A felület nyelve
 * @returns Az oldal tartalma, vagy null, ha nincs ilyen oldal
 */
export async function loadHelpPage(slug: string, locale: string): Promise<HelpPageContent | null> {
	const helpLocale = resolveHelpLocale(locale);
	const page = findPage(slug, helpLocale);
	if (!page) return null;

	const pluginSlug = parsePluginSlug(slug);
	if (pluginSlug) return loadPluginHelpPage(pluginSlug, slug, page, helpLocale);

	const loader = pageLoaders[`../content/${helpLocale}/${slug}.md`];
	if (!loader) return null;
	const source = await loader();
	return {
		slug,
		title: page.title,
		description: page.description,
		html: renderMarkdown(source, slug, helpLocale, resolveBundledImage)
	};
}

async function loadPluginHelpPage(
	pluginSlug: PluginSlug,
	slug: string,
	page: TocPage,
	locale: string
): Promise<HelpPageContent | null> {
	const plugin = findPluginHelp(pluginSlug.pluginId);
	if (!plugin) return null;

	// A help/ mappán belüli fájl, pl. hu/index.md
	const file = `${resolvePluginLocale(plugin, locale)}/${pluginSlug.path}.md`;
	const url = `/api/plugins/${encodeURIComponent(plugin.pluginId)}/help/${file.split('/').map(encodeURIComponent).join('/')}`;
	const response = await fetch(url);
	if (!response.ok) return null;

	return {
		slug,
		title: page.title,
		description: page.description,
		html: renderMarkdown(
			await response.text(),
			slug,
			locale,
			pluginImageResolver(plugin.pluginId, file)
		)
	};
}
