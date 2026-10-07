import { describe, expect, it } from 'vitest';
import {
	buildHelpMenu,
	getAppHelpTopic,
	loadHelpPage,
	resolveHelpLink,
	resolveHelpLocale,
	slugifyHeading
} from './helpContent';

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
