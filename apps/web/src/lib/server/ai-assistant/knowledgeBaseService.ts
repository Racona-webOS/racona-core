/**
 * KnowledgeBaseService — Intelligens dokumentum keresés fallback támogatással
 *
 * Kezeli a többnyelvű Knowledge Base-t, intelligens keresést biztosít
 * fallback logikával: ha a felhasználó nyelvén nincs elegendő találat,
 * keres a másik nyelven is.
 *
 * Az index egyszer épül fel (első használatkor), utána csak az admin
 * újraindexelés frissíti. Mindenhonnan a getKnowledgeBase() függvénnyel érjük el.
 */

import { join } from 'path';
import { DocumentIndexer } from './documentIndexer.js';
import { countWholeWord, stemVariants, tokenize } from './text.js';
import type {
	DocumentIndex,
	KnowledgeBaseLocale,
	KnowledgeBaseStatus,
	SearchParams,
	SearchResponse,
	SearchResult,
	DocumentChunk,
	DocumentCategory
} from './types.js';

/** Keresési konfiguráció */
const SEARCH_CONFIG = {
	/** Alapértelmezett maximum eredmények száma */
	defaultMaxResults: 5,
	/** Minimum találatok száma az elsődleges nyelven (fallback trigger) */
	minPrimaryResults: 2,
	/** Relevancia küszöb (0-1) */
	relevanceThreshold: 0.02,
	/** Maximum kulcsszavak száma egy lekérdezésben */
	maxQueryKeywords: 40,
	/** Ennél hosszabb kulcsszó az ugyanígy kezdődő indexelt szavakra is keres (módosít → módosítás) */
	minPrefixLength: 5,
	/** Egy kulcsszóhoz legfeljebb ennyi prefixes egyezés */
	maxPrefixMatches: 10
} as const;

const LOCALES: KnowledgeBaseLocale[] = ['hu', 'en'];

/** Szinonima csoportok — egy csoport bármelyik szava a csoport összes szavára keres */
const SYNONYM_GROUPS: string[][] = [
	// Módosítás
	[
		'módosítani',
		'beállítani',
		'változtatni',
		'szerkeszteni',
		'állítani',
		'megváltoztatni',
		'cserélni'
	],
	// Háttérkép és megjelenés
	['háttérkép', 'háttér', 'background', 'wallpaper', 'kép', 'image'],
	['téma', 'theme', 'megjelenés', 'kinézet', 'design', 'stílus'],
	// Felhasználó és fiók
	['felhasználó', 'user', 'fiók', 'account', 'profil'],
	// Biztonság
	['jelszó', 'password', 'kód'],
	['biztonság', 'security', 'védelem', 'biztonságos'],
	// Plugin és bővítmények
	['plugin', 'bővítmény', 'kiegészítő', 'addon', 'extension'],
	// Alkalmazás
	['alkalmazás', 'app', 'program', 'szoftver'],
	// Bejelentkezés
	['bejelentkezés', 'login', 'belépés', 'bejelentkezni'],
	['kijelentkezés', 'logout', 'kilépés', 'kijelentkezni'],
	// Beállítások
	['beállítás', 'beállítások', 'setting', 'konfiguráció', 'config', 'opció'],
	// Asztal
	['asztal', 'desktop', 'munkaasztal']
];

const SYNONYMS = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
	for (const word of group) {
		SYNONYMS.set(word, group);
	}
}

/**
 * A tudásbázis mappája. A futtatási könyvtárhoz relatív, mint az uploads:
 * fejlesztéskor apps/web/knowledge-base, Dockerben /app/knowledge-base.
 */
export function getKnowledgeBasePath(): string {
	return join(process.cwd(), 'knowledge-base');
}

/**
 * A közös KnowledgeBaseService példány
 */
export function getKnowledgeBase(): KnowledgeBaseService {
	return KnowledgeBaseService.getInstance(getKnowledgeBasePath());
}

export class KnowledgeBaseService {
	private static instance: KnowledgeBaseService | null = null;
	private knowledgeBasePath: string;
	private indexer: DocumentIndexer;
	private indexes: Map<KnowledgeBaseLocale, DocumentIndex> = new Map();
	private isInitialized = false;
	private initializationPromise: Promise<void> | null = null;
	private startTime: Date;

	private constructor(knowledgeBasePath: string) {
		this.knowledgeBasePath = knowledgeBasePath;
		this.indexer = new DocumentIndexer(knowledgeBasePath);
		this.startTime = new Date();
	}

	/**
	 * Singleton instance lekérése
	 */
	static getInstance(knowledgeBasePath?: string): KnowledgeBaseService {
		if (!KnowledgeBaseService.instance) {
			if (!knowledgeBasePath) {
				throw new Error(
					'KnowledgeBaseService: knowledgeBasePath szükséges az első inicializáláshoz'
				);
			}
			KnowledgeBaseService.instance = new KnowledgeBaseService(knowledgeBasePath);
		}
		return KnowledgeBaseService.instance;
	}

