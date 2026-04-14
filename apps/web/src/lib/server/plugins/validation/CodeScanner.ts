/**
 * Code Scanner
 *
 * Veszélyes kódminták detektálása plugin fájlokban.
 */

import type { CodeScanResult, DangerousPattern } from '@racona/database';

/**
 * Veszélyes minták definíciója
 */
const DANGEROUS_PATTERNS = [
	{
		name: 'eval()',
		regex: /\beval\s*\(/g,
		description: 'Direct use of eval() function'
	},
	{
		name: 'Function()',
		regex: /\bnew\s+Function\s*\(/g,
		description: 'Dynamic function creation with Function constructor'
	},
	{
		name: 'innerHTML',
		regex: /\.innerHTML\s*=/g,
		description: 'Direct innerHTML assignment (XSS risk)'
	},
	{
		name: 'dangerouslySetInnerHTML',
		regex: /dangerouslySetInnerHTML\s*=/g,
		description: 'React dangerouslySetInnerHTML usage'
	},
	{
		name: 'document.write()',
		regex: /\bdocument\.write\s*\(/g,
		description: 'Use of document.write()'
	},
	{
		name: 'external fetch',
		regex: /\bfetch\s*\(\s*['"`](https?:\/\/(?!localhost|127\.0\.0\.1))/g,
		description: 'Fetch to external domain'
	},
	{
		name: 'external XMLHttpRequest',
		regex: /\bXMLHttpRequest\s*\(/g,
		description: 'XMLHttpRequest usage (check for external domains)'
	},
	{
		name: 'dynamic import',
		regex: /\bimport\s*\(\s*['"`](https?:\/\/)/g,
		description: 'Dynamic import from external URL'
	}
] as const;

/**
 * Whitelist - biztonságos használati esetek
 */
const WHITELIST_PATTERNS = [
	// Kommentek
	/\/\/.*/g,
	/\/\*[\s\S]*?\*\//g,
	// String literálok (nem végrehajtott kód)
	/['"`].*?['"`]/g
];

/**
 * Svelte compiler által generált biztonságos minták
 * Ezek a minták a Svelte belső működéséhez szükségesek és biztonságosak
 */
const SVELTE_SAFE_PATTERNS = [
	// Svelte template innerHTML használat
	/n\.innerHTML\s*=\s*e\.replaceAll/,
	// Svelte createElement + innerHTML pattern
	/document\.createElement\(['"']template['"']\)[\s\S]{0,100}\.innerHTML/,
	// Svelte internal template handling
	/template\.innerHTML\s*=.*replaceAll/
];

/**
 * Code Scanner osztály
 */
export class CodeScanner {
	/**
	 * Fájlok szkennelése veszélyes minták után
	 *
	 * @param files - Fájlok Map-je (fájlnév -> tartalom)
	 * @returns Szkennelési eredmény
	 */
	async scanCode(files: Map<string, Buffer>): Promise<CodeScanResult> {
		const dangerousPatterns: DangerousPattern[] = [];

		// Csak kód fájlokat szkenneljük
		const codeExtensions = ['.js', '.mjs', '.ts', '.svelte', '.jsx', '.tsx'];

		for (const [fileName, content] of files.entries()) {
			// Fájl kiterjesztés ellenőrzés
			const hasCodeExtension = codeExtensions.some((ext) => fileName.endsWith(ext));
			if (!hasCodeExtension) continue;

			try {
				const code = content.toString('utf-8');

				// Szkennelés minden veszélyes mintára
				for (const pattern of DANGEROUS_PATTERNS) {
					const matches = this.findMatches(code, pattern.regex, fileName);

					for (const match of matches) {
						// Whitelist ellenőrzés
						if (!this.isWhitelisted(code, match.index)) {
							dangerousPatterns.push({
								pattern: pattern.name,
								file: fileName,
								line: match.line,
								context: match.context
							});
						}
					}
				}
			} catch (error) {
				console.error(`Error scanning file ${fileName}:`, error);
			}
		}

		return {
			passed: dangerousPatterns.length === 0,
			dangerousPatterns
		};
	}

	/**
	 * Minták keresése a kódban
	 */
	private findMatches(
		code: string,
		regex: RegExp,
		fileName: string
	): Array<{ index: number; line: number; context: string }> {
		const matches: Array<{ index: number; line: number; context: string }> = [];
		const lines = code.split('\n');

		let match: RegExpExecArray | null;
		while ((match = regex.exec(code)) !== null) {
			const index = match.index;

			// Sor szám meghatározása
			let currentPos = 0;
			let lineNumber = 1;
			let lineContent = '';

			for (const line of lines) {
				if (currentPos + line.length >= index) {
					lineContent = line.trim();
					break;
				}
				currentPos += line.length + 1; // +1 a newline miatt
				lineNumber++;
			}

			// Kontextus (max 100 karakter)
			const contextStart = Math.max(0, index - 50);
			const contextEnd = Math.min(code.length, index + 50);
			const context = code.substring(contextStart, contextEnd).trim();

			matches.push({
				index,
				line: lineNumber,
				context: context.length > 100 ? context.substring(0, 100) + '...' : context
			});
		}

		return matches;
	}

	/**
	 * Whitelist ellenőrzés
	 *
	 * Ellenőrzi, hogy a találat kommentben, string literálban vagy Svelte belső kódban van-e.
	 */
	private isWhitelisted(code: string, index: number): boolean {
		// 1. Svelte safe patterns ellenőrzés
		// Kontextus a találat körül (200 karakter)
		const contextStart = Math.max(0, index - 100);
		const contextEnd = Math.min(code.length, index + 100);
		const context = code.substring(contextStart, contextEnd);

		for (const sveltePattern of SVELTE_SAFE_PATTERNS) {
			if (sveltePattern.test(context)) {
				return true;
			}
		}

		// 2. Komment és string literál ellenőrzés
		for (const whitelistPattern of WHITELIST_PATTERNS) {
			whitelistPattern.lastIndex = 0; // Reset regex

			let match: RegExpExecArray | null;
			while ((match = whitelistPattern.exec(code)) !== null) {
				const matchStart = match.index;
				const matchEnd = matchStart + match[0].length;

				if (index >= matchStart && index < matchEnd) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Egyedi fájl szkennelése
	 */
	async scanFile(fileName: string, content: string): Promise<DangerousPattern[]> {
		const files = new Map<string, Buffer>();
		files.set(fileName, Buffer.from(content, 'utf-8'));

		const result = await this.scanCode(files);
		return result.dangerousPatterns;
	}
}

/**
 * Singleton instance
 */
export const codeScanner = new CodeScanner();
