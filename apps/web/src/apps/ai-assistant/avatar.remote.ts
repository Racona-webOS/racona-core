/**
 * Avatar Remote Actions — AI Assistant alkalmazás szerver oldali akciói.
 *
 * Parancsok és lekérdezések az avatar telepítéshez, listázáshoz és konfigurációhoz.
 * Requirements: 5.1–5.7, 4.5, 9.7
 */

import { command, query, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import path from 'path';
import { avatarRepository } from '$lib/server/database/repositories';
import type { AiAvatarSelectModel, UserAvatarConfigSelectModel } from '@racona/database/schemas';

// ============================================================================
// Manifest validátor (inline — a @webos/ai-avatar csomag CLI eszköz, nem importálható)
// ============================================================================

type Quality = 'sd' | 'hd';

interface AvatarManifest {
	idname: string;
	displayName: string;
	descriptions: { hu: string; en: string };
	availableQualities: Quality[];
}

const KEBAB_CASE_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function validateManifest(raw: unknown): {
	valid: boolean;
	errors: string[];
	manifest?: AvatarManifest;
} {
	const errors: string[] = [];
	if (typeof raw !== 'object' || raw === null) {
		return { valid: false, errors: ['A manifest.json nem érvényes JSON objektum.'] };
	}
	const obj = raw as Record<string, unknown>;
	if (typeof obj['idname'] !== 'string' || obj['idname'].trim() === '') {
		errors.push('Hiányzó vagy üres mező: "idname"');
	} else if (!KEBAB_CASE_RE.test(obj['idname'])) {
		errors.push(`Az "idname" mező nem kebab-case formátumú: "${obj['idname']}"`);
	}
	if (typeof obj['displayName'] !== 'string' || obj['displayName'].trim() === '') {
		errors.push('Hiányzó vagy üres mező: "displayName"');
	}
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

	// availableQualities validálás
	if (!Array.isArray(obj['availableQualities'])) {
		errors.push('Hiányzó vagy érvénytelen mező: "availableQualities"');
	} else {
		const qualities = obj['availableQualities'] as unknown[];
		if (qualities.length === 0) {
			errors.push('Az "availableQualities" tömb nem lehet üres.');
		}
		for (const q of qualities) {
			if (q !== 'sd' && q !== 'hd') {
				errors.push(`Érvénytelen minőségi szint: "${q}"`);
			}
		}
	}

	if (errors.length === 0) {
		// A fenti ellenőrzések minden kötelező mezőt lefedtek, de a fordító ezt
		// nem tudja követni: az obj típusa Record<string, unknown> maradt, amiből
		// nincs közvetlen átjárás az AvatarManifest felé.
		return { valid: true, errors: [], manifest: obj as unknown as AvatarManifest };
	}

	return { valid: errors.length === 0, errors };
}

// ============================================================================
// Manifest fájl neve
// ============================================================================

const MANIFEST_FILENAME = 'manifest.json';

// ============================================================================
// Avatar feltöltési könyvtár
// ============================================================================

function getAvatarUploadDir(idname: string): string {
	return path.join(process.cwd(), 'uploads', 'ai-avatar', idname);
}

// ============================================================================
// Sémák
// ============================================================================

/** installAvatar: base64 kódolt .raconapkg fájl */
const installAvatarSchema = v.object({
	/** A .raconapkg fájl neve (pl. "my-avatar_ai_avatar.raconapkg") */
	fileName: v.pipe(v.string(), v.endsWith('.raconapkg')),
	/** A fájl tartalma base64 kódolva */
	fileData: v.pipe(v.string(), v.minLength(1))
});

/** saveAvatarConfig: felhasználói avatar konfiguráció */
const saveAvatarConfigSchema = v.object({
	avatarIdname: v.pipe(v.string(), v.minLength(1)),
	quality: v.union([v.literal('sd'), v.literal('hd')]),
	customName: v.optional(v.nullable(v.string()))
});

// ============================================================================
// Válasz típusok
// ============================================================================

export interface InstallAvatarResult {
	success: boolean;
	error?: string;
	avatar?: AiAvatarSelectModel;
}

export interface ListAvatarsResult {
	success: boolean;
	error?: string;
	avatars: AiAvatarSelectModel[];
}

export interface GetAvatarConfigResult {
	success: boolean;
	error?: string;
	config: UserAvatarConfigSelectModel | null;
}

export interface SaveAvatarConfigResult {
	success: boolean;
	error?: string;
	config?: UserAvatarConfigSelectModel;
}

// ============================================================================
// installAvatar — .raconapkg csomag telepítése
// ============================================================================

/**
 * Avatar csomag telepítése.
 * - Validálja a ZIP tartalmát (kötelező fájlok, manifest)
 * - Ellenőrzi a duplikált idname-t
 * - Kicsomagolja a fájlokat az uploads/ai-avatar/[idname]/ könyvtárba
 * - Létrehozza az adatbázis rekordot
 */
export const installAvatar = command(
	installAvatarSchema,
	async ({ fileName, fileData }): Promise<InstallAvatarResult> => {
		const event = getRequestEvent();
		const { locals } = event;

		if (!locals.user?.id) {
			return { success: false, error: 'Nem vagy bejelentkezve.' };
		}

		try {
			// 1. Base64 dekódolás
			const buffer = Buffer.from(fileData, 'base64');

			// 2. ZIP megnyitása
			let zip: AdmZip;
			try {
				zip = new AdmZip(buffer);
			} catch {
				return { success: false, error: 'Érvénytelen .raconapkg fájl (nem olvasható ZIP).' };
			}

			const entries = zip.getEntries();
			const entryNames = entries.map((e) => e.entryName);

			// 3. manifest.json beolvasása és validálása
			const manifestEntry = entries.find((e) => e.entryName === MANIFEST_FILENAME);
			if (!manifestEntry) {
				return { success: false, error: `Hiányzó fájl a csomagból: ${MANIFEST_FILENAME}` };
			}

			let manifest: unknown;
			try {
				manifest = JSON.parse(manifestEntry.getData().toString('utf-8'));
			} catch {
				return { success: false, error: 'A manifest.json nem érvényes JSON.' };
			}

			const manifestValidation = validateManifest(manifest);
			if (!manifestValidation.valid) {
				return {
					success: false,
					error: `Érvénytelen manifest.json: ${manifestValidation.errors.join(', ')}`
				};
			}

			const validatedManifest = manifestValidation.manifest!;
			const { idname, displayName, descriptions, availableQualities } = validatedManifest;

			// 4. Kötelező fájlok ellenőrzése (a manifest alapján)
			const requiredFiles = [
				...availableQualities.map((q) => `${idname}_${q}.glb`),
				`${idname}_cover.jpg`
			];

			for (const filename of requiredFiles) {
				if (!entryNames.includes(filename)) {
					return { success: false, error: `Hiányzó fájl a csomagból: ${filename}` };
				}
			}

			// 5. Duplikált idname ellenőrzése
			const existing = await avatarRepository.findAvatarByIdname(idname);
			if (existing) {
				return {
					success: false,
					error: `Már telepített avatar ezzel az azonosítóval: "${idname}"`
				};
			}

			// 6. Célkönyvtár létrehozása
			const targetDir = getAvatarUploadDir(idname);
			await fs.mkdir(targetDir, { recursive: true });

			// 7. Fájlok kicsomagolása
			const filesToExtract = [
				MANIFEST_FILENAME,
				...availableQualities.map((q) => `${idname}_${q}.glb`),
				`${idname}_cover.jpg`
			];

			for (const filename of filesToExtract) {
				const entry = entries.find((e) => e.entryName === filename);
				if (!entry) continue;
				const destPath = path.join(targetDir, filename);
				await fs.writeFile(destPath, entry.getData());
			}

			// 8. Adatbázis rekord létrehozása
			const avatar = await avatarRepository.insertAvatar({
				idname,
				displayName,
				manifest: { descriptions },
				availableQualities
			});

			console.log(`[AvatarInstall] Avatar telepítve: ${idname}`);

			return { success: true, avatar };
		} catch (err) {
			console.error('[AvatarInstall] Hiba:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Ismeretlen hiba történt.'
			};
		}
	}
);

// ============================================================================
// listAvatars — összes telepített avatar listázása
// ============================================================================

export const listAvatars = query(async (): Promise<ListAvatarsResult> => {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return { success: false, error: 'Nem vagy bejelentkezve.', avatars: [] };
	}

	try {
		const avatars = await avatarRepository.listAvatars();
		return { success: true, avatars };
	} catch (err) {
		console.error('[AvatarList] Hiba:', err);
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Ismeretlen hiba történt.',
			avatars: []
		};
	}
});

