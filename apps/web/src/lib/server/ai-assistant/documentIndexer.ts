/**
 * DocumentIndexer — Dokumentum betöltés és indexelés
 *
 * Rekurzívan betölti a markdown fájlokat a knowledge-base könyvtárból,
 * darabolja őket és építi fel a keresési indexet.
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, relative, basename, extname, resolve } from 'path';
import type {
	Document,
	DocumentChunk,
	DocumentIndex,
	KnowledgeBaseLocale,
	DocumentCategory
} from './types.js';

/** Chunk méret konfigurációja */
const CHUNK_CONFIG = {
	/** Minimum chunk méret karakterekben */
	minSize: 500,
	/** Maximum chunk méret karakterekben */
	maxSize: 1000,
	/** Átfedés chunk-ok között karakterekben */
	overlap: 100
} as const;

/** Kulcsszó extrakció konfigurációja */
const KEYWORD_CONFIG = {
	/** Minimum szó hossz */
	minWordLength: 3,
	/** Maximum kulcsszavak száma chunk-onként */
	maxKeywordsPerChunk: 20,
	/** Kizárt szavak (stop words) */
	stopWords: new Set([
		// Magyar stop words
		'a',
		'az',
		'és',
		'vagy',
		'de',
		'hogy',
		'ha',
		'ez',
		'az',
		'egy',
		'van',
		'volt',
		'lesz',
		'be',
		'ki',
		'el',
		'fel',
		'le',
		'meg',
		'át',
		'össze',
		'szét',
		'vissza',
		'ide',
		'oda',
		'itt',
		'ott',
		'ahol',
		'amikor',
		'amely',
		'amit',
		'aki',
		'akik',
		'amik',
		'amelyek',
		'nem',
		'igen',
		'csak',
		'már',
		'még',
		'is',
		'sem',
		'se',
		'pedig',
		'tehát',
		'így',
		'mint',
		'mintha',
		'mindig',
		'soha',
		'néha',
		'gyakran',
		'ritkán',
		'most',
		'akkor',
		'után',
		'előtt',
		'alatt',
		'felett',
		'mellett',
		'között',
		'nélkül',
		'miatt',
		'helyett',
		// Angol stop words
		'the',
		'a',
		'an',
		'and',
		'or',
		'but',
		'in',
		'on',
		'at',
		'to',
		'for',
		'of',
		'with',
		'by',
		'from',
		'up',
		'about',
		'into',
		'through',
		'during',
		'before',
		'after',
		'above',
		'below',
		'between',
		'among',
		'under',
		'over',
		'out',
		'off',
		'down',
		'upon',
		'near',
		'is',
		'are',
		'was',
		'were',
		'be',
		'been',
		'being',
		'have',
		'has',
		'had',
		'do',
		'does',
		'did',
		'will',
		'would',
		'could',
		'should',
		'may',
		'might',
		'must',
		'can',
		'shall',
		'this',
		'that',
		'these',
		'those',
		'i',
		'you',
		'he',
		'she',
		'it',
		'we',
		'they',
		'me',
		'him',
		'her',
		'us',
		'them',
		'my',
		'your',
		'his',
		'her',
		'its',
		'our',
		'their',
		'not',
		'no',
		'yes',
		'all',
		'any',
		'some',
		'each',
		'every',
		'other',
		'another',
		'such',
		'what',
		'which',
		'who',
		'when',
		'where',
		'why',
		'how',
		'than',
		'so',
		'very'
	])
} as const;

export class DocumentIndexer {
	private knowledgeBasePath: string;

	constructor(knowledgeBasePath: string) {
		this.knowledgeBasePath = knowledgeBasePath;
		console.log('[DocumentIndexer] Konstruktor - knowledgeBasePath:', knowledgeBasePath);
	}

	/**
	 * Betölti az összes dokumentumot egy adott nyelvhez
	 */
	async loadDocuments(locale: KnowledgeBaseLocale): Promise<Document[]> {
		const localePath = join(this.knowledgeBasePath, locale);
		const documents: Document[] = [];

		console.log(`[DocumentIndexer] Dokumentumok betöltése: ${localePath}`);
		console.log(`[DocumentIndexer] Abszolút útvonal: ${resolve(localePath)}`);

		try {
			// Ellenőrizzük, hogy létezik-e a nyelvi mappa
			await stat(localePath);
			console.log(`[DocumentIndexer] Nyelvi mappa létezik: ${localePath}`);
		} catch (error) {
			console.warn(`[DocumentIndexer] Nyelvi mappa nem található: ${localePath}`, error);
			return documents;
		}

		// Rekurzívan betöltjük a dokumentumokat
		await this.loadDocumentsRecursive(localePath, locale, documents);

		console.log(`[DocumentIndexer] Betöltve ${documents.length} dokumentum (${locale})`);
		return documents;
	}

