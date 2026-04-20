/**
 * KnowledgeBaseService — Intelligens dokumentum keresés fallback támogatással
 *
 * Kezeli a többnyelvű Knowledge Base-t, intelligens keresést biztosít
 * fallback logikával: ha a felhasználó nyelvén nincs elegendő találat,
 * keres a másik nyelven is.
 */

import { join } from 'path';
import { DocumentIndexer } from './documentIndexer.js';
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
	/** Maximum keresési idő (ms) */
	maxSearchTime: 1000,
	/** Relevancia küszöb (0-1) - CSÖKKENTVE a jobb találatokért */
	relevanceThreshold: 0.02
} as const;

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
			console.log('[KnowledgeBaseService] Új instance létrehozása:', knowledgeBasePath);
			KnowledgeBaseService.instance = new KnowledgeBaseService(knowledgeBasePath);
		} else {
			console.log(
				'[KnowledgeBaseService] Meglévő instance használata:',
				KnowledgeBaseService.instance.knowledgeBasePath
			);
		}
		return KnowledgeBaseService.instance;
	}

	/**
	 * Singleton instance resetelése (teszteléshez)
	 */
	static resetInstance(): void {
		console.log('[KnowledgeBaseService] Instance resetelése');
		KnowledgeBaseService.instance = null;
	}

	/**
	 * Szerver induláskor aszinkron inicializálás
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized) {
			return;
		}

		if (this.initializationPromise) {
			return this.initializationPromise;
		}

		this.initializationPromise = this.performInitialization();
		return this.initializationPromise;
	}

	/**
	 * Inicializálás végrehajtása
	 */
	private async performInitialization(): Promise<void> {
		console.log('[KnowledgeBaseService] Inicializálás kezdése...');
		console.log('[KnowledgeBaseService] Knowledge Base útvonal:', this.knowledgeBasePath);
		const startTime = Date.now();

		try {
			// Minden támogatott nyelv indexelése
			const locales: KnowledgeBaseLocale[] = ['hu', 'en'];

			for (const locale of locales) {
				console.log(`[KnowledgeBaseService] ${locale} nyelv indexelése...`);
				await this.indexLocale(locale);
			}

			this.isInitialized = true;
			const duration = Date.now() - startTime;
			console.log(`[KnowledgeBaseService] Inicializálás befejezve ${duration}ms alatt`);

			// Státusz kiírása
			const status = this.getStatus();
			console.log(
				`[KnowledgeBaseService] Összesen: ${status.totalDocuments} dokumentum, ${status.totalChunks} chunk`
			);
		} catch (error) {
			console.error('[KnowledgeBaseService] Inicializálási hiba:', error);
			throw error;
		}
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

		// 1. lépés: Keresés a felhasználó nyelvén
		const primaryResults = this.searchInLocale(query, userLocale, maxResults, category);

		let allResults = primaryResults;
		let searchStrategy: 'primary-only' | 'primary-with-fallback' = 'primary-only';
		let fallbackResults: SearchResult[] = [];

		// 2. lépés: Fallback keresés ha szükséges
		if (enableFallback && primaryResults.length < SEARCH_CONFIG.minPrimaryResults) {
			const fallbackLocale: KnowledgeBaseLocale = userLocale === 'hu' ? 'en' : 'hu';
			const remainingSlots = maxResults - primaryResults.length;

			if (remainingSlots > 0) {
				fallbackResults = this.searchInLocale(query, fallbackLocale, remainingSlots, category);
				allResults = [...primaryResults, ...fallbackResults];
				searchStrategy = 'primary-with-fallback';
			}
		}

		// Eredmények rendezése relevancia szerint
		allResults.sort((a, b) => b.score - a.score);

		// Végső eredmények limitálása
		const finalResults = allResults.slice(0, maxResults);

		const searchTime = Date.now() - startTime;

		return {
			results: finalResults,
			totalResults: finalResults.length,
			searchTime,
			primaryLanguageResults: primaryResults.length,
			fallbackLanguageResults: fallbackResults.length,
			searchStrategy
		};
	}

	/**
	 * Keresés egy adott nyelven
	 */
	private searchInLocale(
		query: string,
		locale: KnowledgeBaseLocale,
		maxResults: number,
		category?: DocumentCategory
	): SearchResult[] {
		const index = this.indexes.get(locale);
		if (!index) {
			return [];
		}

		// Keresési kulcsszavak előkészítése
		const searchKeywords = this.prepareSearchKeywords(query);
		if (searchKeywords.length === 0) {
			return [];
		}

		// Chunk-ok pontozása
		const chunkScores = new Map<
			string,
			{ chunk: DocumentChunk; score: number; matchedKeywords: string[] }
		>();

		for (const keyword of searchKeywords) {
			const chunkIds = index.keywordIndex.get(keyword) || [];

			for (const chunkId of chunkIds) {
				const chunk = index.chunks.get(chunkId);
				if (!chunk) continue;

				// Kategória szűrés
				if (category && chunk.category !== category) {
					continue;
				}

				// Pontszám számítás
				const keywordScore = this.calculateKeywordScore(keyword, chunk.content, query);

				if (!chunkScores.has(chunkId)) {
					chunkScores.set(chunkId, {
						chunk,
						score: 0,
						matchedKeywords: []
					});
				}

				const entry = chunkScores.get(chunkId)!;
				entry.score += keywordScore;
				entry.matchedKeywords.push(keyword);
			}
		}

		// Eredmények konvertálása és szűrése
		const results: SearchResult[] = Array.from(chunkScores.values())
			.filter((entry) => entry.score >= SEARCH_CONFIG.relevanceThreshold)
			.map((entry) => ({
				chunk: entry.chunk,
				score: Math.min(entry.score, 1.0), // Normalizálás 0-1 közé
				matchedKeywords: [...new Set(entry.matchedKeywords)] // Duplikátumok eltávolítása
			}))
			.sort((a, b) => b.score - a.score)
			.slice(0, maxResults);

		return results;
	}

	/**
	 * Keresési kulcsszavak előkészítése
	 */
	private prepareSearchKeywords(query: string): string[] {
		// Magyar stop words (gyakori, nem informatív szavak)
		const stopWords = new Set([
			// Magyar
			'a',
			'az',
			'egy',
			'és',
			'vagy',
			'de',
			'hogy',
			'van',
			'volt',
			'lesz',
			'lehet',
			'tudok',
			'tudom',
			'tudni',
			'tud',
			'kell',
			'kellene',
			'szeretnék',
			'szeretném',
			'akarok',
			'akarom',
			'hogyan',
			'miként',
			'mi',
			'milyen',
			'mikor',
			'hol',
			'hova',
			'honnan',
			'miért',
			'kérdés',
			'válasz',
			'meg',
			'el',
			'fel',
			'le',
			'ki',
			'be',
			'át',
			// Angol
			'the',
			'a',
			'an',
			'and',
			'or',
			'but',
			'is',
			'are',
			'was',
			'were',
			'can',
			'could',
			'would',
			'should',
			'how',
			'what',
			'when',
			'where',
			'why'
		]);

		// Szinonimák (kulcs -> tömb alternatívákkal)
		const synonyms: Record<string, string[]> = {
			// Háttérkép és megjelenés
			módosítani: [
				'beállítani',
				'változtatni',
				'módosítani',
				'szerkeszteni',
				'állítani',
				'megváltoztatni',
				'cserélni'
			],
			beállítani: [
				'módosítani',
				'változtatni',
				'beállítani',
				'szerkeszteni',
				'állítani',
				'megváltoztatni',
				'cserélni'
			],
			változtatni: [
				'módosítani',
				'beállítani',
				'változtatni',
				'szerkeszteni',
				'állítani',
				'megváltoztatni',
				'cserélni'
			],
			megváltoztatni: [
				'módosítani',
				'beállítani',
				'változtatni',
				'szerkeszteni',
				'állítani',
				'megváltoztatni',
				'cserélni'
			],
			cserélni: [
				'módosítani',
				'beállítani',
				'változtatni',
				'szerkeszteni',
				'állítani',
				'megváltoztatni',
				'cserélni'
			],
			szerkeszteni: [
				'módosítani',
				'beállítani',
				'változtatni',
				'szerkeszteni',
				'állítani',
				'megváltoztatni',
				'cserélni'
			],
			állítani: [
				'módosítani',
				'beállítani',
				'változtatni',
				'szerkeszteni',
				'állítani',
				'megváltoztatni',
				'cserélni'
			],
			háttérkép: ['háttér', 'háttérkép', 'background', 'wallpaper', 'kép'],
			háttér: ['háttérkép', 'háttér', 'background', 'kép'],
			kép: ['háttérkép', 'háttér', 'kép', 'image'],

			// Téma és megjelenés
			téma: ['téma', 'theme', 'megjelenés', 'kinézet', 'design', 'stílus'],
			megjelenés: ['téma', 'theme', 'megjelenés', 'kinézet', 'design', 'stílus'],
			kinézet: ['téma', 'theme', 'megjelenés', 'kinézet', 'design', 'stílus'],
			stílus: ['téma', 'theme', 'megjelenés', 'kinézet', 'design', 'stílus'],
			design: ['téma', 'theme', 'megjelenés', 'kinézet', 'design', 'stílus'],

			// Felhasználó és fiók
			felhasználó: ['felhasználó', 'user', 'fiók', 'account', 'profil'],
			fiók: ['felhasználó', 'user', 'fiók', 'account', 'profil'],
			profil: ['felhasználó', 'user', 'fiók', 'account', 'profil'],

			// Biztonság
			jelszó: ['jelszó', 'password', 'jelsző', 'kód'],
			biztonság: ['biztonság', 'security', 'védelem', 'biztonságos'],
			védelem: ['biztonság', 'security', 'védelem', 'biztonságos'],

			// Plugin és bővítmények
			plugin: ['plugin', 'bővítmény', 'kiegészítő', 'addon', 'extension'],
			bővítmény: ['plugin', 'bővítmény', 'kiegészítő', 'addon', 'extension'],
			kiegészítő: ['plugin', 'bővítmény', 'kiegészítő', 'addon', 'extension'],

			// Alkalmazás
			alkalmazás: ['alkalmazás', 'app', 'program', 'szoftver'],
			app: ['alkalmazás', 'app', 'program', 'szoftver'],
			program: ['alkalmazás', 'app', 'program', 'szoftver'],

			// Bejelentkezés
			bejelentkezés: ['bejelentkezés', 'login', 'belépés', 'bejelentkezni'],
			kijelentkezés: ['kijelentkezés', 'logout', 'kilépés', 'kijelentkezni'],
			belépés: ['bejelentkezés', 'login', 'belépés', 'bejelentkezni'],
			kilépés: ['kijelentkezés', 'logout', 'kilépés', 'kijelentkezni'],

			// Beállítások
			beállítás: ['beállítás', 'setting', 'konfiguráció', 'config', 'opció'],
			beállítások: ['beállítás', 'setting', 'konfiguráció', 'config', 'opció', 'beállítások'],
			konfiguráció: ['beállítás', 'setting', 'konfiguráció', 'config', 'opció'],
			opció: ['beállítás', 'setting', 'konfiguráció', 'config', 'opció'],

			// Asztal és desktop
			asztal: ['asztal', 'desktop', 'munkaasztal'],
			desktop: ['asztal', 'desktop', 'munkaasztal'],
			munkaasztal: ['asztal', 'desktop', 'munkaasztal']
		};

		// Szavak kinyerése
		const words = query
			.toLowerCase()
			.replace(/[^\w\u00C0-\u017F\s]/g, ' ') // Csak betűk, számok és ékezetes karakterek
			.split(/\s+/)
			.filter((word) => word.length >= 2)
			.filter((word) => !stopWords.has(word)); // Stop words kiszűrése

		console.log('[KB Search] Eredeti query:', query);
		console.log('[KB Search] Szavak stop words után:', words);

		// Szinonimák hozzáadása + ragozás kezelése
		const expandedKeywords = new Set<string>();
		for (const word of words) {
			expandedKeywords.add(word);

			// Ragozás kezelése: próbáljuk meg a szótövet is
			// pl. "háttérképet" -> "háttérkép", "beállítást" -> "beállítás"
			const possibleStems = [
				word.replace(/et$/, ''), // háttérképet -> háttérkép
				word.replace(/ot$/, ''), // ablakot -> ablak
				word.replace(/at$/, ''), // beállítást -> beállítás (de ez "beállítást" -> "beállíts")
				word.replace(/t$/, ''), // beállítást -> beállítás
				word.replace(/ek$/, ''), // képek -> kép
				word.replace(/ok$/, ''), // ablakok -> ablak
				word.replace(/ak$/, ''), // ablakok -> ablak
				word.replace(/nak$/, ''), // ablaknak -> ablak
				word.replace(/nek$/, ''), // képnek -> kép
				word.replace(/ban$/, ''), // ablakban -> ablak
				word.replace(/ben$/, ''), // képben -> kép
				word.replace(/ból$/, ''), // ablakból -> ablak
				word.replace(/ből$/, ''), // képből -> kép
				word.replace(/ra$/, ''), // ablakra -> ablak
				word.replace(/re$/, ''), // képre -> kép
				word.replace(/val$/, ''), // ablakkal -> ablak
				word.replace(/vel$/, '') // képpel -> kép
			];

			// Minden lehetséges szótőhöz keressük a szinonimákat
			for (const stem of possibleStems) {
				if (stem.length >= 2 && synonyms[stem]) {
					console.log(
						`[KB Search] Szinonimák "${stem}" szótőhöz (eredeti: "${word}"):`,
						synonyms[stem]
					);
					for (const synonym of synonyms[stem]) {
						expandedKeywords.add(synonym);
					}
				}
			}

			// Ha van szinonima a teljes szóhoz, azokat is hozzáadjuk
			if (synonyms[word]) {
				console.log(`[KB Search] Szinonimák "${word}" szóhoz:`, synonyms[word]);
				for (const synonym of synonyms[word]) {
					expandedKeywords.add(synonym);
				}
			}
		}

		const finalKeywords = Array.from(expandedKeywords).slice(0, 20); // 20-ra növelve
		console.log('[KB Search] Végső kulcsszavak:', finalKeywords);

		// Maximum 20 kulcsszó (bővítve a ragozás miatt)
		return finalKeywords;
	}

	/**
	 * Kulcsszó pontszám számítása
	 */
	private calculateKeywordScore(keyword: string, content: string, originalQuery: string): number {
		const lowerContent = content.toLowerCase();
		const lowerQuery = originalQuery.toLowerCase();

		let score = 0;

		// Pontos egyezés a teljes lekérdezéssel
		if (lowerContent.includes(lowerQuery)) {
			score += 0.5;
		}

		// Kulcsszó gyakoriság - JAVÍTVA: részleges egyezés is számít
		// Word boundary helyett includes() használata a magyar ragozás miatt
		const keywordLower = keyword.toLowerCase();

		// Pontos szó egyezés (word boundary-val)
		const exactRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
		const exactMatches = lowerContent.match(exactRegex);
		if (exactMatches) {
			score += Math.min(exactMatches.length * 0.15, 0.4); // Pontos egyezés magasabb pontszám
		}

		// Részleges egyezés (ragozott alakok, összetett szavak)
		// Csak akkor számít, ha nincs pontos egyezés
		if (!exactMatches && lowerContent.includes(keywordLower)) {
			// Számoljuk meg hányszor fordul elő
			let count = 0;
			let pos = 0;
			while ((pos = lowerContent.indexOf(keywordLower, pos)) !== -1) {
				count++;
				pos += keywordLower.length;
			}
			score += Math.min(count * 0.1, 0.25); // Részleges egyezés alacsonyabb pontszám
		}

		// Pozíció bónusz (ha a kulcsszó a tartalom elején van)
		const firstIndex = lowerContent.indexOf(keywordLower);
		if (firstIndex !== -1) {
			const positionBonus = Math.max(0, 0.2 - (firstIndex / lowerContent.length) * 0.2);
			score += positionBonus;
		}

		return score;
	}

	/**
	 * Újraindexelés (admin funkció)
	 */
	async reindex(locale?: KnowledgeBaseLocale): Promise<void> {
		console.log(
			`[KnowledgeBaseService] Újraindexelés kezdése${locale ? ` (${locale})` : ' (összes nyelv)'}...`
		);

		if (locale) {
			await this.indexLocale(locale);
		} else {
			// Összes nyelv újraindexelése
			const locales: KnowledgeBaseLocale[] = ['hu', 'en'];
			for (const loc of locales) {
				await this.indexLocale(loc);
			}
		}

		console.log('[KnowledgeBaseService] Újraindexelés befejezve');
	}

	/**
	 * Státusz lekérdezés
	 */
	getStatus(): KnowledgeBaseStatus {
		const locales = {
			hu: this.getLocaleStatus('hu'),
			en: this.getLocaleStatus('en')
		} as const;

		const totalDocuments = locales.hu.documentCount + locales.en.documentCount;
		const totalChunks = locales.hu.chunkCount + locales.en.chunkCount;
		const uptime = Date.now() - this.startTime.getTime();

		return {
			locales,
			totalDocuments,
			totalChunks,
			uptime
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
