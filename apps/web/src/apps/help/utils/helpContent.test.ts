import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PluginHelpInfo } from '../types';

const pluginIndex: PluginHelpInfo[] = [];
vi.mock('../help.remote', () => ({ getPluginHelpIndex: vi.fn(async () => pluginIndex) }));
import {
	buildHelpMenu,
	getAppHelpTopic,
	loadHelpPage,
	resolveHelpLink,
	resolveHelpLocale,
	slugifyHeading
} from './helpContent';
import { refreshPluginHelp } from './pluginHelp.svelte';

describe('resolveHelpLocale', () => {
	it('a tartalommal rendelkező nyelvet megtartja', () => {
		expect(resolveHelpLocale('en')).toBe('en');
	});

	it('ismeretlen nyelvnél a magyarra esik vissza', () => {
		expect(resolveHelpLocale('de')).toBe('hu');
		expect(resolveHelpLocale(undefined)).toBe('hu');
	});
});

describe('getAppHelpTopic', () => {
	it('a beépített appokhoz az applications/<app> oldalt adja', () => {
		expect(getAppHelpTopic('settings')).toBe('applications/settings');
		expect(getAppHelpTopic('users')).toBe('applications/users');
	});

	it('súgó oldal nélküli appnál null', () => {
		expect(getAppHelpTopic('plugin-manager')).toBeNull();
		expect(getAppHelpTopic('racona-work')).toBeNull();
	});
});

describe('buildHelpMenu', () => {
	it('a docs sidebar sorrendjét követi, a mappák csoportok', () => {
		const menu = buildHelpMenu('hu');
		expect(menu.map((m) => m.href)).toEqual([
			'#index',
			'#authentication',
			'#',
			'#',
			'#',
			'#troubleshooting',
			'#faq'
		]);
		expect(menu.map((m) => m.label).slice(2, 5)).toEqual([
			'A felület használata',
			'UI komponensek',
			'Alkalmazások'
		]);

		const apps = menu[4].children ?? [];
		expect(apps[0]).toMatchObject({ href: '#applications/index', component: 'HelpPage' });
		expect(apps.some((c) => c.href === '#applications/settings')).toBe(true);
	});

	it('angol nyelven angol címeket ad', () => {
		expect(buildHelpMenu('en')[2].label).toBe('Using the Interface');
	});
});

describe('resolveHelpLink', () => {
	it('az oldal URL-jéhez relatív hivatkozást old fel (Starlight)', () => {
		expect(resolveHelpLink('../', 'applications/help', 'hu')).toEqual({
			type: 'internal',
			slug: 'applications/index',
			anchor: undefined
		});
		expect(
			resolveHelpLink('../../desktop-basics/windows/#súgó-gomb', 'applications/help', 'hu')
		).toEqual({
			type: 'internal',
			slug: 'desktop-basics/windows',
			anchor: 'súgó-gomb'
		});
	});

	it('a fájlhoz relatív hivatkozást is feloldja', () => {
		expect(resolveHelpLink('./taskbar/', 'desktop-basics/windows', 'hu')).toMatchObject({
			slug: 'desktop-basics/taskbar'
		});
		expect(resolveHelpLink('./users.md', 'applications/settings', 'hu')).toMatchObject({
			slug: 'applications/users'
		});
	});

	it('index oldalról a mappán belül old fel', () => {
		expect(resolveHelpLink('./desktop-icons/', 'desktop-basics/index', 'hu')).toMatchObject({
			slug: 'desktop-basics/desktop-icons'
		});
	});

	it('kódolt horgonyt dekódol, csak horgonynál az aktuális oldalon marad', () => {
		expect(resolveHelpLink('#s%C3%BAg%C3%B3-gomb', 'desktop-basics/windows', 'hu')).toEqual({
			type: 'internal',
			slug: 'desktop-basics/windows',
			anchor: 'súgó-gomb'
		});
	});

	it('abszolút /user/ útvonalat felold', () => {
		expect(resolveHelpLink('/user/troubleshooting/', 'faq', 'hu')).toMatchObject({
			slug: 'troubleshooting'
		});
	});

	it('külső és nem létező hivatkozásokat megkülönböztet', () => {
		expect(resolveHelpLink('https://www.openstreetmap.org', 'applications/map', 'hu')).toEqual({
			type: 'external',
			href: 'https://www.openstreetmap.org'
		});
		expect(resolveHelpLink('/developer/getting-started/', 'index', 'hu')).toEqual({
			type: 'broken'
		});
	});
});

describe('slugifyHeading', () => {
	it('a github-slugger szabályait követi', () => {
		expect(slugifyHeading('Súgó gomb')).toBe('súgó-gomb');
		expect(slugifyHeading('Alkalmazás megnyitó (GUID hivatkozás)')).toBe(
			'alkalmazás-megnyitó-guid-hivatkozás'
		);
		expect(slugifyHeading('Link gomb (Alkalmazás megosztás)')).toBe(
			'link-gomb-alkalmazás-megosztás'
		);
	});
});