	/**
	 * Rekurzív dokumentum betöltés
	 */
	private async loadDocumentsRecursive(
		dirPath: string,
		locale: KnowledgeBaseLocale,
		documents: Document[]
	): Promise<void> {
		console.log(`[DocumentIndexer] Könyvtár olvasása: ${dirPath}`);
		try {
			const entries = await readdir(dirPath, { withFileTypes: true });
			console.log(
				`[DocumentIndexer] Talált bejegyzések (${entries.length}):`,
				entries.map((e) => e.name)
			);

			for (const entry of entries) {
				const fullPath = join(dirPath, entry.name);

				if (entry.isDirectory()) {
					console.log(`[DocumentIndexer] Almappa feldolgozása: ${fullPath}`);
					// Rekurzív hívás almappákhoz
					await this.loadDocumentsRecursive(fullPath, locale, documents);
				} else if (entry.isFile() && this.isMarkdownFile(entry.name)) {
					console.log(`[DocumentIndexer] Markdown fájl betöltése: ${fullPath}`);
					// Markdown fájl betöltése
					const document = await this.loadDocument(fullPath, locale);
					if (document) {
						documents.push(document);
						console.log(
							`[DocumentIndexer] Dokumentum hozzáadva: ${document.title} (${document.content.length} karakter)`
						);
					} else {
						console.warn(`[DocumentIndexer] Dokumentum betöltése sikertelen: ${fullPath}`);
					}
				} else {
					console.log(`[DocumentIndexer] Fájl kihagyva (nem markdown): ${entry.name}`);
				}
			}
		} catch (error) {
			console.error(`[DocumentIndexer] Hiba a könyvtár olvasásakor: ${dirPath}`, error);
		}
	}

	/**
	 * Egy dokumentum betöltése
	 */
	private async loadDocument(
		filePath: string,
		locale: KnowledgeBaseLocale
	): Promise<Document | null> {
		try {
			const content = await readFile(filePath, 'utf-8');
			const stats = await stat(filePath);

			// Relatív útvonal a knowledge-base-hez képest
			const relativePath = relative(this.knowledgeBasePath, filePath);

			// Kategória meghatározása az útvonal alapján
			const category = this.extractCategory(relativePath);

			// Cím kinyerése a fájlnévből vagy a tartalom első sorából
			const title = this.extractTitle(content, filePath);

			const document: Document = {
				id: relativePath,
				title,
				content: content.trim(),
				filePath: relativePath,
				locale,
				category,
				lastModified: stats.mtime
			};

			return document;
		} catch (error) {
			console.error(`[DocumentIndexer] Hiba a dokumentum betöltésekor: ${filePath}`, error);
			return null;
		}
	}

	/**
	 * Dokumentum darabolása chunk-okra
	 */
	chunkDocument(document: Document): DocumentChunk[] {
		const chunks: DocumentChunk[] = [];
		const content = document.content;

		if (content.length <= CHUNK_CONFIG.maxSize) {
			// Ha a dokumentum elég kicsi, egy chunk-ban hagyjuk
			chunks.push({
				id: `${document.id}:0`,
				documentId: document.id,
				content: content,
				startIndex: 0,
				endIndex: content.length,
				documentTitle: document.title,
				documentPath: document.filePath,
				locale: document.locale,
				category: document.category
			});
			return chunks;
		}

		// Nagyobb dokumentumok darabolása
		let startIndex = 0;
		let chunkIndex = 0;

		while (startIndex < content.length) {
			let endIndex = Math.min(startIndex + CHUNK_CONFIG.maxSize, content.length);

			// Ha nem az utolsó chunk, próbáljunk mondatvégen vagy bekezdésvégen vágni
			if (endIndex < content.length) {
				endIndex = this.findBestCutPoint(content, startIndex, endIndex);
			}

			const chunkContent = content.slice(startIndex, endIndex).trim();

			if (chunkContent.length >= CHUNK_CONFIG.minSize || endIndex === content.length) {
				chunks.push({
					id: `${document.id}:${chunkIndex}`,
					documentId: document.id,
					content: chunkContent,
					startIndex,
					endIndex,
					documentTitle: document.title,
					documentPath: document.filePath,
					locale: document.locale,
					category: document.category
				});
				chunkIndex++;
			}

			// Következő chunk kezdete (átfedéssel)
			startIndex = Math.max(endIndex - CHUNK_CONFIG.overlap, startIndex + 1);
		}

		return chunks;
	}

