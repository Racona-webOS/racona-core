// manifest.json validátor — ellenőrzi a kötelező mezőket

/** Elérhető minőségi szintek */
export type Quality = 'sd' | 'hd';

/** A manifest.json elvárt struktúrája */
export interface AvatarManifest {
	idname: string;
	displayName: string;
	descriptions: {
		hu: string;
		en: string;
	};
	availableQualities: Quality[];
}

/** Kebab-case formátum ellenőrzése */
const KEBAB_CASE_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	manifest?: AvatarManifest;
}

/**
 * Ellenőrzi, hogy a manifest objektum tartalmazza az összes kötelező mezőt
 * és azok megfelelő formátumban vannak-e.
 */
export function validateManifest(raw: unknown): ValidationResult {
	const errors: string[] = [];

	if (typeof raw !== 'object' || raw === null) {
		return { valid: false, errors: ['A manifest.json nem érvényes JSON objektum.'] };
	}

	const obj = raw as Record<string, unknown>;

	// idname — kötelező, kebab-case
	if (typeof obj['idname'] !== 'string' || obj['idname'].trim() === '') {
		errors.push('Hiányzó vagy üres mező: "idname"');
	} else if (!KEBAB_CASE_RE.test(obj['idname'])) {
		errors.push(`Az "idname" mező nem kebab-case formátumú: "${obj['idname']}"`);
	}

	// displayName — kötelező, nem üres string
	if (typeof obj['displayName'] !== 'string' || obj['displayName'].trim() === '') {
		errors.push('Hiányzó vagy üres mező: "displayName"');
	}

	// descriptions — kötelező objektum hu és en mezőkkel
	if (typeof obj['descriptions'] !== 'object' || obj['descriptions'] === null) {
		errors.push('Hiányzó mező: "descriptions" (kötelező: hu, en)');
	} else {
		const desc = obj['descriptions'] as Record<string, unknown>;
		if (typeof desc['hu'] !== 'string' || desc['hu'].trim() === '') {
			errors.push('Hiányzó vagy üres mező: "descriptions.hu"');
		}
		if (typeof desc['en'] !== 'string' || desc['en'].trim() === '') {
			errors.push('Hiányzó vagy üres mező: "descriptions.en"');
		}
	}

	// availableQualities — kötelező tömb, legalább egy elem (sd vagy hd)
	if (!Array.isArray(obj['availableQualities'])) {
		errors.push(
			'Hiányzó vagy érvénytelen mező: "availableQualities" (kötelező tömb: ["sd"], ["hd"], vagy ["sd", "hd"])'
		);
	} else {
		const qualities = obj['availableQualities'] as unknown[];

		if (qualities.length === 0) {
			errors.push(
				'Az "availableQualities" tömb nem lehet üres. Legalább egy minőségi szintet meg kell adni: "sd" vagy "hd"'
			);
		}

		const validQualities: Quality[] = [];
		for (const q of qualities) {
			if (q !== 'sd' && q !== 'hd') {
				errors.push(
					`Érvénytelen minőségi szint az "availableQualities" tömbben: "${q}". Csak "sd" vagy "hd" engedélyezett.`
				);
			} else {
				validQualities.push(q);
			}
		}

		// Duplikátumok ellenőrzése
		const uniqueQualities = new Set(validQualities);
		if (uniqueQualities.size !== validQualities.length) {
			errors.push('Az "availableQualities" tömbben duplikált értékek vannak.');
		}
	}

	if (errors.length === 0) {
		// A fenti ellenőrzések minden kötelező mezőt lefedtek, de a fordító ezt
		// nem tudja követni: az obj típusa Record<string, unknown> maradt, amiből
		// nincs közvetlen átjárás az AvatarManifest felé.
		return {
			valid: true,
			errors: [],
			manifest: obj as unknown as AvatarManifest
		};
	}

	return { valid: errors.length === 0, errors };
}