	/**
	 * Singleton instance resetelése (teszteléshez)
	 */
	static resetInstance(): void {
		KnowledgeBaseService.instance = null;
	}

	/**
	 * Aszinkron inicializálás (első használatkor egyszer fut le)
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized) {
			return;
		}

		if (!this.initializationPromise) {
			this.initializationPromise = this.performInitialization().catch((error) => {
				// Hiba esetén a következő hívás újra próbálkozhat
				this.initializationPromise = null;
				throw error;
			});
		}
		return this.initializationPromise;
	}

	/**
	 * Inicializálás végrehajtása
	 */
	private async performInitialization(): Promise<void> {
		const startTime = Date.now();

		for (const locale of LOCALES) {
			await this.indexLocale(locale);
		}

		this.isInitialized = true;
		const status = this.getStatus();
		console.log(
			`[KnowledgeBaseService] Inicializálva ${Date.now() - startTime}ms alatt (${this.knowledgeBasePath}): ${status.totalDocuments} dokumentum, ${status.totalChunks} chunk`
		);
	}

	/**
	 * Egy nyelv indexelése
	 */
	private async indexLocale(locale: KnowledgeBaseLocale): Promise<void> {
		try {
			const documents = await this.indexer.loadDocuments(locale);
			const index = this.indexer.buildIndex(documents, locale);
			this.indexes.set(locale, index);
		} catch (error) {
			console.error(`[KnowledgeBaseService] Hiba a ${locale} nyelv indexelésekor:`, error);
			// Üres index létrehozása hiba esetén
			this.indexes.set(locale, {
				locale,
				documents: new Map(),
				chunks: new Map(),
				keywordIndex: new Map(),
				lastIndexed: new Date(),
				documentCount: 0,
				chunkCount: 0
			});
		}
	}

	/**
	 * Intelligens keresés fallback támogatással
	 */
	async search(params: SearchParams): Promise<SearchResponse> {
		await this.initialize();

		const startTime = Date.now();
		const {
			query,
			userLocale,
			maxResults = SEARCH_CONFIG.defaultMaxResults,
			category,
			enableFallback = true
		} = params;

		const keywords = this.prepareSearchKeywords(query);

		// 1. lépés: Keresés a felhasználó nyelvén
		const primaryResults = this.searchInLocale(keywords, query, userLocale, maxResults, category);

		let allResults = primaryResults;
		let searchStrategy: 'primary-only' | 'primary-with-fallback' = 'primary-only';
		let fallbackResults: SearchResult[] = [];

		// 2. lépés: Fallback keresés ha szükséges
		if (enableFallback && primaryResults.length < SEARCH_CONFIG.minPrimaryResults) {
			const fallbackLocale: KnowledgeBaseLocale = userLocale === 'hu' ? 'en' : 'hu';
			const remainingSlots = maxResults - primaryResults.length;

			if (remainingSlots > 0) {
				fallbackResults = this.searchInLocale(
					keywords,
					query,
					fallbackLocale,
					remainingSlots,
					category
				);
				allResults = [...primaryResults, ...fallbackResults];
				searchStrategy = 'primary-with-fallback';
			}
		}

		// Eredmények rendezése relevancia szerint, végső limitálás, normalizálás 0-1 közé
		const finalResults = allResults
			.sort((a, b) => b.score - a.score)
			.slice(0, maxResults)
			.map((result) => ({ ...result, score: Math.min(result.score, 1.0) }));

		return {
			results: finalResults,
			totalResults: finalResults.length,
			searchTime: Date.now() - startTime,
			primaryLanguageResults: primaryResults.length,
			fallbackLanguageResults: fallbackResults.length,
			searchStrategy
		};
	}

	/**
	 * Keresés egy adott nyelven
	 */
	private searchInLocale(
		keywords: string[],
		query: string,
		locale: KnowledgeBaseLocale,
		maxResults: number,
		category?: DocumentCategory
	): SearchResult[] {
		const index = this.indexes.get(locale);
		if (!index || keywords.length === 0) {
			return [];
		}

		// Chunk-ok pontozása
		const chunkScores = new Map<
			string,
			{ chunk: DocumentChunk; score: number; matchedKeywords: string[] }
		>();

		for (const keyword of this.expandKeywords(keywords, index)) {
			for (const chunkId of index.keywordIndex.get(keyword) ?? []) {
				const chunk = index.chunks.get(chunkId);
				if (!chunk) continue;

				// Kategória szűrés
				if (category && chunk.category !== category) {
					continue;
				}

				let entry = chunkScores.get(chunkId);
				if (!entry) {
					entry = { chunk, score: 0, matchedKeywords: [] };
					chunkScores.set(chunkId, entry);
				}

				entry.score += this.calculateKeywordScore(keyword, chunk, query);
				entry.matchedKeywords.push(keyword);
			}
		}

		return Array.from(chunkScores.values())
			.filter((entry) => entry.score >= SEARCH_CONFIG.relevanceThreshold)
			.sort((a, b) => b.score - a.score)
			.slice(0, maxResults)
			.map((entry) => ({
				chunk: entry.chunk,
				score: entry.score,
				matchedKeywords: [...new Set(entry.matchedKeywords)]
			}));
	}

