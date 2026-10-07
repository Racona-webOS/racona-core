/**
 * Súgó tartalom
 *
 * A content mappa a racona-docs-user projektből szinkronizált markdown oldalakat
 * tartalmazza (`bun run help:sync`). Az oldalak build-időben a bundle részei,
 * megnyitáskor töltődnek be lustán.
 *
 * Az oldalak azonosítója (slug) a docs projekt user/ mappájához viszonyított
 * útvonal kiterjesztés nélkül, pl. `applications/settings`, `desktop-basics/index`.
 */

import { Marked, type Tokens } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import type { RawMenuItem } from '$lib/types/menu';
import toc from '../content/toc.json';

/** Ennek a nyelvnek a tartalma jelenik meg, ha a felület nyelvéhez nincs súgó. */
export const DEFAULT_HELP_LOCALE = 'hu';

/** A Súgó app tartalom-komponense, amit a menüpontok betöltenek. */
export const HELP_PAGE_COMPONENT = 'HelpPage';

interface TocPage {
	slug: string;
	title: string;
	description?: string;
	order: number;
}

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
	applications: 'AppWindow'
};

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
 * Egy alkalmazás súgó oldala, ha van: az `applications/<appName>` oldal.
 *
 * @param appName - Az alkalmazás azonosítója (pl. 'settings')
 * @returns Az oldal azonosítója vagy null
 */
export function getAppHelpTopic(appName: string): string | null {
	const slug = `applications/${appName}`;
	return hasHelpTopic(slug) ? slug : null;
}

function pageMenuItem(page: TocPage, icon?: string): RawMenuItem {
	return {
		label: page.title,
		href: `#${page.slug}`,
		icon,
		component: HELP_PAGE_COMPONENT,
		props: { slug: page.slug }
	};
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
	const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

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

function resolveAsset(href: string): string | null {
	const idx = href.indexOf('assets/');
	if (idx === -1) return null;
	return assetUrls[`../content/${href.slice(idx)}`] ?? null;
}

function renderMarkdown(source: string, slug: string, locale: string): string {
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
				const src = resolveAsset(href) ?? (/^https?:/i.test(href) ? href : null);
				if (!src) return '';
				return `<img src="${escapeAttr(src)}" alt="${escapeAttr(text)}" loading="lazy" />`;
			}
		}
	});

	const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
	return DOMPurify.sanitize(marked.parse(body, { async: false }));
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
	const loader = pageLoaders[`../content/${helpLocale}/${slug}.md`];
	if (!page || !loader) return null;

	const source = await loader();
	return {
		slug,
		title: page.title,
		description: page.description,
		html: renderMarkdown(source, slug, helpLocale)
	};
}