describe('loadHelpPage', () => {
	it('frontmatter nélkül, horgonyokkal és súgón belüli linkekkel renderel', async () => {
		const page = await loadHelpPage('applications/help', 'hu');
		expect(page?.title).toBe('Súgó');
		expect(page?.html).not.toContain('sidebar:');
		expect(page?.html).toContain('data-help-slug="desktop-basics/windows"');
		expect(page?.html).toMatch(/<h2 id="[^"]+">/);
	});

	it('a képeket a bundle-ből oldja fel', async () => {
		const page = await loadHelpPage('desktop-basics/windows', 'hu');
		expect(page?.html).toMatch(/<img src="(?!\.\.)[^"]+"/);
		expect(page?.html).not.toContain('../../../');
	});

	it('nem létező oldalra null', async () => {
		expect(await loadHelpPage('nincs-ilyen', 'hu')).toBeNull();
	});
});

describe('szinkronizált tartalom', () => {
	it('egyik oldalon sincs feloldhatatlan hivatkozás', async () => {
		const broken: string[] = [];
		for (const locale of ['hu', 'en']) {
			const slugs = (buildHelpMenu(locale) ?? []).flatMap((item) =>
				item.children ? item.children.map((c) => c.props?.slug) : [item.props?.slug]
			) as string[];
			for (const slug of slugs) {
				const page = await loadHelpPage(slug, locale);
				for (const m of page?.html.matchAll(/<span class="help-broken-link">(.*?)<\/span>/g) ??
					[]) {
					broken.push(`${locale}/${slug}: ${m[1]}`);
				}
			}
		}
		expect(broken).toEqual([]);
	});
});

describe('plugin súgó', () => {
	beforeAll(async () => {
		pluginIndex.push(
			{
				pluginId: 'demo',
				title: 'Demo plugin',
				pages: {
					hu: [
						{ slug: 'projects/create', title: 'Projekt létrehozása', order: 2 },
						{ slug: 'index', title: 'Áttekintés', order: 0 }
					]
				}
			},
			{
				pluginId: 'mini',
				title: 'Mini plugin',
				pages: { hu: [{ slug: 'intro', title: 'Bevezető', order: 999 }] }
			}
		);
		await refreshPluginHelp();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('a plugin ablakának súgója a plugin főoldala', () => {
		expect(getAppHelpTopic('demo')).toBe('plugins/demo/index');
		expect(getAppHelpTopic('mini')).toBe('plugins/mini/intro');
		// Angolul is a magyar tartalom látszik, ha a plugin nem hoz angolt
		expect(getAppHelpTopic('demo', 'en')).toBe('plugins/demo/index');
	});

	it('a menüben az Alkalmazások után, pluginenként jelenik meg', () => {
		const menu = buildHelpMenu('hu');
		const labels = menu.map((m) => m.label);
		expect(labels.indexOf('Demo plugin')).toBe(labels.indexOf('Alkalmazások') + 1);

		const demo = menu.find((m) => m.label === 'Demo plugin');
		expect(demo?.children?.map((c) => c.href)).toEqual([
			'#plugins/demo/index',
			'#plugins/demo/projects/create'
		]);
		// Egyetlen oldalnál nincs csoport, a menüpont a plugin nevét viseli
		expect(menu.find((m) => m.label === 'Mini plugin')).toMatchObject({
			href: '#plugins/mini/intro',
			component: 'HelpPage'
		});
	});

	it('a plugin oldalai között relatív hivatkozással lehet navigálni', () => {
		expect(resolveHelpLink('./projects/create.md', 'plugins/demo/index', 'hu')).toMatchObject({
			slug: 'plugins/demo/projects/create'
		});
		expect(resolveHelpLink('../index.md', 'plugins/demo/projects/create', 'hu')).toMatchObject({
			slug: 'plugins/demo/index'
		});
		// A beépített súgóra abszolút útvonallal
		expect(
			resolveHelpLink('/hu/user/applications/settings/', 'plugins/demo/index', 'hu')
		).toMatchObject({ slug: 'applications/settings' });
	});

	it('az oldalt és a képeket a plugin súgó végpontjáról tölti', async () => {
		const fetchMock = vi.fn(async () => new Response('# Cím\n\n![Kép](../../assets/screen.webp)'));
		vi.stubGlobal('fetch', fetchMock);

		const page = await loadHelpPage('plugins/demo/projects/create', 'hu');
		expect(fetchMock).toHaveBeenCalledWith('/api/plugins/demo/help/hu/projects/create.md');
		expect(page?.title).toBe('Projekt létrehozása');
		expect(page?.html).toContain('src="/api/plugins/demo/help/assets/screen.webp"');
	});

	it('ismeretlen plugin oldalára null, lekérés nélkül', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		expect(await loadHelpPage('plugins/nincs/index', 'hu')).toBeNull();
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
