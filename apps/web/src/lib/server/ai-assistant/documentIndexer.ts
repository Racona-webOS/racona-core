/**
 * DocumentIndexer — Dokumentum betöltés és indexelés
 *
 * Rekurzívan betölti a markdown fájlokat a knowledge-base könyvtárból,
 * darabolja őket és építi fel a keresési indexet.
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, relative, basename, extname } from 'path';
import { parseFrontmatter, stemVariants, tokenize } from './text.js';
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

export class DocumentIndexer {
	private knowledgeBasePath: string;

	constructor(knowledgeBasePath: string) {
		this.knowledgeBasePath = knowledgeBasePath;
	}

	/**
	 * Betölti az összes dokumentumot egy adott nyelvhez
	 */
	async loadDocuments(locale: KnowledgeBaseLocale): Promise<Document[]> {
		const localePath = join(this.knowledgeBasePath, locale);
		const documents: Document[] = [];

		try {
			await stat(localePath);
		} catch {
			console.warn(`[DocumentIndexer] Nyelvi mappa nem található: ${localePath}`);
			return documents;
		}

		await this.loadDocumentsRecursive(localePath, locale, documents);
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
		try {
			const entries = await readdir(dirPath, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = join(dirPath, entry.name);

				if (entry.isDirectory()) {
					await this.loadDocumentsRecursive(fullPath, locale, documents);
				} else if (entry.isFile() && this.isMarkdownFile(entry.name)) {
					const document = await this.loadDocument(fullPath, locale);
					if (document) {
						documents.push(document);
					}
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
			const raw = await readFile(filePath, 'utf-8');
			const stats = await stat(filePath);
			const { frontmatter, body } = parseFrontmatter(raw);

			// Relatív útvonal a knowledge-base-hez képest
			const relativePath = relative(this.knowledgeBasePath, filePath);
			const content = body.trim();

			return {
				id: relativePath,
				title: frontmatter.title ?? this.extractTitle(content, filePath),
				content,
				tags: [...frontmatter.tags, ...frontmatter.aliases],
				filePath: relativePath,
				locale,
				category: this.extractCategory(relativePath),
				lastModified: stats.mtime
			};
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
		const metaKeywords = this.extractMetaKeywords(document);

		const makeChunk = (
			index: number,
			text: string,
			startIndex: number,
			endIndex: number
		): DocumentChunk => ({
			id: `${document.id}:${index}`,
			documentId: document.id,
			content: text,
			startIndex,
			endIndex,
			documentTitle: document.title,
			documentPath: document.filePath,
			metaKeywords,
			locale: document.locale,
			category: document.category
		});

		if (content.length <= CHUNK_CONFIG.maxSize) {
			// Ha a dokumentum elég kicsi, egy chunk-ban hagyjuk
			chunks.push(makeChunk(0, content, 0, content.length));
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
				chunks.push(makeChunk(chunkIndex, chunkContent, startIndex, endIndex));
				chunkIndex++;
			}

			if (endIndex === content.length) break;

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

		for (const document of documents) {
			documentsMap.set(document.id, document);

			for (const chunk of this.chunkDocument(document)) {
				chunksMap.set(chunk.id, chunk);

				// A chunk összes szava, a szótövek és a dokumentum címkéi is kereshetők
				const keywords = new Set<string>(chunk.metaKeywords);
				for (const word of tokenize(chunk.content)) {
					for (const variant of stemVariants(word)) {
						keywords.add(variant);
					}
				}

				for (const keyword of keywords) {
					const ids = keywordIndex.get(keyword);
					if (ids) {
						ids.push(chunk.id);
					} else {
						keywordIndex.set(keyword, [chunk.id]);
					}
				}
			}
		}

		console.log(
			`[DocumentIndexer] Index építve (${locale}): ${documentsMap.size} dokumentum, ${chunksMap.size} chunk, ${keywordIndex.size} kulcsszó`
		);

		return {
			locale,
			documents: documentsMap,
			chunks: chunksMap,
			keywordIndex,
			lastIndexed: new Date(),
			documentCount: documentsMap.size,
			chunkCount: chunksMap.size
		};
	}

	/**
	 * A cím és a frontmatter címkék kulcsszavai (szótövekkel együtt)
	 */
	private extractMetaKeywords(document: Document): string[] {
		const keywords = new Set<string>();
		for (const word of tokenize([document.title, ...document.tags].join(' '))) {
			for (const variant of stemVariants(word)) {
				keywords.add(variant);
			}
		}
		return [...keywords];
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
		if (relativePath.includes('/developer/') || relativePath.includes('\\developer\\')) {
			return 'developer';
		}
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
}
