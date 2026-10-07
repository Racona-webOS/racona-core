/**
 * KnowledgeBaseService — Intelligens dokumentum keresés fallback támogatással
 *
 * Kezeli a többnyelvű Knowledge Base-t, intelligens keresést biztosít
 * fallback logikával: ha a felhasználó nyelvén nincs elegendő találat,
 * keres a másik nyelven is.
 *
 * A tudásbázis forrásokból áll: a core dokumentáció ('core') és a telepített
 * pluginok saját tudásbázisa (forrásazonosító = plugin azonosító). Az index
 * forrásonként és nyelvenként épül, így egy plugin a többi újraindexelése
 * nélkül tölthető be, frissíthető vagy törölhető.
 *
 * Az index egyszer épül fel (első használatkor); a plugin telepítése, frissítése
 * és törlése, valamint az admin újraindexelés frissíti. Mindenhonnan a
 * getKnowledgeBase() függvénnyel érjük el.
 */

import { join } from 'path';
import { DocumentIndexer } from './documentIndexer.js';
import {
	listPluginsWithKnowledgeBase,
	hasKnowledgeBase,
	readPluginInfo,
	PLUGIN_KNOWLEDGE_BASE_DIR
} from './pluginKnowledge.js';
import { countWholeWord, stemVariants, tokenize } from './text.js';
import { CORE_SOURCE } from './types.js';
import type {
	DocumentIndex,
	KnowledgeBaseLocale,
	KnowledgeBaseStatus,
	PluginKnowledgeInfo,
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
	/** Maximum kérdésszavak száma egy lekérdezésben */
	maxQueryTerms: 12,
	/** Szótő (toldalék nélküli alak) súlya az eredeti szóhoz képest */
	stemWeight: 0.9,
	/** Szinonima súlya */
	synonymWeight: 0.7,
	/** Prefixes egyezés súlya (pl. módosít → módosítás) */
	prefixWeight: 0.6,
	/** Legalább ilyen hosszú kulcsszó az ugyanígy kezdődő indexelt szavakra is keres (módosít → módosítás) */
	minPrefixLength: 4,
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
	['asztal', 'desktop', 'munkaasztal'],
	// Jogosultság
	['jog', 'jogosultság', 'jogkör', 'szerep', 'szerepkör', 'képesség', 'permission']
];

/** Egy kérdésszó változatai: kulcsszó → súly */
type SearchTerm = Map<string, number>;

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
 * A telepített pluginok mappája (lásd PLUGIN_DIRS.PLUGINS)
 */
export function getPluginsPath(): string {
	return join(process.cwd(), 'uploads', 'plugins');
}

/**
 * A közös KnowledgeBaseService példány
 */
export function getKnowledgeBase(): KnowledgeBaseService {
	return KnowledgeBaseService.getInstance(getKnowledgeBasePath(), getPluginsPath());
}

/** Egy forrás (core vagy plugin) indexei */
interface KnowledgeSource {
	indexer: DocumentIndexer;
	indexes: Map<KnowledgeBaseLocale, DocumentIndex>;
	/** Csak pluginnál: név és menü szekciók */
	plugin?: PluginKnowledgeInfo;
}

export class KnowledgeBaseService {
	private static instance: KnowledgeBaseService | null = null;
	private knowledgeBasePath: string;
	private pluginsPath: string | null;
	private sources: Map<string, KnowledgeSource> = new Map();
	private isInitialized = false;
	private initializationPromise: Promise<void> | null = null;
	private startTime: Date;

	private constructor(knowledgeBasePath: string, pluginsPath: string | null) {
		this.knowledgeBasePath = knowledgeBasePath;
		this.pluginsPath = pluginsPath;
		this.startTime = new Date();
	}

