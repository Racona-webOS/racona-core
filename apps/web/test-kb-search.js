/**
 * Knowledge Base keresés tesztelő script
 *
 * Használat: node test-kb-search.js "keresési kifejezés"
 */

import { KnowledgeBaseService } from './src/lib/server/ai-assistant/knowledgeBaseService.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const kbPath = join(__dirname, 'static', 'knowledge-base');
const query = process.argv[2] || 'háttérkép beállítás';

console.log('='.repeat(80));
console.log('Knowledge Base Keresés Teszt');
console.log('='.repeat(80));
console.log('KB útvonal:', kbPath);
console.log('Keresési kifejezés:', query);
console.log('='.repeat(80));

const kbService = KnowledgeBaseService.getInstance(kbPath);

try {
	await kbService.initialize();
	console.log('\n✅ Inicializálás sikeres\n');

	// Státusz lekérdezés
	const status = kbService.getStatus();
	console.log('📊 Státusz:');
	console.log('  - Magyar dokumentumok:', status.locales.hu.documentCount);
	console.log('  - Magyar chunk-ok:', status.locales.hu.chunkCount);
	console.log('  - Angol dokumentumok:', status.locales.en.documentCount);
	console.log('  - Angol chunk-ok:', status.locales.en.chunkCount);
	console.log('  - Összes dokumentum:', status.totalDocuments);
	console.log('  - Összes chunk:', status.totalChunks);
	console.log('');

	// Keresés magyar nyelven
	console.log('🔍 Keresés magyar nyelven...\n');
	const searchResult = await kbService.search({
		query,
		userLocale: 'hu',
		maxResults: 5,
		enableFallback: true
	});

	console.log('📋 Keresési eredmények:');
	console.log('  - Találatok száma:', searchResult.totalResults);
	console.log('  - Magyar találatok:', searchResult.primaryLanguageResults);
	console.log('  - Angol találatok (fallback):', searchResult.fallbackLanguageResults);
	console.log('  - Keresési stratégia:', searchResult.searchStrategy);
	console.log('  - Keresési idő:', searchResult.searchTime, 'ms');
	console.log('');

	if (searchResult.results.length === 0) {
		console.log('❌ Nincs találat!');
		console.log('');
		console.log('🔧 Debug információk:');
		console.log('  - Keresési kulcsszavak:', query.toLowerCase().split(/\s+/));
	} else {
		console.log('✅ Találatok:\n');
		searchResult.results.forEach((result, index) => {
			console.log(`${index + 1}. ${result.chunk.documentTitle}`);
			console.log(`   Pontszám: ${result.score.toFixed(4)}`);
			console.log(`   Kulcsszavak: ${result.matchedKeywords.join(', ')}`);
			console.log(`   Nyelv: ${result.chunk.locale}`);
			console.log(`   Tartalom (első 200 karakter):`);
			console.log(`   ${result.chunk.content.substring(0, 200)}...`);
			console.log('');
		});
	}

	console.log('='.repeat(80));
} catch (error) {
	console.error('❌ Hiba:', error);
	process.exit(1);
}
