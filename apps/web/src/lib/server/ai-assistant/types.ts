/**
 * AI Assistant szerver oldali típusdefiníciók
 *
 * Knowledge Base és dokumentum kezeléshez szükséges interfészek.
 */

/** Támogatott nyelvek a Knowledge Base-ben */
export type KnowledgeBaseLocale = 'hu' | 'en';

/** Dokumentum kategóriák */
export type DocumentCategory = 'user' | 'developer';

/** A core tudásbázis forrásazonosítója; a pluginoké a plugin azonosítója */
export const CORE_SOURCE = 'core';

/** Lokalizált szöveg (pl. a plugin neve a manifestből) */
export type LocalizedName = Partial<Record<KnowledgeBaseLocale, string>>;

/** Egy plugin tudásbázisának adatai a prompthoz */
export interface PluginKnowledgeInfo {
	/** Plugin azonosító (egyben az app neve az [APP:...] jelölésben) */
	id: string;
	/** A plugin neve */
	name: LocalizedName;
	/** A plugin menüjének szekciói (href # nélkül) */
	sections: { id: string; label: LocalizedName }[];
}

/** Egy dokumentum reprezentációja */
export interface Document {
	/** Egyedi azonosító (forrás és fájl útvonal alapján) */
	id: string;
	/** Forrás: 'core' vagy a plugin azonosítója */
	source: string;
	/** A forrás neve a dokumentum nyelvén (pluginnál a plugin neve) */
	sourceName?: string;
	/** Dokumentum címe */
	title: string;
	/** Markdown tartalom (frontmatter nélkül) */
	content: string;
	/** Címkék és alternatív nevek a frontmatterből */
	tags: string[];
	/** Fájl útvonal a knowledge-base-ben */
	filePath: string;
	/** Nyelv */
	locale: KnowledgeBaseLocale;
	/** Kategória (user/developer) */
	category: DocumentCategory;
	/** Fájl módosítási ideje */
	lastModified: Date;
}

/** Dokumentum chunk (darabolás után) */
export interface DocumentChunk {
	/** Egyedi chunk azonosító */
	id: string;
	/** Eredeti dokumentum ID */
	documentId: string;
	/** Forrás: 'core' vagy a plugin azonosítója */
	source: string;
	/** A forrás neve a chunk nyelvén (pluginnál a plugin neve) */
	sourceName?: string;
	/** Chunk tartalma */
	content: string;
	/** Chunk pozíciója a dokumentumban */
	startIndex: number;
	/** Chunk vége a dokumentumban */
	endIndex: number;
	/** Dokumentum címe (gyors hozzáféréshez) */
	documentTitle: string;
	/** Dokumentum útvonala (gyors hozzáféréshez) */
	documentPath: string;
	/** A dokumentum címéből és címkéiből képzett kulcsszavak (erősebb súllyal számítanak) */
	metaKeywords: string[];
	/** Nyelv */
	locale: KnowledgeBaseLocale;
	/** Kategória */
	category: DocumentCategory;
}

/** Keresési eredmény egy chunk-hoz */
export interface SearchResult {
	/** A chunk */
	chunk: DocumentChunk;
	/** Relevancia pontszám (0-1) */
	score: number;
	/** Talált kulcsszavak */
	matchedKeywords: string[];
}

/** Dokumentum index egy nyelvhez */
export interface DocumentIndex {
	/** Nyelv */
	locale: KnowledgeBaseLocale;
	/** Összes dokumentum */
	documents: Map<string, Document>;
	/** Összes chunk */
	chunks: Map<string, DocumentChunk>;
	/** Kulcsszó index: kulcsszó -> chunk ID-k */
	keywordIndex: Map<string, string[]>;
	/** Utolsó indexelés ideje */
	lastIndexed: Date;
	/** Indexelt dokumentumok száma */
	documentCount: number;
	/** Indexelt chunk-ok száma */
	chunkCount: number;
}

/** Knowledge Base státusz */
export interface KnowledgeBaseStatus {
	/** A core tudásbázis státusza nyelvenkénti bontásban */
	locales: {
		[K in KnowledgeBaseLocale]: {
			/** Indexelt dokumentumok száma */
			documentCount: number;
			/** Indexelt chunk-ok száma */
			chunkCount: number;
			/** Utolsó indexelés ideje */
			lastIndexed: Date | null;
			/** Index betöltve van-e */
			isLoaded: boolean;
		};
	};
	/** A pluginok tudásbázisai (mindkét nyelv együtt) */
	plugins: {
		id: string;
		name: LocalizedName;
		documentCount: number;
		chunkCount: number;
	}[];
	/** Összes dokumentum száma (core és pluginok) */
	totalDocuments: number;
	/** Összes chunk száma */
	totalChunks: number;
	/** Rendszer indítása óta eltelt idő */
	uptime: number;
}

/** Keresési paraméterek */
export interface SearchParams {
	/** Keresési lekérdezés */
	query: string;
	/** Felhasználó nyelve (elsődleges keresés) */
	userLocale: KnowledgeBaseLocale;
	/** Maximum eredmények száma */
	maxResults?: number;
	/** Kategória szűrő */
	category?: DocumentCategory;
	/** Fallback keresés engedélyezése másik nyelven */
	enableFallback?: boolean;
	/** Csak ezekben a forrásokban keres ('core' és plugin azonosítók); ha nincs megadva, mindben */
	sources?: string[];
}

/** Keresési eredmény */
export interface SearchResponse {
	/** Talált chunk-ok */
	results: SearchResult[];
	/** Összes találat száma */
	totalResults: number;
	/** Keresési idő (ms) */
	searchTime: number;
	/** Elsődleges nyelven talált eredmények száma */
	primaryLanguageResults: number;
	/** Fallback nyelven talált eredmények száma */
	fallbackLanguageResults: number;
	/** Használt keresési stratégia */
	searchStrategy: 'primary-only' | 'primary-with-fallback';
}
