/**
 * AI Assistant szerver oldali típusdefiníciók
 *
 * Knowledge Base és dokumentum kezeléshez szükséges interfészek.
 */

/** Támogatott nyelvek a Knowledge Base-ben */
export type KnowledgeBaseLocale = 'hu' | 'en';

/** Dokumentum kategóriák */
export type DocumentCategory = 'user' | 'developer';

/** Egy dokumentum reprezentációja */
export interface Document {
	/** Egyedi azonosító (fájl útvonal alapján) */
	id: string;
	/** Dokumentum címe */
	title: string;
	/** Teljes markdown tartalom */
	content: string;
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
	/** Státusz nyelvenkénti bontásban */
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
	/** Összes dokumentum száma */
	totalDocuments: number;
	/** Összes chunk száma */
	totalChunks: number;
	/** Rendszer indítása óta eltelt idő */
	uptime: number;
}

/** Agent API konfiguráció (már létezik, de referencia) */
export interface AgentApiConfig {
	provider: string;
	apiKey: string;
	modelName?: string;
	baseUrl?: string;
	maxTokens?: number;
	temperature?: string;
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
