/**
 * Súgó oldalak frontmatter feldolgozása (Starlight formátum).
 *
 * Függőség nélküli modul: a scripts/sync-help-docs.ts és a szerver oldali
 * plugin súgó olvasás is ezt használja.
 */

export interface HelpFrontmatter {
	title?: string;
	description?: string;
	/** A sidebar.order értéke. */
	order?: number;
}

/**
 * A frontmatter title, description és sidebar.order mezőinek kiolvasása.
 *
 * @param source - A markdown fájl tartalma
 * @returns A talált mezők
 */
export function parseHelpFrontmatter(source: string): HelpFrontmatter {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return {};

	const result: HelpFrontmatter = {};
	let section = '';
	for (const line of match[1].split(/\r?\n/)) {
		const top = line.match(/^([\w-]+):\s*(.*)$/);
		if (top) {
			section = top[1];
			const value = unquote(top[2]);
			if (section === 'title') result.title = value;
			if (section === 'description') result.description = value;
			continue;
		}
		const nested = line.match(/^\s+order:\s*(-?\d+)/);
		if (nested && section === 'sidebar') result.order = Number(nested[1]);
	}
	return result;
}

/**
 * A frontmatter blokk eltávolítása a markdown elejéről.
 *
 * @param source - A markdown fájl tartalma
 * @returns A tartalom frontmatter nélkül
 */
export function stripHelpFrontmatter(source: string): string {
	return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

function unquote(value: string): string {
	const trimmed = value.trim();
	if (/^(['"]).*\1$/.test(trimmed)) return trimmed.slice(1, -1);
	return trimmed;
}