	/**
	 * Index építése dokumentumokból
	 */
	buildIndex(documents: Document[], locale: KnowledgeBaseLocale): DocumentIndex {
		const documentsMap = new Map<string, Document>();
		const chunksMap = new Map<string, DocumentChunk>();
		const keywordIndex = new Map<string, string[]>();

		// Dokumentumok feldolgozása
		for (const document of documents) {
			documentsMap.set(document.id, document);

			// Chunk-ok létrehozása
			const chunks = this.chunkDocument(document);

			for (const chunk of chunks) {
				chunksMap.set(chunk.id, chunk);

				// Kulcsszavak kinyerése és indexelése
				const keywords = this.extractKeywords(chunk.content);
				for (const keyword of keywords) {
					if (!keywordIndex.has(keyword)) {
						keywordIndex.set(keyword, []);
					}
					keywordIndex.get(keyword)!.push(chunk.id);
				}
			}
		}

		const index: DocumentIndex = {
			locale,
			documents: documentsMap,
			chunks: chunksMap,
			keywordIndex,
			lastIndexed: new Date(),
			documentCount: documentsMap.size,
			chunkCount: chunksMap.size
		};

		console.log(
			`[DocumentIndexer] Index építve (${locale}): ${index.documentCount} dokumentum, ${index.chunkCount} chunk, ${keywordIndex.size} kulcsszó`
		);

		return index;
	}

	/**
	 * Ellenőrzi, hogy a fájl markdown-e
	 */
	private isMarkdownFile(filename: string): boolean {
		const ext = extname(filename).toLowerCase();
		return ext === '.md' || ext === '.mdx';
	}

	/**
	 * Kategória kinyerése az útvonalból
	 */
	private extractCategory(relativePath: string): DocumentCategory {
		if (relativePath.includes('/user/') || relativePath.includes('\\user\\')) {
			return 'user';
		}
		if (relativePath.includes('/developer/') || relativePath.includes('\\developer\\')) {
			return 'developer';
		}
		// Alapértelmezett: user
		return 'user';
	}

	/**
	 * Cím kinyerése a dokumentumból
	 */
	private extractTitle(content: string, filePath: string): string {
		// Első # címsor keresése
		const titleMatch = content.match(/^#\s+(.+)$/m);
		if (titleMatch) {
			return titleMatch[1].trim();
		}

		// Ha nincs címsor, a fájlnév alapján
		const filename = basename(filePath, extname(filePath));
		return filename.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
	}

	/**
	 * Legjobb vágási pont keresése (mondatvég, bekezdésvég)
	 */
	private findBestCutPoint(content: string, startIndex: number, maxEndIndex: number): number {
		const searchStart = Math.max(maxEndIndex - 200, startIndex);
		const searchContent = content.slice(searchStart, maxEndIndex);

		// Bekezdésvég keresése
		const paragraphEnd = searchContent.lastIndexOf('\n\n');
		if (paragraphEnd !== -1) {
			return searchStart + paragraphEnd + 2;
		}

		// Mondatvég keresése
		const sentenceEnd = searchContent.lastIndexOf('. ');
		if (sentenceEnd !== -1) {
			return searchStart + sentenceEnd + 2;
		}

		// Sortörés keresése
		const lineEnd = searchContent.lastIndexOf('\n');
		if (lineEnd !== -1) {
			return searchStart + lineEnd + 1;
		}

		// Ha semmi sem található, az eredeti végpont
		return maxEndIndex;
	}

	/**
	 * Kulcsszavak kinyerése a szövegből
	 */
	private extractKeywords(content: string): string[] {
		// Markdown formázás eltávolítása
		const cleanContent = content
			.replace(/[#*_`\[\]()]/g, ' ') // Markdown karakterek
			.replace(/https?:\/\/[^\s]+/g, ' ') // URL-ek
			.replace(/\s+/g, ' ') // Többszörös szóközök
			.toLowerCase();

		// Szavakra bontás
		const words = cleanContent
			.split(/[^\w\u00C0-\u017F]+/) // Unicode karakterek megtartása (ékezetek)
			.filter(
				(word) =>
					word.length >= KEYWORD_CONFIG.minWordLength &&
					!KEYWORD_CONFIG.stopWords.has(word) &&
					!/^\d+$/.test(word) // Csak számok kizárása
			);

		// Gyakoriság számítás
		const wordFreq = new Map<string, number>();
		for (const word of words) {
			wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
		}

		// Leggyakoribb szavak kiválasztása
		const sortedWords = Array.from(wordFreq.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, KEYWORD_CONFIG.maxKeywordsPerChunk)
			.map(([word]) => word);

		return sortedWords;
	}
}
