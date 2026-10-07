/**
 * Szövegfeldolgozó segédfüggvények a Knowledge Base-hez
 *
 * Az indexelés és a keresés ugyanazokat a szabályokat használja
 * (tokenizálás, stop words, szótövezés), így a két oldal mindig egyezik.
 */

/** Minimum szóhossz az indexeléshez és kereséshez */
export const MIN_WORD_LENGTH = 3;

/** Kizárt szavak (stop words) — nem informatív szavak magyarul és angolul */
export const STOP_WORDS: ReadonlySet<string> = new Set([
	// Magyar
	'az',
	'és',
	'vagy',
	'de',
	'hogy',
	'ha',
	'ez',
	'egy',
	'van',
	'volt',
	'lesz',
	'lehet',
	'meg',
	'át',
	'össze',
	'szét',
	'vissza',
	'ide',
	'oda',
	'itt',
	'ott',
	'fel',
	'ki',
	'be',
	'el',
	'le',
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
	'milyen',
	'mikor',
	'hol',
	'hova',
	'honnan',
	'miért',
	'kérdés',
	'válasz',
	// Általános kérdő igék, amik nem a témát jelölik
	'látom',
	'látok',
	'látni',
	'láthatom',
	'látható',
	'találom',
	'találok',
	'találni',
	'található',
	'tehetem',
	'teszem',
	'csinálom',
	'csinálok',
	'kérem',
	'lehetséges',
	// Angol
	'the',
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
]);

/** Gyakori magyar toldalékok (esetragok, többes szám, birtokos és igei végződések) */
const SUFFIXES = [
	'hatom',
	'hetem',
	'hatok',
	'hetek',
	'hatja',
	'hetik',
	'ható',
	'hető',
	'ból',
	'ből',
	'ban',
	'ben',
	'nak',
	'nek',
	'val',
	'vel',
	'ról',
	'ről',
	'hoz',
	'hez',
	'höz',
	'tól',
	'től',
	'unk',
	'ünk',
	'hat',
	'het',
	'ra',
	're',
	'ot',
	'et',
	'at',
	'öt',
	'ek',
	'ok',
	'ak',
	'ök',
	'am',
	'em',
	'om',
	'öm',
	'ja',
	'je',
	'ni',
	't',
	'm',
	'k'
];

/** Toldalékolás előtti tőváltozások: tálcá(t) → tálca, jelszav(am) → jelszó, igényel → igényl */
const STEM_ALTERNATIONS: [RegExp, string][] = [
	[/á$/, 'a'],
	[/é$/, 'e'],
	[/av$/, 'ó'],
	[/ev$/, 'ő'],
	// Kieső magánhangzó a toldalék előtt: igényel → igényl(és)
	[/([^aáeéiíoóöőuúüű])[eoö]([lr])$/, '$1$2'],
	// …és visszafelé: kérelm(et) → kérelem
	[/([^aáeéiíoóöőuúüű])([lmr])$/, '$1e$2']
];

/** Betű vagy szám (Unicode) — a \w csak ASCII-t ismer, ékezetes szavakhoz ez kell */
const WORD_CHAR = '[\\p{L}\\p{N}]';

/**
 * Szöveg szavakra bontása: kisbetűsítve, stop words és tisztán szám tokenek nélkül
 */
export function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.split(/[^\p{L}\p{N}]+/u)
		.filter(
			(word) => word.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(word) && !/^\d+$/.test(word)
		);
}

/**
 * Egy szó lehetséges szótövei legfeljebb két toldalék levágásával
 * (pl. "háttérképet" → "háttérkép", "jelszavamat" → "jelszavam" → "jelszó").
 * Az eredeti szót is tartalmazza. Hibás tövek is keletkezhetnek, de azok
 * egyszerűen nem találnak semmit az indexben.
 */
export function stemVariants(word: string): string[] {
	const variants = new Set<string>([word]);
	let current = [word];

	for (let depth = 0; depth < 2; depth++) {
		const next: string[] = [];
		for (const form of current) {
			for (const suffix of SUFFIXES) {
				if (!form.endsWith(suffix)) continue;
				const stem = form.slice(0, -suffix.length);
				if (stem.length < MIN_WORD_LENGTH) continue;
				for (const variant of [stem, ...alternations(stem)]) {
					if (!variants.has(variant)) {
						variants.add(variant);
						next.push(variant);
					}
				}
			}
		}
		current = next;
	}

	return [...variants];
}

function alternations(stem: string): string[] {
	return STEM_ALTERNATIONS.filter(([pattern]) => pattern.test(stem)).map(([pattern, replacement]) =>
		stem.replace(pattern, replacement)
	);
}

/** Reguláris kifejezés speciális karaktereinek escape-elése */
export function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Teljes szavas egyezések száma (Unicode-tudatos szóhatárral)
 */
export function countWholeWord(haystack: string, word: string): number {
	const regex = new RegExp(`(?<!${WORD_CHAR})${escapeRegExp(word)}(?!${WORD_CHAR})`, 'giu');
	return haystack.match(regex)?.length ?? 0;
}

/** Frontmatter adatai, amiket a Knowledge Base használ */
export interface Frontmatter {
	title?: string;
	tags: string[];
	aliases: string[];
}

/**
 * Frontmatter leválasztása a markdown tartalomról.
 * Egyszerű `kulcs: érték` és `kulcs: [a, b]` sorokat értelmez.
 */
export function parseFrontmatter(raw: string): { frontmatter: Frontmatter; body: string } {
	const frontmatter: Frontmatter = { tags: [], aliases: [] };
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	if (!match) {
		return { frontmatter, body: raw };
	}

	for (const line of match[1].split(/\r?\n/)) {
		const kv = line.match(/^(\w+):\s*(.*)$/);
		if (!kv) continue;
		const [, key, value] = kv;
		if (key === 'title') {
			frontmatter.title = unquote(value.trim());
		} else if (key === 'tags' || key === 'aliases') {
			frontmatter[key] = parseInlineList(value);
		}
	}

	return { frontmatter, body: raw.slice(match[0].length) };
}

function parseInlineList(value: string): string[] {
	const inner = value.trim().replace(/^\[/, '').replace(/\]$/, '');
	return inner
		.split(',')
		.map((item) => unquote(item.trim()))
		.filter(Boolean);
}

function unquote(value: string): string {
	return value.replace(/^["']|["']$/g, '');
}