	/**
	 * Singleton instance lekérése
	 *
	 * @param knowledgeBasePath - A core tudásbázis mappája
	 * @param pluginsPath - A telepített pluginok mappája (null: pluginok nélkül)
	 */
	static getInstance(
		knowledgeBasePath?: string,
		pluginsPath: string | null = null
	): KnowledgeBaseService {
		if (!KnowledgeBaseService.instance) {
			if (!knowledgeBasePath) {
				throw new Error(
					'KnowledgeBaseService: knowledgeBasePath szükséges az első inicializáláshoz'
				);
			}
			KnowledgeBaseService.instance = new KnowledgeBaseService(knowledgeBasePath, pluginsPath);
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
	 * Inicializálás végrehajtása: a core és az összes plugin tudásbázisa
	 */
	private async performInitialization(): Promise<void> {
		const startTime = Date.now();

		await this.loadSource(CORE_SOURCE, new DocumentIndexer(this.knowledgeBasePath));
		await this.syncPlugins();

		this.isInitialized = true;
		const status = this.getStatus();
		console.log(
			`[KnowledgeBaseService] Inicializálva ${Date.now() - startTime}ms alatt (${this.knowledgeBasePath}): ${status.totalDocuments} dokumentum, ${status.totalChunks} chunk, ${status.plugins.length} plugin`
		);
	}

	/**
	 * Egy forrás betöltése (minden nyelv)
	 */
	private async loadSource(
		id: string,
		indexer: DocumentIndexer,
		plugin?: PluginKnowledgeInfo
	): Promise<void> {
		const source: KnowledgeSource = { indexer, indexes: new Map(), plugin };
		for (const locale of LOCALES) {
			source.indexes.set(locale, await this.buildIndex(indexer, locale));
		}
		this.sources.set(id, source);
	}

	/**
	 * Egy nyelv indexelése egy forrásban
	 */
	private async buildIndex(
		indexer: DocumentIndexer,
		locale: KnowledgeBaseLocale
	): Promise<DocumentIndex> {
		try {
			const documents = await indexer.loadDocuments(locale);
			return indexer.buildIndex(documents, locale);
		} catch (error) {
			console.error(`[KnowledgeBaseService] Hiba a ${locale} nyelv indexelésekor:`, error);
			// Üres index létrehozása hiba esetén
			return {
				locale,
				documents: new Map(),
				chunks: new Map(),
				keywordIndex: new Map(),
				lastIndexed: new Date(),
				documentCount: 0,
				chunkCount: 0
			};
		}
	}

	/**
	 * A plugin források igazítása a plugin mappához: újak betöltése,
	 * meglévők újratöltése, eltávolítottak törlése
	 */
	private async syncPlugins(): Promise<void> {
		if (!this.pluginsPath) return;

		const pluginIds = await listPluginsWithKnowledgeBase(this.pluginsPath);
		for (const id of this.sources.keys()) {
			if (id !== CORE_SOURCE && !pluginIds.includes(id)) {
				this.sources.delete(id);
			}
		}
		for (const pluginId of pluginIds) {
			await this.loadPlugin(pluginId);
		}
	}

	/**
	 * Egy plugin tudásbázisának betöltése
	 */
	private async loadPlugin(pluginId: string): Promise<void> {
		if (!this.pluginsPath) return;

		const pluginDir = join(this.pluginsPath, pluginId);
		if (!(await hasKnowledgeBase(pluginDir))) {
			this.sources.delete(pluginId);
			return;
		}

		const info = await readPluginInfo(pluginDir, pluginId);
		const indexer = new DocumentIndexer(
			join(pluginDir, PLUGIN_KNOWLEDGE_BASE_DIR),
			pluginId,
			info.name
		);
		await this.loadSource(pluginId, indexer, info);
	}

	/**
	 * Plugin tudásbázisának (újra)töltése telepítés vagy frissítés után.
	 * Ha az index még nem épült fel, nem csinál semmit: az inicializálás betölti.
	 */
	async reloadPlugin(pluginId: string): Promise<void> {
		if (!this.isInitialized) return;
		await this.loadPlugin(pluginId);
	}

	/**
	 * Plugin tudásbázisának eltávolítása a plugin törlésekor
	 */
	removePlugin(pluginId: string): void {
		if (pluginId !== CORE_SOURCE) {
			this.sources.delete(pluginId);
		}
	}

	/**
	 * A betöltött plugin tudásbázisok adatai (név, menü szekciók)
	 */
	getPlugins(): PluginKnowledgeInfo[] {
		return [...this.sources.values()].flatMap((source) => (source.plugin ? [source.plugin] : []));
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
			enableFallback = true,
			sources
		} = params;

		const terms = this.prepareSearchTerms(query);
		const sourceIds = sources ?? [...this.sources.keys()];

		// 1. lépés: Keresés a felhasználó nyelvén
		const primaryResults = this.searchInLocale(
			terms,
			query,
			userLocale,
			sourceIds,
			maxResults,
			category
		);

		let allResults = primaryResults;
		let searchStrategy: 'primary-only' | 'primary-with-fallback' = 'primary-only';
		let fallbackResults: SearchResult[] = [];

		// 2. lépés: Fallback keresés ha szükséges
		if (enableFallback && primaryResults.length < SEARCH_CONFIG.minPrimaryResults) {
			const fallbackLocale: KnowledgeBaseLocale = userLocale === 'hu' ? 'en' : 'hu';
			const remainingSlots = maxResults - primaryResults.length;

			if (remainingSlots > 0) {
				fallbackResults = this.searchInLocale(
					terms,
					query,
					fallbackLocale,
					sourceIds,
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
	 * Keresés egy adott nyelven a megadott forrásokban.
	 *
	 * Minden kérdésszó (term) egyszer számít egy chunk-nál: a változatai
	 * (szótövek, szinonimák, prefixes egyezések) közül a legjobb. A pontszámot
	 * a kulcsszó ritkasága (IDF) súlyozza, így a jellemző szavak többet érnek,
	 * mint a mindenhol előforduló gyakori szavak.
	 */
	private searchInLocale(
		terms: SearchTerm[],
		query: string,
		locale: KnowledgeBaseLocale,
		sourceIds: string[],
		maxResults: number,
		category?: DocumentCategory
	): SearchResult[] {
		if (terms.length === 0) {
			return [];
		}

		// Chunk-ok pontozása
		const chunkScores = new Map<
			string,
			{ chunk: DocumentChunk; score: number; matchedKeywords: string[] }
		>();

		const indexes = sourceIds.flatMap((sourceId) => {
			const index = this.sources.get(sourceId)?.indexes.get(locale);
			return index && index.chunkCount > 0 ? [index] : [];
		});

		// A ritkaság (IDF) az összes keresett forrás együttes állományán számít,
		// hogy egy kis plugin tudásbázis szavai ne tűnjenek gyakorinak
		const totalChunks = indexes.reduce((sum, index) => sum + index.chunkCount, 0);
		const idf = (keyword: string) => {
			const df = indexes.reduce(
				(sum, index) => sum + (index.keywordIndex.get(keyword)?.length ?? 0),
				0
			);
			return Math.log(1 + totalChunks / Math.max(df, 1));
		};

		for (const index of indexes) {
			for (const term of terms) {
				// chunk ID → a term legjobb egyezése ebben a chunk-ban
				const best = new Map<string, { score: number; keyword: string }>();

				for (const [keyword, weight] of this.expandTerm(term, index)) {
					const chunkIds = index.keywordIndex.get(keyword) ?? [];
					const weightedIdf = weight * idf(keyword);

					for (const chunkId of chunkIds) {
						const chunk = index.chunks.get(chunkId);
						if (!chunk) continue;

						// Kategória szűrés
						if (category && chunk.category !== category) {
							continue;
						}

						const score = this.calculateKeywordScore(keyword, chunk, query) * weightedIdf;
						if (score > (best.get(chunkId)?.score ?? 0)) {
							best.set(chunkId, { score, keyword });
						}
					}
				}

				for (const [chunkId, match] of best) {
					let entry = chunkScores.get(chunkId);
					if (!entry) {
						entry = { chunk: index.chunks.get(chunkId)!, score: 0, matchedKeywords: [] };
						chunkScores.set(chunkId, entry);
					}
					entry.score += match.score;
					entry.matchedKeywords.push(match.keyword);
				}
			}
		}

		return Array.from(chunkScores.values())
			.filter((entry) => entry.score >= SEARCH_CONFIG.relevanceThreshold)
			.sort((a, b) => b.score - a.score)
			.slice(0, maxResults)
			.map((entry) => ({
				chunk: entry.chunk,
				score: entry.score,
				matchedKeywords: entry.matchedKeywords
			}));
	}

	/**
	 * Egy kérdésszó változatai súllyal, kiegészítve az indexben velük kezdődő
	 * szavakkal (kisebb súllyal)
	 */
	private expandTerm(term: SearchTerm, index: DocumentIndex): Map<string, number> {
		const expanded = new Map(term);

		for (const [keyword, weight] of term) {
			if (keyword.length < SEARCH_CONFIG.minPrefixLength) continue;

			let matches = 0;
			for (const indexed of index.keywordIndex.keys()) {
				if (indexed !== keyword && indexed.startsWith(keyword)) {
					const prefixWeight = weight * SEARCH_CONFIG.prefixWeight;
					if (prefixWeight > (expanded.get(indexed) ?? 0)) {
						expanded.set(indexed, prefixWeight);
					}
					if (++matches >= SEARCH_CONFIG.maxPrefixMatches) break;
				}
			}
		}

		return expanded;
	}

	/**
	 * Keresési kifejezések előkészítése: kérdésszavanként a szó, a szótövei
	 * és a szinonimái, súllyal
	 */
	private prepareSearchTerms(query: string): SearchTerm[] {
		const terms: SearchTerm[] = [];
		const seen = new Set<string>();

		for (const word of tokenize(query)) {
			if (seen.has(word)) continue;
			seen.add(word);

			const term: SearchTerm = new Map();
			const add = (keyword: string, weight: number) => {
				if (weight > (term.get(keyword) ?? 0)) term.set(keyword, weight);
			};

			for (const variant of stemVariants(word)) {
				add(variant, variant === word ? 1 : SEARCH_CONFIG.stemWeight);
				for (const synonym of SYNONYMS.get(variant) ?? []) {
					add(synonym, SEARCH_CONFIG.synonymWeight);
				}
			}
			terms.push(term);
		}

		return terms.slice(0, SEARCH_CONFIG.maxQueryTerms);
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
	 * Újraindexelés (admin funkció): a core adott nyelve vagy minden nyelve,
	 * nyelv nélkül a plugin tudásbázisok is (újak, frissek, töröltek)
	 */
	async reindex(locale?: KnowledgeBaseLocale): Promise<void> {
		// Ha még nem volt inicializálás, az amúgy is mindent indexel
		if (!this.isInitialized) {
			await this.initialize();
			return;
		}

		if (locale) {
			for (const source of this.sources.values()) {
				source.indexes.set(locale, await this.buildIndex(source.indexer, locale));
			}
		} else {
			await this.loadSource(CORE_SOURCE, new DocumentIndexer(this.knowledgeBasePath));
			await this.syncPlugins();
		}
		console.log(`[KnowledgeBaseService] Újraindexelve: ${locale ?? 'összes nyelv'}`);
	}

	/**
	 * Státusz lekérdezés
	 */
	getStatus(): KnowledgeBaseStatus {
		const core = this.sources.get(CORE_SOURCE);
		const localeStatus = (locale: KnowledgeBaseLocale) => {
			const index = core?.indexes.get(locale);
			return {
				documentCount: index?.documentCount || 0,
				chunkCount: index?.chunkCount || 0,
				lastIndexed: index?.lastIndexed || null,
				isLoaded: !!index
			};
		};

		const plugins = [...this.sources.values()].flatMap((source) => {
			if (!source.plugin) return [];
			const indexes = [...source.indexes.values()];
			return [
				{
					id: source.plugin.id,
					name: source.plugin.name,
					documentCount: indexes.reduce((sum, index) => sum + index.documentCount, 0),
					chunkCount: indexes.reduce((sum, index) => sum + index.chunkCount, 0)
				}
			];
		});

		const locales = { hu: localeStatus('hu'), en: localeStatus('en') } as const;

		return {
			locales,
			plugins,
			totalDocuments:
				locales.hu.documentCount +
				locales.en.documentCount +
				plugins.reduce((sum, plugin) => sum + plugin.documentCount, 0),
			totalChunks:
				locales.hu.chunkCount +
				locales.en.chunkCount +
				plugins.reduce((sum, plugin) => sum + plugin.chunkCount, 0),
			uptime: Date.now() - this.startTime.getTime()
		};
	}

	/**
	 * Inicializálás állapotának ellenőrzése
	 */
	get initialized(): boolean {
		return this.isInitialized;
	}
}

/**
 * Plugin tudásbázisának újratöltése telepítés, frissítés vagy visszaállítás után.
 * Hiba esetén csak naplóz: a tudásbázis nem akaszthatja meg a plugin kezelését.
 */
export async function reloadPluginKnowledgeBase(pluginId: string): Promise<void> {
	try {
		await getKnowledgeBase().reloadPlugin(pluginId);
	} catch (error) {
		console.error(`[KnowledgeBaseService] Plugin tudásbázis betöltési hiba (${pluginId}):`, error);
	}
}

/**
 * Plugin tudásbázisának eltávolítása a plugin törlésekor
 */
export function removePluginKnowledgeBase(pluginId: string): void {
	getKnowledgeBase().removePlugin(pluginId);
}
