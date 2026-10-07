// @vitest-environment node
/**
 * Plugin tudásbázisok: betöltés, szűrés forrás szerint, újratöltés, törlés,
 * valamint a plugin adatai a rendszerpromptban.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { KnowledgeBaseService } from '../knowledgeBaseService';
import { buildKnowledgeContext, buildSystemPrompt } from '../prompts';
import { CORE_SOURCE } from '../types';

const CORE_KB = path.resolve(__dirname, '../../../../../knowledge-base');
const dirs: string[] = [];

async function writeFiles(root: string, files: Record<string, string>): Promise<void> {
	for (const [name, content] of Object.entries(files)) {
		const filePath = path.join(root, name);
		await mkdir(path.dirname(filePath), { recursive: true });
		await writeFile(filePath, content);
	}
}

const WORK_PLUGIN = {
	'manifest.json': JSON.stringify({ id: 'demo-work', name: { hu: 'Demo Munka', en: 'Demo Work' } }),
	'menu.json': JSON.stringify([
		{ labelKey: 'menu.leave', href: '#leave-requests' },
		{
			labelKey: 'menu.settings',
			href: '#',
			children: [{ labelKey: 'menu.settings.leave', href: '#settings/leave' }]
		}
	]),
	'locales/hu.json': JSON.stringify({
		'menu.leave': 'Szabadságkérelmek',
		'menu.settings.leave': 'Szabadság beállítások'
	}),
	'knowledge-base/hu/szabadsag.md':
		'---\ntitle: Szabadság igénylése\ntags: [szabadság, kérelem]\n---\n\n# Szabadság igénylése\n\nA szabadságkérelmet a Szabadságkérelmek menüpontban adhatod le. A vezetőd jóváhagyja vagy elutasítja.'
};

async function setup(): Promise<{ pluginsPath: string; kb: KnowledgeBaseService }> {
	const pluginsPath = await mkdtemp(path.join(tmpdir(), 'kb-plugins-'));
	dirs.push(pluginsPath);
	await writeFiles(path.join(pluginsPath, 'demo-work'), WORK_PLUGIN);
	// Tudásbázis nélküli plugin és rendszermappa: nem lesz belőlük forrás
	await writeFiles(path.join(pluginsPath, 'no-kb'), { 'manifest.json': '{}' });
	await mkdir(path.join(pluginsPath, '.temp'));

	KnowledgeBaseService.resetInstance();
	const kb = KnowledgeBaseService.getInstance(CORE_KB, pluginsPath);
	await kb.initialize();
	return { pluginsPath, kb };
}

beforeEach(() => {
	KnowledgeBaseService.resetInstance();
});

afterAll(async () => {
	KnowledgeBaseService.resetInstance();
	await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('plugin tudásbázis', () => {
	it('betölti a plugin nevét és menü szekcióit', async () => {
		const { kb } = await setup();

		expect(kb.getPlugins()).toEqual([
			{
				id: 'demo-work',
				name: { hu: 'Demo Munka', en: 'Demo Work' },
				sections: [
					{ id: 'leave-requests', label: { hu: 'Szabadságkérelmek' } },
					{ id: 'settings/leave', label: { hu: 'Szabadság beállítások' } }
				]
			}
		]);
		expect(kb.getStatus().plugins).toEqual([
			expect.objectContaining({ id: 'demo-work', documentCount: 1, chunkCount: 1 })
		]);
	});

	it('csak a megadott forrásokban keres', async () => {
		const { kb } = await setup();
		const query = 'Hogyan igényelhetek szabadságot?';

		const withPlugin = await kb.search({
			query,
			userLocale: 'hu',
			sources: [CORE_SOURCE, 'demo-work']
		});
		expect(withPlugin.results[0].chunk.source).toBe('demo-work');
		expect(withPlugin.results[0].chunk.sourceName).toBe('Demo Munka');

		const coreOnly = await kb.search({ query, userLocale: 'hu', sources: [CORE_SOURCE] });
		expect(coreOnly.results.every((r) => r.chunk.source === CORE_SOURCE)).toBe(true);
	});

	it('újratölti a frissített és eltávolítja a törölt plugin tudásbázisát', async () => {
		const { kb, pluginsPath } = await setup();

		await writeFiles(path.join(pluginsPath, 'demo-work'), {
			'knowledge-base/hu/kikuldetes.md':
				'# Kiküldetés\n\nA kiküldetést a Kiküldetések menüben rögzítheted.'
		});
		await kb.reloadPlugin('demo-work');
		expect(kb.getStatus().plugins[0].documentCount).toBe(2);

		kb.removePlugin('demo-work');
		expect(kb.getPlugins()).toEqual([]);
		const response = await kb.search({ query: 'kiküldetés', userLocale: 'hu' });
		expect(response.results.some((r) => r.chunk.source === 'demo-work')).toBe(false);
	});

	it('a core forrás nem távolítható el', async () => {
		const { kb } = await setup();
		kb.removePlugin(CORE_SOURCE);
		expect(kb.getStatus().locales.hu.documentCount).toBeGreaterThan(0);
	});

	it('az újraindexelés felveszi az újonnan telepített plugint', async () => {
		const { kb, pluginsPath } = await setup();

		await writeFiles(path.join(pluginsPath, 'second'), {
			'manifest.json': JSON.stringify({ name: 'Második' }),
			'knowledge-base/hu/a.md': '# Második plugin\n\nLeírás.'
		});
		await kb.reindex();

		expect(
			kb
				.getPlugins()
				.map((p) => p.id)
				.sort()
		).toEqual(['demo-work', 'second']);
	});
});

describe('promptok', () => {
	const plugin = {
		id: 'demo-work',
		name: { hu: 'Demo Munka', en: 'Demo Work' },
		sections: [{ id: 'settings/leave', label: { hu: 'Szabadság beállítások' } }]
	};

	it('a rendszerprompt felsorolja az elérhető pluginokat és szekcióikat', () => {
		const prompt = buildSystemPrompt('hu', [plugin]);
		expect(prompt).toContain('- demo-work: Demo Munka');
		expect(prompt).toContain('  - settings/leave: Szabadság beállítások');
		expect(prompt).toContain('[APP:demo-work:settings/leave]');
	});

	it('plugin nélkül nem változik a rendszerprompt', () => {
		expect(buildSystemPrompt('hu', [])).toBe(buildSystemPrompt('hu'));
		expect(buildSystemPrompt('hu')).not.toContain('TELEPÍTETT BŐVÍTMÉNYEK');
	});

	it('angol felületen a hiányzó angol feliratnál a magyart használja', () => {
		expect(buildSystemPrompt('en', [plugin])).toContain(
			'  - settings/leave: Szabadság beállítások'
		);
	});

	it('a kontextusban a plugin neve is szerepel', async () => {
		const { kb } = await setup();
		const response = await kb.search({
			query: 'szabadság',
			userLocale: 'hu',
			sources: ['demo-work']
		});
		expect(buildKnowledgeContext(response.results, 'hu')).toContain(
			'[1] Demo Munka › Szabadság igénylése'
		);
	});
});