// ============================================================================
// getAvatarConfig — aktuális felhasználó avatar konfigurációja
// ============================================================================

export const getAvatarConfig = query(async (): Promise<GetAvatarConfigResult> => {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return { success: false, error: 'Nem vagy bejelentkezve.', config: null };
	}

	try {
		const userId = parseInt(locals.user.id);
		const config = await avatarRepository.getUserAvatarConfig(userId);
		return { success: true, config };
	} catch (err) {
		console.error('[AvatarConfig] Hiba:', err);
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Ismeretlen hiba történt.',
			config: null
		};
	}
});

// ============================================================================
// saveAvatarConfig — felhasználói avatar konfiguráció mentése
// ============================================================================

export const saveAvatarConfig = command(
	saveAvatarConfigSchema,
	async ({ avatarIdname, quality, customName }): Promise<SaveAvatarConfigResult> => {
		const event = getRequestEvent();
		const { locals } = event;

		if (!locals.user?.id) {
			return { success: false, error: 'Nem vagy bejelentkezve.' };
		}

		try {
			const userId = parseInt(locals.user.id);

			// Avatar létezésének ellenőrzése
			const avatar = await avatarRepository.findAvatarByIdname(avatarIdname);
			if (!avatar) {
				return { success: false, error: `Nem található avatar: "${avatarIdname}"` };
			}

			// Ellenőrizzük, hogy a kiválasztott minőség elérhető-e
			if (!avatar.availableQualities.includes(quality)) {
				return {
					success: false,
					error: `A kiválasztott minőség (${quality}) nem elérhető ehhez az avatarhoz.`
				};
			}

			const config = await avatarRepository.upsertUserAvatarConfig(userId, {
				avatarIdname,
				quality,
				customName: customName ?? null
			});

			return { success: true, config };
		} catch (err) {
			console.error('[AvatarConfig] Mentési hiba:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Ismeretlen hiba történt.'
			};
		}
	}
);
