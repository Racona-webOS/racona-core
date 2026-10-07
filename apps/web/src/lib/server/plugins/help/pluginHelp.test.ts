// @vitest-environment node
/**
 * Plugin súgó: tartalomjegyzék olvasása és a kiszolgálható fájlok útvonala.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

let root: string;

vi.mock('../utils/filesystem', () => ({
	getPluginDir: (pluginId: string) => path.join(root, pluginId)
}));
vi.mock('$lib/server/database/repositories', () => ({ appRepository: {} }));

const { readPluginHelpToc, resolvePluginHelpFile } = await import('./pluginHelp');

async function write(file: string, content: string) {
	await mkdir(path.dirname(path.join(root, file)), { recursive: true });
	await writeFile(path.join(root, file), content);
}

beforeAll(async () => {
	root = await mkdtemp(path.join(tmpdir(), 'plugin-help-'));
	await write('demo/help/hu/index.md', '---\ntitle: Demo súgó\n---\n# x');
	await write(
		'demo/help/hu/projects/create.md',
		'---\ntitle: Projekt létrehozása\ndescription: Lépésről lépésre\nsidebar:\n  order: 2\n---\n'
	);
	await write('demo/help/en/index.md', '---\ntitle: Demo help\n---\n');
	await write('demo/help/assets/screen.webp', 'x');
	await write('demo/help/notes.txt', 'x');
	await mkdir(path.join(root, 'nohelp'), { recursive: true });
});

afterAll(async () => {
	await rm(root, { recursive: true, force: true });
});

describe('readPluginHelpToc', () => {
	it('nyelvenként olvassa az oldalakat a frontmatterből', async () => {
		const toc = await readPluginHelpToc('demo');
		expect(Object.keys(toc ?? {}).sort()).toEqual(['en', 'hu']);
		expect(toc?.hu).toEqual([
			{ slug: 'index', title: 'Demo súgó', order: 0 },
			{
				slug: 'projects/create',
				title: 'Projekt létrehozása',
				description: 'Lépésről lépésre',
				order: 2
			}
		]);
	});

	it('help/ mappa nélkül null', async () => {
		expect(await readPluginHelpToc('nohelp')).toBeNull();
		expect(await readPluginHelpToc('nincs-ilyen')).toBeNull();
	});
});

describe('resolvePluginHelpFile', () => {
	it('a help/ mappán belüli markdownt és képet kiszolgálja', () => {
		expect(resolvePluginHelpFile('demo', 'hu/index.md')).toBe(
			path.join(root, 'demo/help/hu/index.md')
		);
		expect(resolvePluginHelpFile('demo', 'assets/screen.webp')).toBe(
			path.join(root, 'demo/help/assets/screen.webp')
		);
	});

	it('kilépést, rejtett fájlt és más kiterjesztést nem enged', () => {
		expect(resolvePluginHelpFile('demo', '../manifest.json')).toBeNull();
		expect(resolvePluginHelpFile('demo', 'hu/../../server/x.md')).toBeNull();
		expect(resolvePluginHelpFile('demo', 'hu/.secret.md')).toBeNull();
		expect(resolvePluginHelpFile('demo', 'notes.txt')).toBeNull();
		expect(resolvePluginHelpFile('demo', '/etc/passwd.md')).toBeNull();
	});
});
