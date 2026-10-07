// @vitest-environment node
/**
 * Knowledge Base indexelés és keresés a valódi tudásbázis-fájlokon.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import { KnowledgeBaseService } from '../knowledgeBaseService';
import { DocumentIndexer } from '../documentIndexer';
import { countWholeWord, parseFrontmatter, stemVariants } from '../text';

const KB_PATH = path.resolve(__dirname, '../../../../../knowledge-base');

describe('text segédfüggvények', () => {
	it('ékezetes szavaknál is teljes szóra illeszt', () => {
		expect(countWholeWord('a háttérkép beállítása', 'háttérkép')).toBe(1);
		expect(countWholeWord('háttérképet állíts be', 'háttérkép')).toBe(0);
		expect(countWholeWord('beállítás, beállítás.', 'beállítás')).toBe(2);
	});

	it('a speciális karaktereket escape-eli', () => {
		expect(() => countWholeWord('c++ fordító', 'c++')).not.toThrow();
	});

	it('levágja a gyakori toldalékokat', () => {
		expect(stemVariants('háttérképet')).toContain('háttérkép');
		expect(stemVariants('tálcán')).toEqual(['tálcán']);
	});

	it('leválasztja és értelmezi a frontmattert', () => {
		const { frontmatter, body } = parseFrontmatter(
			'---\ntitle: Beállítások\ntags: [téma, háttér]\naliases: [settings]\n---\n\n# Cím\nSzöveg'
		);
		expect(frontmatter.title).toBe('Beállítások');
		expect(frontmatter.tags).toEqual(['téma', 'háttér']);
		expect(frontmatter.aliases).toEqual(['settings']);
		expect(body.trim().startsWith('# Cím')).toBe(true);
	});
});

describe('DocumentIndexer', () => {
	it('nem hoz létre duplikált chunk-okat a dokumentum végén', () => {
		const indexer = new DocumentIndexer(KB_PATH);
		const content = 'Bekezdés szövege, ami elég hosszú. '.repeat(100);
		const chunks = indexer.chunkDocument({
			id: 'core/teszt.md',
			source: 'core',
			title: 'Teszt',
			content,
			tags: [],
			filePath: 'teszt.md',
			locale: 'hu',
			category: 'user',
			lastModified: new Date()
		});
		// ~3500 karakter, 1000-es darabok 100 átfedéssel → legfeljebb 5 chunk
		expect(chunks.length).toBeLessThanOrEqual(5);
		expect(chunks.at(-1)?.endIndex).toBe(content.length);
	});
});

describe('KnowledgeBaseService', () => {
	let kb: KnowledgeBaseService;

	beforeAll(async () => {
		KnowledgeBaseService.resetInstance();
		kb = KnowledgeBaseService.getInstance(KB_PATH);
		await kb.initialize();
	});

	afterAll(() => {
		KnowledgeBaseService.resetInstance();
	});

	it('betölti a magyar és angol dokumentumokat', () => {
		const status = kb.getStatus();
		expect(status.locales.hu.documentCount).toBeGreaterThan(10);
		expect(status.locales.en.documentCount).toBeGreaterThan(0);
		// Egy dokumentum ~10 KB → legfeljebb néhány tucat chunk, nem több száz
		expect(status.locales.hu.chunkCount).toBeLessThan(status.locales.hu.documentCount * 20);
	});

	it('a chunk tartalma nem tartalmaz frontmattert', async () => {
		const response = await kb.search({ query: 'beállítások', userLocale: 'hu' });
		for (const result of response.results) {
			expect(result.chunk.content.startsWith('---')).toBe(false);
		}
	});

	it('ugyanaz a példány marad, nem indexel újra', () => {
		expect(KnowledgeBaseService.getInstance()).toBe(kb);
	});

	it.each([
		['Hogyan tudom megváltoztatni a háttérképet?', 'apps/settings.md'],
		['Hogyan módosíthatom a jelszavamat?', 'apps/settings.md'],
		['Hogyan telepíthetek bővítményt?', 'apps/plugin-manager.md'],
		['Hol látom a rendszernaplót?', 'apps/log.md'],
		['Hogyan küldhetek üzenetet egy kollégának?', 'apps/chat.md'],
		['felhasználó szerepkör jogosultság', 'apps/users.md']
	])('"%s" → %s a találatok között', async (query, expectedPath) => {
		const response = await kb.search({ query, userLocale: 'hu', maxResults: 5 });
		const paths = response.results.map((r) => r.chunk.documentPath);
		expect(paths.some((p) => p.endsWith(expectedPath))).toBe(true);
	});

	it('angol kérdésre az angol dokumentációból válaszol', async () => {
		const response = await kb.search({
			query: 'How do I change the desktop background?',
			userLocale: 'en'
		});
		expect(response.results.length).toBeGreaterThan(0);
		expect(response.results[0].chunk.locale).toBe('en');
	});
});