	/**
	 * Kulcsszavak kiegészítése az indexben velük kezdődő szavakkal
	 */
	private expandKeywords(keywords: string[], index: DocumentIndex): Set<string> {
		const expanded = new Set(keywords);

		for (const keyword of keywords) {
			if (keyword.length < SEARCH_CONFIG.minPrefixLength) continue;

			let matches = 0;
			for (const indexed of index.keywordIndex.keys()) {
				if (indexed !== keyword && indexed.startsWith(keyword)) {
					expanded.add(indexed);
					if (++matches >= SEARCH_CONFIG.maxPrefixMatches) break;
				}
			}
		}

		return expanded;
	}

	/**
	 * Keresési kulcsszavak előkészítése: szavak, szótövek és szinonimák
	 */
	private prepareSearchKeywords(query: string): string[] {
		const keywords = new Set<string>();

		for (const word of tokenize(query)) {
			for (const variant of stemVariants(word)) {
				keywords.add(variant);
				for (const synonym of SYNONYMS.get(variant) ?? []) {
					keywords.add(synonym);
				}
			}
		}

		return Array.from(keywords).slice(0, SEARCH_CONFIG.maxQueryKeywords);
	}

	/**
	 * Kulcsszó pontszám számítása
	 */
	private calculateKeywordScore(keyword: string, chunk: DocumentChunk, query: string): number {
		const content = chunk.content.toLowerCase();
		let score = 0;

		// Pontos egyezés a teljes lekérdezéssel
		if (content.includes(query.toLowerCase().trim())) {
			score += 0.5;
		}

		// A kulcsszó a dokumentum címében vagy címkéi között szerepel
		if (chunk.metaKeywords.includes(keyword)) {
			score += 0.3;
		}

		// Teljes szavas egyezés (magasabb pontszám)
		const exactMatches = countWholeWord(content, keyword);
		if (exactMatches > 0) {
			score += Math.min(exactMatches * 0.15, 0.4);
		} else {
			// Részleges egyezés (ragozott alakok, összetett szavak)
			let count = 0;
			let pos = 0;
			while ((pos = content.indexOf(keyword, pos)) !== -1) {
				count++;
				pos += keyword.length;
			}
			score += Math.min(count * 0.1, 0.25);
		}

		// Pozíció bónusz (ha a kulcsszó a tartalom elején van)
		const firstIndex = content.indexOf(keyword);
		if (firstIndex !== -1) {
			score += Math.max(0, 0.2 - (firstIndex / content.length) * 0.2);
		}

		return score;
	}

	/**
	 * Újraindexelés (admin funkció)
	 */
	async reindex(locale?: KnowledgeBaseLocale): Promise<void> {
		// Ha még nem volt inicializálás, az amúgy is mindent indexel
		if (!this.isInitialized) {
			await this.initialize();
			return;
		}

		for (const loc of locale ? [locale] : LOCALES) {
			await this.indexLocale(loc);
		}
		console.log(`[KnowledgeBaseService] Újraindexelve: ${locale ?? 'összes nyelv'}`);
	}

	/**
	 * Státusz lekérdezés
	 */
	getStatus(): KnowledgeBaseStatus {
		const locales = {
			hu: this.getLocaleStatus('hu'),
			en: this.getLocaleStatus('en')
		} as const;

		return {
			locales,
			totalDocuments: locales.hu.documentCount + locales.en.documentCount,
			totalChunks: locales.hu.chunkCount + locales.en.chunkCount,
			uptime: Date.now() - this.startTime.getTime()
		};
	}

	/**
	 * Egy nyelv státuszának lekérdezése
	 */
	private getLocaleStatus(locale: KnowledgeBaseLocale) {
		const index = this.indexes.get(locale);

		return {
			documentCount: index?.documentCount || 0,
			chunkCount: index?.chunkCount || 0,
			lastIndexed: index?.lastIndexed || null,
			isLoaded: !!index
		};
	}

	/**
	 * Inicializálás állapotának ellenőrzése
	 */
	get initialized(): boolean {
		return this.isInitialized;
	}
}
